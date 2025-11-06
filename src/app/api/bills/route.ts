import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bills, products, customers } from '@/db/schema';
import { gte, lte, eq, desc, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMode = searchParams.get('paymentMode');

    let query = db.select().from(bills).orderBy(desc(bills.createdAt));
    const conditions = [];

    if (startDate) {
      conditions.push(gte(bills.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(bills.createdAt, endDate));
    }

    if (paymentMode) {
      conditions.push(eq(bills.paymentMode, paymentMode));
    }

    if (conditions.length > 0) {
      query = db.select().from(bills).where(and(...conditions)).orderBy(desc(bills.createdAt)) as any;
    }

    const result = await query;

    return NextResponse.json({ bills: result });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    console.error('GET bills error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const body = await request.json();
    const { 
      customerId, 
      customerName, 
      customerPhone, 
      items, 
      subtotal, 
      discount, 
      gstAmount, 
      totalAmount, 
      paymentMode,
      loyaltyPointsRedeemed = 0,
      loyaltyPointsEarned = 0
    } = body;

    // Validate required fields
    if (!customerName || !items || items.length === 0 || subtotal === undefined || gstAmount === undefined || totalAmount === undefined || !paymentMode) {
      return NextResponse.json(
        { error: 'Customer name, items, subtotal, GST amount, total amount, and payment mode are required' },
        { status: 400 }
      );
    }

    // Auto-generate invoice number
    const lastBill = await db.select().from(bills).orderBy(desc(bills.id)).limit(1);
    let invoiceNumber = 'DB2025-001';
    if (lastBill.length > 0 && lastBill[0].invoiceNumber) {
      const lastNumber = parseInt(lastBill[0].invoiceNumber.split('-')[1]);
      invoiceNumber = `DB2025-${String(lastNumber + 1).padStart(3, '0')}`;
    }

    // Reduce stock for each item
    for (const item of items) {
      const productResult = await db.select().from(products).where(eq(products.id, item.productId));
      if (productResult.length === 0) {
        return NextResponse.json(
          { error: `Product not found: ${item.productName}` },
          { status: 400 }
        );
      }

      const product = productResult[0];
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.productName}` },
          { status: 400 }
        );
      }

      await db.update(products)
        .set({ stock: product.stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    // Update customer loyalty points if customer exists
    if (customerId) {
      const customerResult = await db.select().from(customers).where(eq(customers.id, customerId));
      if (customerResult.length > 0) {
        const customer = customerResult[0];
        
        // Validate redemption
        if (loyaltyPointsRedeemed > customer.loyaltyPoints) {
          return NextResponse.json(
            { error: 'Insufficient loyalty points' },
            { status: 400 }
          );
        }
        
        // Calculate new points: current - redeemed + earned
        const newPoints = customer.loyaltyPoints - loyaltyPointsRedeemed + loyaltyPointsEarned;
        
        await db.update(customers)
          .set({ loyaltyPoints: newPoints })
          .where(eq(customers.id, customerId));
      }
    }

    // Create bill
    const newBill = await db.insert(bills).values({
      invoiceNumber,
      customerId: customerId || null,
      customerName,
      customerPhone: customerPhone || null,
      items: items as any,
      subtotal,
      discount: discount || 0,
      gstAmount,
      loyaltyPointsRedeemed,
      loyaltyPointsEarned,
      totalAmount,
      paymentMode,
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ bill: newBill[0] }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    console.error('POST bills error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}