"use client"

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Users, Search, Plus, Edit, Trash2, AlertCircle, Eye, Receipt, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ICustomer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  loyaltyPoints?: number;
  createdAt?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBill, setViewingBill] = useState<any>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{ customers: ICustomer[] }>('/customers');
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (err: any) {
      setError(err.message);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!Array.isArray(customers)) {
      setFilteredCustomers([]);
      return;
    }

    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }

      setIsDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewCustomer = async (customer: ICustomer) => {
    try {
      const data = await api.get<{ customer: ICustomer; bills: any[] }>(`/customers/${customer.id}`);
      setViewingCustomer(data);
      setIsViewDialogOpen(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditDialog = (customer: ICustomer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    resetForm();
  };

  const handleViewInvoice = async (billId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bills/${billId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bill');
      }

      const bill = await response.json();
      setViewingBill(bill);
      setIsInvoiceDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoice');
    }
  };

  const handlePrintInvoice = () => {
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
              size: 14.9cm 21cm;
              margin: 10mm;
            }
          }
        </style>
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${viewingBill?.invoiceNumber || ''}</title>
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

  const handleDownloadInvoice = async () => {
    if (!viewingBill) {
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
            
            // Replace all oklch colors with standard colors to fix html2canvas compatibility
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el) => {
              const element = el as HTMLElement;
              const computedStyle = window.getComputedStyle(element);
              
              // Convert oklch background colors to hex
              if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
                element.style.backgroundColor = '#ffffff';
              }
              
              // Convert oklch text colors to hex
              if (computedStyle.color && computedStyle.color.includes('oklch')) {
                element.style.color = '#000000';
              }
              
              // Convert oklch border colors to hex
              if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
                element.style.borderColor = '#000000';
              }
            });
          }
        }
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture invoice content');
      }

      // Custom size: 14.9cm width × 21cm height
      const pdfWidth = 149; // 14.9cm in mm
      const pdfHeight = 210; // 21cm in mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      const fileName = `invoice-${viewingBill.invoiceNumber || 'unknown'}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Customer Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage customer information and purchase history
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingCustomer(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the customer details below
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCustomer ? 'Update' : 'Add'} Customer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customers</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading customers...</p>
                </div>
              ) : !Array.isArray(filteredCustomers) || filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No customers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Purchases</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => {
                      const totalPurchases = typeof customer.totalPurchases === 'number' 
                        ? customer.totalPurchases 
                        : parseFloat(customer.totalPurchases as any) || 0;
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.email || '-'}</TableCell>
                          <TableCell>
                            <Badge>₹{totalPurchases.toFixed(2)}</Badge>
                          </TableCell>
                          <TableCell>
                            {customer.lastPurchaseDate
                              ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewCustomer(customer)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(customer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(customer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Customer Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View complete customer information and purchase history
              </DialogDescription>
            </DialogHeader>
            {viewingCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-lg font-semibold">{viewingCustomer.customer.name}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-lg font-semibold">{viewingCustomer.customer.phone}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-lg font-semibold">{viewingCustomer.customer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Total Purchases</Label>
                    <p className="text-lg font-semibold">
                      ₹{(typeof viewingCustomer.customer.totalPurchases === 'number' 
                        ? viewingCustomer.customer.totalPurchases 
                        : parseFloat(viewingCustomer.customer.totalPurchases as any) || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {viewingCustomer.customer.address && (
                  <div>
                    <Label>Address</Label>
                    <p className="text-lg">{viewingCustomer.customer.address}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Purchase History
                  </h3>
                  {viewingCustomer.bills && viewingCustomer.bills.length > 0 ? (
                    <div className="space-y-3">
                      {viewingCustomer.bills.map((bill: any) => (
                        <Card key={bill.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">{bill.invoiceNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(bill.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge>₹{bill.totalAmount?.toFixed(2) || '0.00'}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {bill.items?.length || 0} item(s) • {bill.paymentMode?.toUpperCase() || 'N/A'}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewInvoice(bill.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No purchase history
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice</DialogTitle>
              <DialogDescription>
                Bill #{viewingBill?.invoiceNumber}
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
                  <span className="info-label" style={{ fontWeight: 'bold' }}>A Memo No:</span> {viewingBill?.invoiceNumber}
                </div>
                <div className="info-item" style={{ fontSize: '14px', color: '#000' }}>
                  <span className="info-label" style={{ fontWeight: 'bold' }}>Date:</span> {viewingBill?.createdAt ? new Date(viewingBill.createdAt).toLocaleDateString('en-IN') : ''}
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
                  {(viewingBill?.items || []).map((item: any, index: number) => (
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
                      ₹{viewingBill?.totalAmount?.toFixed(2)}
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
              <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={handleDownloadInvoice}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handlePrintInvoice}>
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