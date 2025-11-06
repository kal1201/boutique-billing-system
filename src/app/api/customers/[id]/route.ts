import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, bills, billItems, products } from '@/db/schema';
import { eq, sql, desc, sum, max } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const customerResult = await db.select().from(customers).where(eq(customers.id, id));
    if (customerResult.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerBills = await db.select().from(bills)
      .where(eq(bills.customerId, id))
      .orderBy(desc(bills.createdAt))
      .limit(10);

    // Calculate total purchases - handle case with no bills
    let totalPurchases = 0;
    let lastPurchaseDate = null;

    if (customerBills.length > 0) {
      const purchaseSummary = await db
        .select({
          totalAmount: sum(bills.totalAmount),
          lastPurchase: max(bills.createdAt),
        })
        .from(bills)
        .where(eq(bills.customerId, id));

      const totalAmount = purchaseSummary[0]?.totalAmount;
      totalPurchases = totalAmount ? parseFloat(totalAmount as any) : 0;
      lastPurchaseDate = purchaseSummary[0]?.lastPurchase || null;
    }

    const customerWithPurchases = {
      ...customerResult[0],
      totalPurchases,
      lastPurchaseDate,
    };

    return NextResponse.json({
      customer: customerWithPurchases,
      bills: customerBills,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updatedCustomer = await db.update(customers)
      .set(body)
      .where(eq(customers.id, id))
      .returning();

    if (updatedCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCustomer[0]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Valid ID is required' },
        { status: 400 }
      );
    }

    const deletedCustomer = await db.delete(customers)
      .where(eq(customers.id, id))
      .returning();

    if (deletedCustomer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}