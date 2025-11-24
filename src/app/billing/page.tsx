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
import { ShoppingCart, Search, Plus, Minus, Trash2, Receipt, User, AlertCircle, CreditCard, Phone, Gift, Download, Printer } from 'lucide-react';
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
    
    if (!newCustomer.name.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (!newCustomer.phone.trim()) {
      toast.error('Please enter phone number');
      return;
    }

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
    if (!invoiceRef.current) {
      toast.error('Invoice not ready for printing');
      return;
    }

    try {
      const invoiceContent = invoiceRef.current.innerHTML;
      
      const printStyles = `
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
            color: black;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .invoice-header .blessing {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          .invoice-header img {
            width: 100px;
            height: 100px;
            margin: 0 auto 10px;
            display: block;
          }
          .invoice-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .invoice-header .address {
            font-size: 13px;
            margin: 3px 0;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 10px 0;
            border-bottom: 1px solid #000;
          }
          .info-item {
            font-size: 14px;
          }
          .info-label {
            font-weight: bold;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .invoice-table thead {
            background: #000;
            color: white;
          }
          .invoice-table th {
            padding: 8px;
            text-align: left;
            font-size: 12px;
            border: 1px solid #000;
          }
          .invoice-table th.center {
            text-align: center;
          }
          .invoice-table th.right {
            text-align: right;
          }
          .invoice-table td {
            padding: 8px;
            font-size: 13px;
            border: 1px solid #000;
          }
          .invoice-table td.center {
            text-align: center;
          }
          .invoice-table td.right {
            text-align: right;
          }
          .invoice-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #000;
          }
          .footer-info {
            font-size: 11px;
            margin-bottom: 15px;
          }
          .footer-terms {
            font-size: 10px;
            line-height: 1.4;
          }
          .thank-you {
            text-align: right;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
          }
          .total-row {
            font-weight: bold;
            background: #f0f0f0;
          }
          @media print {
            body {
              padding: 0;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        </style>
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${currentBill?.invoiceNumber || ''}</title>
            <meta charset="utf-8">
            ${printStyles}
          </head>
          <body>
            ${invoiceContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 100);
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups for printing');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      toast.success('Print dialog will open shortly');

    } catch (error: any) {
      console.error('Print setup error:', error);
      toast.error('Failed to prepare invoice for printing');
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentBill) {
      toast.error('Invoice not ready for download');
      return;
    }

    try {
      toast.info('Generating PDF, please wait...');

      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;

      if (!invoiceRef.current) {
        throw new Error('Invoice element not found');
      }

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.invoice-container');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.backgroundColor = '#ffffff';
            (clonedElement as HTMLElement).style.color = '#000000';
          }
        }
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture invoice content');
      }

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      const fileName = `invoice-${currentBill.invoiceNumber || 'unknown'}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
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
                      onClick={() => {
                        setNewCustomer({ 
                          name: '', 
                          phone: customerPhone, 
                          email: '', 
                          address: '' 
                        });
                        setIsAddCustomerOpen(true);
                      }}
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
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerPhone">Phone *</Label>
                  <Input
                    id="newCustomerPhone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="Enter phone number"
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
                    placeholder="Enter email (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerAddress">Address</Label>
                  <Input
                    id="newCustomerAddress"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Enter address (optional)"
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Generated</DialogTitle>
              <DialogDescription>
                Bill #{currentBill?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div 
              ref={invoiceRef} 
              className="invoice-container"
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: 'white',
                padding: '20px',
                color: '#000'
              }}
            >
              <div 
                className="invoice-header"
                style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  borderBottom: '2px solid #000',
                  paddingBottom: '15px'
                }}
              >
                <div className="blessing" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', textDecoration: 'underline' }}>
                  Shree Ganeshay Namah
                </div>
                <img 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/kalasiddhi-logo-1763964669194.png?width=8000&height=8000&resize=contain"
                  alt="Kala Siddhi Logo"
                  style={{ width: '100px', height: '100px', margin: '0 auto 10px', display: 'block' }}
                />
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px', color: '#000' }}>
                  (Kala Siddhi)
                </h1>
                <p className="address" style={{ fontSize: '13px', margin: '3px 0', color: '#000' }}>
                  Sh-6, Kasturi Plaza, Manpada Road,
                </p>
                <p className="address" style={{ fontSize: '13px', margin: '3px 0', color: '#000' }}>
                  Dombivli (E), Pin-421201.
                </p>
                <p className="address" style={{ fontSize: '13px', margin: '3px 0', color: '#000' }}>
                  M.: 7977696796 / 8097889063
                </p>
              </div>

              <div 
                className="invoice-info"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  margin: '20px 0',
                  padding: '10px 0',
                  borderBottom: '1px solid #000'
                }}
              >
                <div className="info-item" style={{ fontSize: '14px', color: '#000' }}>
                  <span className="info-label" style={{ fontWeight: 'bold' }}>A Memo No:</span> {currentBill?.invoiceNumber}
                </div>
                <div className="info-item" style={{ fontSize: '14px', color: '#000' }}>
                  <span className="info-label" style={{ fontWeight: 'bold' }}>Date:</span> {currentBill?.createdAt ? new Date(currentBill.createdAt).toLocaleDateString('en-IN') : ''}
                </div>
              </div>

              <table 
                className="invoice-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '20px'
                }}
              >
                <thead style={{ backgroundColor: '#000', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', border: '1px solid #000', color: '#fff' }}>
                      Sr No
                    </th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', border: '1px solid #000', color: '#fff' }}>
                      Code No
                    </th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', border: '1px solid #000', color: '#fff' }}>
                      Particulars
                    </th>
                    <th className="center" style={{ padding: '8px', textAlign: 'center', fontSize: '12px', border: '1px solid #000', color: '#fff' }}>
                      Qty
                    </th>
                    <th className="right" style={{ padding: '8px', textAlign: 'right', fontSize: '12px', border: '1px solid #000', color: '#fff' }}>
                      Rate
                    </th>
                    <th className="right" style={{ padding: '8px', textAlign: 'right', fontSize: '12px', border: '1px solid #000', color: '#fff' }}>
                      Rupees
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(currentBill?.items || []).map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', fontSize: '13px', border: '1px solid #000', color: '#000' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '8px', fontSize: '13px', border: '1px solid #000', color: '#000' }}>
                        {item.productId || '-'}
                      </td>
                      <td style={{ padding: '8px', fontSize: '13px', border: '1px solid #000', color: '#000' }}>
                        {item.productName}
                      </td>
                      <td className="center" style={{ padding: '8px', textAlign: 'center', fontSize: '13px', border: '1px solid #000', color: '#000' }}>
                        {item.quantity}
                      </td>
                      <td className="right" style={{ padding: '8px', textAlign: 'right', fontSize: '13px', border: '1px solid #000', color: '#000' }}>
                        ₹{item.price?.toFixed(2)}
                      </td>
                      <td className="right" style={{ padding: '8px', textAlign: 'right', fontSize: '13px', border: '1px solid #000', color: '#000' }}>
                        ₹{item.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row" style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                    <td colSpan={5} style={{ padding: '8px', fontSize: '14px', border: '1px solid #000', textAlign: 'right', color: '#000' }}>
                      Total
                    </td>
                    <td className="right" style={{ padding: '8px', textAlign: 'right', fontSize: '14px', border: '1px solid #000', fontWeight: 'bold', color: '#000' }}>
                      ₹{currentBill?.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div 
                className="invoice-footer"
                style={{
                  marginTop: '30px',
                  paddingTop: '15px',
                  borderTop: '2px solid #000'
                }}
              >
                <div className="footer-info" style={{ fontSize: '11px', marginBottom: '15px', color: '#000' }}>
                  <p><strong>GSTIN : 27BNCPC7023B1Z0</strong></p>
                  <p>Composition Taxable Person not eligible to collect tax on suppliers</p>
                </div>
                <div className="footer-terms" style={{ fontSize: '10px', lineHeight: '1.4', color: '#000' }}>
                  <p><strong>Terms and Conditions</strong></p>
                  <p>Goods once sold will not be taken back.</p>
                  <p>Used or washed clothes will not be exchanged.</p>
                  <p>Clothes can be exchanged separately.</p>
                  <p>Goods exchanged within 7 days between 12 & 4 pm.</p>
                  <p>No guarantee for silk material.</p>
                </div>
                <div className="thank-you" style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', marginTop: '20px', color: '#000' }}>
                  Thank You
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvoice(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}