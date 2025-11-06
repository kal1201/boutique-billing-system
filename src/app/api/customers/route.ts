import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, bills } from '@/db/schema';
import { like, or, desc, eq, sum, max, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = db.select().from(customers).orderBy(desc(customers.createdAt));

    if (search) {
      query = db.select().from(customers).where(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`),
          like(customers.email, `%${search}%`)
        )
      ).orderBy(desc(customers.createdAt)) as any;
    }

    const result = await query;

    // Optimize: Get all purchase data in a single query using LEFT JOIN
    const purchaseData = await db
      .select({
        customerId: bills.customerId,
        totalAmount: sum(bills.totalAmount).as('total_amount'),
        lastPurchase: max(bills.createdAt).as('last_purchase'),
      })
      .from(bills)
      .groupBy(bills.customerId);

    // Create a map for quick lookup
    const purchaseMap = new Map(
      purchaseData.map(p => [
        p.customerId,
        {
          totalPurchases: p.totalAmount ? parseFloat(p.totalAmount as any) : 0,
          lastPurchaseDate: p.lastPurchase,
        }
      ])
    );

    // Merge customer data with purchase data
    const customersWithPurchases = result.map(customer => ({
      ...customer,
      totalPurchases: purchaseMap.get(customer.id)?.totalPurchases || 0,
      lastPurchaseDate: purchaseMap.get(customer.id)?.lastPurchaseDate || null,
    }));

    return NextResponse.json({ customers: customersWithPurchases });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('GET customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const { name, phone, email, address } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const newCustomer = await db.insert(customers).values({
      name,
      phone,
      email: email || null,
      address: address || null,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newCustomer[0], { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('POST customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}