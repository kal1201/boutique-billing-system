"use client"

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { ShoppingCart, Search, Plus, Minus, Trash2, Receipt, User, AlertCircle, CreditCard, Phone, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface IProduct {
  id: number;
  name: string;
  category: string;
  size?: string;
  color?: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  gstPercent: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ICustomer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints?: number;
  createdAt?: string;
}

interface CartItem {
  product: IProduct;
  quantity: number;
}

export default function BillingPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [gstRate, setGstRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi' | 'other'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentBill, setCurrentBill] = useState<any>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState<ICustomer[]>([]);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customerPhone.length >= 3) {
      const filtered = customers.filter(c => 
        c.phone.includes(customerPhone) || 
        c.name.toLowerCase().includes(customerPhone.toLowerCase())
      ).slice(0, 5);
      setPhoneSuggestions(filtered);
      setShowPhoneSuggestions(filtered.length > 0);
    } else {
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
    }
  }, [customerPhone, customers]);

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.loyaltyPoints) {
      const maxAllowed = Math.floor(calculateSubtotal() * 0.2);
      const maxPoints = Math.min(selectedCustomer.loyaltyPoints, maxAllowed);
      setMaxRedeemablePoints(maxPoints);
      if (pointsToRedeem > maxPoints) {
        setPointsToRedeem(maxPoints);
      }
    } else {
      setMaxRedeemablePoints(0);
      setPointsToRedeem(0);
    }
  }, [selectedCustomer, cart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneInputRef.current && !phoneInputRef.current.contains(event.target as Node)) {
        setShowPhoneSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get<{ products: IProduct[] }>('/products');
      setProducts((data?.products || []).filter(p => p.stock > 0));
    } catch (err: any) {
      setError(err.message);
      setProducts([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await api.get<{ customers: ICustomer[] }>('/customers');
      setCustomers(data?.customers || []);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  const selectCustomerFromSuggestion = (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setCustomerPhone(customer.phone);
    setCustomerName(customer.name);
    setShowPhoneSuggestions(false);
    toast.success(`Customer selected: ${customer.name}`);
  };

  const addToCart = (product: IProduct) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error(`Only ${product.stock} items available in stock`);
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (item && quantity > item.product.stock) {
      toast.error(`Only ${item.product.stock} items available`);
      return;
    }
    
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  };

  const calculateGST = () => {
    return (calculateSubtotal() * gstRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST() - discount - pointsToRedeem;
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingCustomer = customers.find(c => c.phone === newCustomer.phone);
    if (existingCustomer) {
      toast.error('Phone number already exists!');
      return;
    }

    try {
      const data = await api.post<{ customer: ICustomer }>('/customers', newCustomer);
      setCustomers([...customers, data.customer]);
      setSelectedCustomer(data.customer);
      setCustomerPhone(data.customer.phone);
      setCustomerName(data.customer.name);
      setIsAddCustomerOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      toast.success('Customer added successfully');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.sellingPrice,
        total: item.product.sellingPrice * item.quantity,
      }));

      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();
      const pointsEarned = Math.floor(subtotal * 0.01);

      const billData = {
        customerId: selectedCustomer?.id,
        customerName: customerName || selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: customerPhone || selectedCustomer?.phone || '',
        items,
        subtotal,
        gstAmount: calculateGST(),
        discount,
        loyaltyPointsRedeemed: pointsToRedeem,
        loyaltyPointsEarned: pointsEarned,
        totalAmount,
        paymentMode,
      };

      const response = await api.post<{ bill: any }>('/bills', billData);
      setCurrentBill(response.bill);
      setShowInvoice(true);
      toast.success(`Bill created! Points earned: ${pointsEarned}`);
      
      setCart([]);
      setSelectedCustomer(null);
      setCustomerPhone('');
      setCustomerName('');
      setGstRate(0);
      setDiscount(0);
      setPointsToRedeem(0);
      
      await fetchProducts();
      await fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && invoiceRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${currentBill?.invoiceNumber || ''}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Arial', sans-serif;
                padding: 20mm;
                background: white;
                color: #1a1a1a;
              }
              .invoice {
                max-width: 210mm;
                margin: 0 auto;
                background: white;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 3px solid #9333ea;
              }
              .header h1 {
                color: #9333ea;
                font-size: 42px;
                font-weight: bold;
                margin-bottom: 8px;
                letter-spacing: 1px;
              }
              .header .tagline {
                color: #666;
                font-size: 16px;
                font-style: italic;
                margin-bottom: 4px;
              }
              .header .address {
                color: #888;
                font-size: 14px;
              }
              .invoice-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
              }
              .info-section {
                flex: 1;
              }
              .info-section h3 {
                color: #9333ea;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 12px;
                letter-spacing: 0.5px;
              }
              .info-section p {
                font-size: 15px;
                margin-bottom: 6px;
                color: #333;
              }
              .info-section .label {
                font-weight: 600;
                color: #555;
                display: inline-block;
                min-width: 100px;
              }
              .invoice-number {
                font-size: 18px !important;
                font-weight: bold !important;
                color: #9333ea !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              thead {
                background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
                color: white;
              }
              th {
                padding: 16px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              th.text-center { text-align: center; }
              th.text-right { text-align: right; }
              tbody tr {
                border-bottom: 1px solid #e5e7eb;
                transition: background 0.2s;
              }
              tbody tr:hover {
                background: #f9fafb;
              }
              tbody tr:last-child {
                border-bottom: 2px solid #9333ea;
              }
              td {
                padding: 14px 12px;
                font-size: 15px;
                color: #333;
              }
              td.text-center { text-align: center; }
              td.text-right { text-align: right; }
              td.product-name {
                font-weight: 600;
                color: #1a1a1a;
              }
              .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 40px;
              }
              .totals {
                width: 350px;
                padding: 24px;
                background: #f9fafb;
                border-radius: 8px;
                border: 2px solid #e5e7eb;
              }
              .totals-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 15px;
              }
              .totals-row .label {
                color: #555;
                font-weight: 500;
              }
              .totals-row .value {
                font-weight: 600;
                color: #1a1a1a;
              }
              .totals-row.discount {
                color: #16a34a;
              }
              .totals-row.discount .value {
                color: #16a34a;
              }
              .totals-row.points {
                color: #9333ea;
              }
              .totals-row.points .value {
                color: #9333ea;
              }
              .totals-row.total {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 2px solid #9333ea;
                font-size: 20px;
                font-weight: bold;
              }
              .totals-row.total .label {
                color: #1a1a1a;
              }
              .totals-row.total .value {
                color: #9333ea;
              }
              .footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #e5e7eb;
              }
              .footer .thank-you {
                font-size: 20px;
                font-weight: bold;
                color: #9333ea;
                margin-bottom: 8px;
              }
              .footer .visit-again {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
              }
              .footer .contact {
                font-size: 13px;
                color: #888;
                margin-top: 20px;
              }
              @media print {
                body { 
                  padding: 0; 
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                @page { 
                  margin: 15mm;
                  size: A4;
                }
                .invoice {
                  box-shadow: none;
                }
                tbody tr:hover {
                  background: transparent;
                }
              }
            </style>
          </head>
          <body>
            ${invoiceRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-8 w-8" />
                Point of Sale
              </h1>
              <p className="text-muted-foreground mt-1">
                Create bills and manage sales
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Select Products</CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">{product.category}</p>
                              {product.size && (
                                <Badge variant="outline" className="mt-1 mr-1">
                                  {product.size}
                                </Badge>
                              )}
                              {product.color && (
                                <Badge variant="outline" className="mt-1">
                                  {product.color}
                                </Badge>
                              )}
                            </div>
                            <Badge>{product.stock} left</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">₹{product.sellingPrice.toFixed(2)}</span>
                            <Button size="sm" onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cart ({cart.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-2 p-2 border rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">₹{item.product.sellingPrice.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                              className="w-12 h-8 text-center"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2" ref={phoneInputRef}>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="customerPhone"
                        type="tel"
                        placeholder="Search by phone or name..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onFocus={() => customerPhone.length >= 3 && setShowPhoneSuggestions(true)}
                        className="pl-9"
                      />
                      {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {phoneSuggestions.map((customer) => (
                            <div
                              key={customer.id}
                              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                              onClick={() => selectCustomerFromSuggestion(customer)}
                            >
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                              {customer.loyaltyPoints !== undefined && customer.loyaltyPoints > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                                  <Gift className="h-3 w-3" />
                                  {customer.loyaltyPoints} points available
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedCustomer && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                          {selectedCustomer.name}
                        </p>
                        {selectedCustomer.email && (
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {selectedCustomer.email}
                          </p>
                        )}
                        {selectedCustomer.loyaltyPoints !== undefined && (
                          <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1 mt-1">
                            <Gift className="h-3 w-3" />
                            Loyalty Points: {selectedCustomer.loyaltyPoints}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter name or leave empty for walk-in"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={!!selectedCustomer}
                    />
                  </div>

                  {customerPhone && !selectedCustomer && customerPhone.length >= 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsAddCustomerOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Customer
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>GST Rate (%)</Label>
                    <Input
                      type="number"
                      value={gstRate}
                      onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Discount (₹)</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  {selectedCustomer && selectedCustomer.loyaltyPoints && selectedCustomer.loyaltyPoints > 0 && (
                    <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-600" />
                          Redeem Loyalty Points
                        </Label>
                        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900">
                          {selectedCustomer.loyaltyPoints} available
                        </Badge>
                      </div>
                      <Input
                        type="number"
                        value={pointsToRedeem}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPointsToRedeem(Math.min(value, maxRedeemablePoints));
                        }}
                        placeholder="0"
                        max={maxRedeemablePoints}
                      />
                      <p className="text-xs text-muted-foreground">
                        Max redeemable: {maxRedeemablePoints} points (₹{maxRedeemablePoints})
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        1 point = ₹1 discount • Max 20% of subtotal
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {gstRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>GST ({gstRate}%):</span>
                        <span>₹{calculateGST().toFixed(2)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    {pointsToRedeem > 0 && (
                      <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          Points Redeemed:
                        </span>
                        <span>-₹{pointsToRedeem.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    {selectedCustomer && (
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          Points to earn:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          +{Math.floor(calculateSubtotal() * 0.01)} points
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isLoading ? 'Processing...' : 'Complete Sale'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Enter customer details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newCustomerName">Name *</Label>
                  <Input
                    id="newCustomerName"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerPhone">Phone *</Label>
                  <Input
                    id="newCustomerPhone"
                    value={newCustomer.phone || customerPhone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerEmail">Email</Label>
                  <Input
                    id="newCustomerEmail"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerAddress">Address</Label>
                  <Input
                    id="newCustomerAddress"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Customer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Generated</DialogTitle>
              <DialogDescription>
                Bill #{currentBill?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div ref={invoiceRef} className="invoice">
              <div className="header">
                <h1>DressBill</h1>
                <p className="tagline">Boutique Billing System</p>
                <p className="address">Women's Fashion Store</p>
              </div>

              <div className="invoice-info">
                <div className="info-section">
                  <h3>Invoice Details</h3>
                  <p><span className="label">Invoice #:</span> <span className="invoice-number">{currentBill?.invoiceNumber}</span></p>
                  <p><span className="label">Date:</span> {currentBill?.createdAt ? new Date(currentBill.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                  <p><span className="label">Time:</span> {currentBill?.createdAt ? new Date(currentBill.createdAt).toLocaleTimeString('en-IN') : ''}</p>
                  <p><span className="label">Payment:</span> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{currentBill?.paymentMode}</span></p>
                </div>
                {currentBill?.customerName && currentBill.customerName !== 'Walk-in Customer' && (
                  <div className="info-section">
                    <h3>Customer Details</h3>
                    <p><span className="label">Name:</span> {currentBill.customerName}</p>
                    <p><span className="label">Phone:</span> {currentBill.customerPhone}</p>
                    {currentBill.loyaltyPointsEarned > 0 && (
                      <p style={{ color: '#9333ea', fontWeight: 'bold' }}>
                        <span className="label">Points Earned:</span> +{currentBill.loyaltyPointsEarned}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Item Description</th>
                    <th className="text-center" style={{ width: '15%' }}>Quantity</th>
                    <th className="text-right" style={{ width: '15%' }}>Price</th>
                    <th className="text-right" style={{ width: '20%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentBill?.items || []).map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="product-name">{item.productName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₹{item.price?.toFixed(2)}</td>
                      <td className="text-right">₹{item.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals-section">
                <div className="totals">
                  <div className="totals-row">
                    <span className="label">Subtotal:</span>
                    <span className="value">₹{currentBill?.subtotal?.toFixed(2)}</span>
                  </div>
                  {currentBill?.gstAmount > 0 && (
                    <div className="totals-row">
                      <span className="label">GST:</span>
                      <span className="value">₹{currentBill?.gstAmount?.toFixed(2)}</span>
                    </div>
                  )}
                  {currentBill?.discount > 0 && (
                    <div className="totals-row discount">
                      <span className="label">Discount:</span>
                      <span className="value">-₹{currentBill?.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  {currentBill?.loyaltyPointsRedeemed > 0 && (
                    <div className="totals-row points">
                      <span className="label">Points Redeemed:</span>
                      <span className="value">-₹{currentBill?.loyaltyPointsRedeemed?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="totals-row total">
                    <span className="label">Grand Total:</span>
                    <span className="value">₹{currentBill?.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="footer">
                <p className="thank-you">Thank You for Shopping with Us!</p>
                <p className="visit-again">We look forward to serving you again</p>
                <p className="contact">For inquiries: contact@dressbill.com | +91 12345 67890</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvoice(false)}>
                Close
              </Button>
              <Button onClick={handlePrint}>
                <Receipt className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}