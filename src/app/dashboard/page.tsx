"use client"

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  IndianRupee,
  AlertCircle,
  Receipt,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  stats: {
    totalSales: number;
    totalBills: number;
    totalDiscount: number;
    totalGST: number;
    totalProducts: number;
    totalCustomers: number;
  };
  paymentModes: { [key: string]: number };
  lowStockProducts: any[];
  dailySales: any[];
  topProducts: any[];
  period: string;
}

const COLORS = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching dashboard stats for period:', period);
      
      const data = await api.get<DashboardStats>(`/dashboard/stats?period=${period}`);
      console.log('Dashboard stats received:', data);
      
      setStats(data);
      toast.success('Dashboard loaded successfully');
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const paymentModeData = stats?.paymentModes ? Object.entries(stats.paymentModes).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  })) : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <LayoutDashboard className="h-8 w-8" />
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Overview of your boutique business
              </p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Error loading dashboard</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={fetchStats} variant="outline" size="sm" className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          ) : stats ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{stats?.stats?.totalSales?.toFixed(2) || '0.00'}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.stats?.totalBills || 0} transactions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Products</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.stats?.totalProducts || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats?.lowStockProducts?.length || 0} low stock
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.stats?.totalCustomers || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Registered</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">GST Collected</CardTitle>
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{stats?.stats?.totalGST?.toFixed(2) || '0.00'}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Discount: ₹{stats?.stats?.totalDiscount?.toFixed(2) || '0.00'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Modes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {paymentModeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={paymentModeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {paymentModeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          No payment data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats?.topProducts && stats.topProducts.length > 0 ? (
                        <div className="space-y-4">
                          {stats.topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{product._id}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {product.totalQuantity} units sold
                                  </p>
                                </div>
                              </div>
                              <Badge>₹{product.totalRevenue.toFixed(2)}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          No sales data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Low Stock Alert */}
                {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
                  <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-5 w-5" />
                        Low Stock Alert
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.lowStockProducts.map((product) => (
                          <div
                            key={product._id}
                            className="bg-white dark:bg-gray-800 p-4 rounded-lg border"
                          >
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            <Badge variant="destructive" className="mt-2">
                              Only {product.stock} left
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/billing">
                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">New Sale</p>
                          <p className="text-sm text-muted-foreground">Create a bill</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/inventory">
                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Manage Inventory</p>
                          <p className="text-sm text-muted-foreground">Add/Edit products</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/customers">
                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Customers</p>
                          <p className="text-sm text-muted-foreground">View all customers</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="sales" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.dailySales && stats.dailySales.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={stats.dailySales}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} name="Sales (₹)" />
                          <Line type="monotone" dataKey="bills" stroke="#f43f5e" strokeWidth={2} name="Bills" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No sales data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Daily Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.dailySales && stats.dailySales.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={stats.dailySales}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="sales" fill="#8b5cf6" name="Sales (₹)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No sales data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Products</p>
                          <p className="text-2xl font-bold">{stats?.stats?.totalProducts || 0}</p>
                        </div>
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                        <div>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">Low Stock Items</p>
                          <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                            {stats?.lowStockProducts?.length || 0}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Low Stock Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {stats.lowStockProducts.map((product) => (
                            <div
                              key={product._id}
                              className="flex items-center justify-between p-3 border rounded hover:bg-muted"
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.category}</p>
                              </div>
                              <Badge variant="destructive">{product.stock}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          All products are well stocked!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}