import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const { searchParams } = new URL(request.url);
    const activeFilter = searchParams.get('active');

    let query = db.select().from(offers).orderBy(desc(offers.createdAt));

    if (activeFilter === 'true') {
      query = query.where(eq(offers.isActive, true)) as any;
    } else if (activeFilter === 'false') {
      query = query.where(eq(offers.isActive, false)) as any;
    }

    const results = await query;

    return NextResponse.json({ offers: results }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json({ 
        error: error.message,
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const body = await request.json();
    const { title, description, discountPercent, discountAmount, validFrom, validUntil, imageUrl, isActive } = body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!description || description.trim() === '') {
      return NextResponse.json({ 
        error: "Description is required",
        code: "MISSING_DESCRIPTION" 
      }, { status: 400 });
    }

    // Validate at least one discount type is provided
    if (!discountPercent && !discountAmount) {
      return NextResponse.json({ 
        error: "At least one of discountPercent or discountAmount must be provided",
        code: "NO_DISCOUNT_PROVIDED" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      title: title.trim(),
      description: description.trim(),
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
      isActive: isActive !== undefined ? isActive : true
    };

    if (discountPercent !== undefined && discountPercent !== null) {
      insertData.discountPercent = parseFloat(discountPercent);
    }

    if (discountAmount !== undefined && discountAmount !== null) {
      insertData.discountAmount = parseFloat(discountAmount);
    }

    if (validFrom) {
      insertData.validFrom = validFrom;
    }

    if (validUntil) {
      insertData.validUntil = validUntil;
    }

    if (imageUrl) {
      insertData.imageUrl = imageUrl;
    }

    const newOffer = await db.insert(offers)
      .values(insertData)
      .returning();

    return NextResponse.json(newOffer[0], { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json({ 
        error: error.message,
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}