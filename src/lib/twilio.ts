import twilio from 'twilio';

// Twilio client initialization
export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.');
  }

  return twilio(accountSid, authToken);
}

// Phone number validation and formatting for India
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If no country code provided, assume India (+91)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  throw new Error('Invalid phone number format');
}

// Validate E.164 format
export function isValidE164(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms
const MAX_MESSAGES_PER_MINUTE = 10;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(identifier) || [];
  
  // Remove old timestamps outside the window
  const recentTimestamps = timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW
  );
  
  if (recentTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  
  recentTimestamps.push(now);
  rateLimitStore.set(identifier, recentTimestamps);
  return true;
}
