import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Test basic database connectivity with a simple count query
    const startTime = Date.now();
    const result = await db.select().from(customers).limit(1);
    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      queryTime: `${queryTime}ms`,
      recordsFetched: result.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}