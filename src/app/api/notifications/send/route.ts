import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { getTwilioClient, formatPhoneNumber, isValidE164, checkRateLimit } from '@/lib/twilio';

interface NotificationRequest {
  customerIds: number[];
  channel: 'whatsapp' | 'sms';
  message: string;
  offerId?: number;
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body: NotificationRequest = await request.json();
    const { customerIds, channel, message, offerId } = body;

    // Validate inputs
    if (!customerIds || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one customer must be selected', code: 'NO_CUSTOMERS' },
        { status: 400 }
      );
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required', code: 'NO_MESSAGE' },
        { status: 400 }
      );
    }

    if (!['whatsapp', 'sms'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be "whatsapp" or "sms"', code: 'INVALID_CHANNEL' },
        { status: 400 }
      );
    }

    // Character limit validation
    if (channel === 'sms' && message.length > 160) {
      return NextResponse.json(
        { error: 'SMS message exceeds 160 character limit', code: 'MESSAGE_TOO_LONG' },
        { status: 400 }
      );
    }

    if (channel === 'whatsapp' && message.length > 4096) {
      return NextResponse.json(
        { error: 'WhatsApp message exceeds 4096 character limit', code: 'MESSAGE_TOO_LONG' },
        { status: 400 }
      );
    }

    // Fetch customers from database
    const selectedCustomers = await db
      .select()
      .from(customers)
      .where(inArray(customers.id, customerIds));

    if (selectedCustomers.length === 0) {
      return NextResponse.json(
        { error: 'No valid customers found', code: 'NO_VALID_CUSTOMERS' },
        { status: 404 }
      );
    }

    // Check if Twilio is configured
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const smsNumber = process.env.TWILIO_SMS_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken) {
      return NextResponse.json(
        { 
          error: 'Twilio is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.',
          code: 'TWILIO_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    if (channel === 'whatsapp' && !whatsappNumber) {
      return NextResponse.json(
        { 
          error: 'WhatsApp sender number not configured. Please set TWILIO_WHATSAPP_NUMBER in environment variables.',
          code: 'WHATSAPP_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    if (channel === 'sms' && !smsNumber) {
      return NextResponse.json(
        { 
          error: 'SMS sender number not configured. Please set TWILIO_SMS_NUMBER in environment variables.',
          code: 'SMS_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    // Initialize Twilio client
    const twilioClient = getTwilioClient();
    
    const results = {
      successful: [] as string[],
      failed: [] as { phone: string; error: string }[],
      rateLimited: [] as string[],
    };

    // Send messages to each customer
    for (const customer of selectedCustomers) {
      if (!customer.phone) {
        results.failed.push({
          phone: customer.name,
          error: 'No phone number',
        });
        continue;
      }

      try {
        // Format and validate phone number
        const formattedNumber = formatPhoneNumber(customer.phone);
        
        if (!isValidE164(formattedNumber)) {
          results.failed.push({
            phone: customer.phone,
            error: 'Invalid E.164 format',
          });
          continue;
        }

        // Check rate limit
        if (!checkRateLimit(formattedNumber)) {
          results.rateLimited.push(customer.phone);
          continue;
        }

        // Send message based on channel
        if (channel === 'whatsapp') {
          await twilioClient.messages.create({
            from: `whatsapp:${whatsappNumber}`,
            to: `whatsapp:${formattedNumber}`,
            body: message,
          });
        } else {
          await twilioClient.messages.create({
            from: smsNumber,
            to: formattedNumber,
            body: message,
          });
        }

        results.successful.push(customer.phone);
      } catch (error: any) {
        console.error(`Failed to send to ${customer.phone}:`, error);
        
        let errorMessage = 'Unknown error';
        if (error.message) {
          if (error.message.includes('63018')) {
            errorMessage = 'Rate limit exceeded';
            results.rateLimited.push(customer.phone);
            continue;
          } else if (error.message.includes('63015')) {
            errorMessage = 'Not in WhatsApp sandbox';
          } else if (error.message.includes('21211')) {
            errorMessage = 'Invalid phone number';
          } else {
            errorMessage = error.message;
          }
        }
        
        results.failed.push({
          phone: customer.phone,
          error: errorMessage,
        });
      }
    }

    // Return comprehensive results
    return NextResponse.json(
      {
        success: true,
        summary: {
          total: selectedCustomers.length,
          successful: results.successful.length,
          failed: results.failed.length,
          rateLimited: results.rateLimited.length,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json(
        { error: error.message, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    console.error('Notification send error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send notifications: ' + error.message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
