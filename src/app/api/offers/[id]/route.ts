import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { offers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;

    const offer = await db.select().from(offers).where(eq(offers.id, parseInt(id))).limit(1);

    if (offer.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer[0], { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { title, description, discountPercent, discountAmount, validFrom, validUntil, imageUrl, isActive } = body;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent ? parseFloat(discountPercent) : null;
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount ? parseFloat(discountAmount) : null;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (validUntil !== undefined) updateData.validUntil = validUntil;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db.update(offers)
      .set(updateData)
      .where(eq(offers.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;

    const deleted = await db.delete(offers).where(eq(offers.id, parseInt(id))).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Offer deleted successfully' }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}