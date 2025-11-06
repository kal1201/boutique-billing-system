import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bills, products, customers } from '@/db/schema';
import { gte, sql, lte } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    // Get period from query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Calculate date range based on period
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const startDateISO = startDate.toISOString();

    // Run all queries in parallel for better performance
    const [periodBills, allProducts, allCustomers] = await Promise.all([
      db.select().from(bills).where(gte(bills.createdAt, startDateISO)),
      db.select().from(products),
      db.select().from(customers)
    ]);

    // Calculate stats
    const totalSales = periodBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalBills = periodBills.length;
    const totalDiscount = periodBills.reduce((sum, bill) => sum + (bill.discount || 0), 0);
    const totalGST = periodBills.reduce((sum, bill) => sum + (bill.gst || 0), 0);

    // Payment mode breakdown
    const paymentModes: { [key: string]: number } = {};
    periodBills.forEach(bill => {
      const mode = bill.paymentMode || 'cash';
      paymentModes[mode] = (paymentModes[mode] || 0) + bill.totalAmount;
    });

    const totalProducts = allProducts.length;

    // Low stock products (stock <= 10)
    const lowStockProducts = allProducts
      .filter(p => p.stock <= 10)
      .map(p => ({
        _id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        category: p.category,
      }));

    const totalCustomers = allCustomers.length;

    // Daily sales for charts
    const dailySalesMap: { [key: string]: { sales: number; bills: number } } = {};
    periodBills.forEach(bill => {
      const date = new Date(bill.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      if (!dailySalesMap[date]) {
        dailySalesMap[date] = { sales: 0, bills: 0 };
      }
      dailySalesMap[date].sales += bill.totalAmount;
      dailySalesMap[date].bills += 1;
    });

    const dailySales = Object.entries(dailySalesMap).map(([date, data]) => ({
      date,
      sales: data.sales,
      bills: data.bills,
    }));

    // Top selling products
    const itemsMap: { [key: string]: { totalQuantity: number; totalRevenue: number } } = {};
    periodBills.forEach(bill => {
      const items = bill.items as any[];
      items.forEach((item: any) => {
        if (!itemsMap[item.productName]) {
          itemsMap[item.productName] = { totalQuantity: 0, totalRevenue: 0 };
        }
        itemsMap[item.productName].totalQuantity += item.quantity;
        itemsMap[item.productName].totalRevenue += item.total;
      });
    });

    const topProducts = Object.entries(itemsMap)
      .map(([name, data]) => ({
        _id: name,
        totalQuantity: data.totalQuantity,
        totalRevenue: data.totalRevenue,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        totalSales,
        totalBills,
        totalDiscount,
        totalGST,
        totalProducts,
        totalCustomers,
      },
      paymentModes,
      lowStockProducts,
      dailySales,
      topProducts,
      period,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Token expired') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    console.error('GET stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}