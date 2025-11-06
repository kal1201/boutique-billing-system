import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { like, or, lte, and } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');

    let query = db.select().from(products);
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.category, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(like(products.category, category));
    }

    if (lowStock === 'true') {
      conditions.push(lte(products.stock, products.lowStockThreshold));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;

    return NextResponse.json({ products: result });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    console.error('GET products error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { name, sku, description, category, size, color, stock, lowStockThreshold, costPrice, sellingPrice, gstPercent, imageUrl } = body;

    // Validate required fields
    if (!name || !sku || !category || costPrice === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Name, SKU, category, cost price, and selling price are required' },
        { status: 400 }
      );
    }

    const newProduct = await db.insert(products).values({
      name,
      sku,
      description: description || null,
      category,
      size: size || null,
      color: color || null,
      stock: stock !== undefined ? stock : 0,
      lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 10,
      costPrice,
      sellingPrice,
      gstPercent: gstPercent !== undefined ? gstPercent : 0,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Admin access required' ? 403 : 401 }
      );
    }
    console.error('POST products error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}