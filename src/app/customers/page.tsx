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
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #9333ea;
            padding-bottom: 15px;
          }
          .invoice-header h1 {
            color: #9333ea;
            font-size: 32px;
            margin-bottom: 5px;
            font-weight: bold;
          }
          .invoice-header p {
            color: #666;
            font-size: 14px;
            margin: 2px 0;
          }
          .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-section p {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .text-right {
            text-align: right;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .invoice-table thead {
            border-bottom: 2px solid #333;
          }
          .invoice-table th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            color: #333;
          }
          .invoice-table th.center {
            text-align: center;
          }
          .invoice-table th.right {
            text-align: right;
          }
          .invoice-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .invoice-table td.center {
            text-align: center;
          }
          .invoice-table td.right {
            text-align: right;
          }
          .invoice-totals {
            border-top: 2px solid #333;
            padding-top: 20px;
            margin-left: auto;
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .totals-row.final {
            font-size: 18px;
            font-weight: bold;
            border-top: 1px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          .discount-row {
            color: #16a34a;
          }
          .invoice-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              padding: 0;
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
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      // Try to open new window first (works in most browsers)
      try {
        const printWindow = window.open('', '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
        
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          toast.success('Print dialog will open shortly!');
          return;
        }
      } catch (e) {
        console.log('window.open blocked, trying iframe method');
      }

      // Fallback: Use hidden iframe method (works in iframes/restricted environments)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        toast.error('Unable to create print document');
        document.body.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      toast.info('Preparing to print...');

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          toast.success('Print dialog opened!');
          
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        } catch (err) {
          console.error('Print error:', err);
          toast.error('Failed to open print dialog');
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }
      }, 1000);

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

      // Dynamic imports
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;

      // Create isolated iframe to prevent CSS variable inheritance
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-99999px;top:0;width:800px;height:1200px;border:0;background:#ffffff;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Unable to create iframe document');
      }

      // Write complete HTML with inline styles (no CSS variables)
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box;
              background-color: transparent;
              color: #000000;
            }
            body { 
              font-family: Arial, sans-serif; 
              background-color: #ffffff !important;
              color: #000000 !important;
              padding: 40px;
              width: 800px;
            }
          </style>
        </head>
        <body style="background-color: #ffffff !important;">
          <div style="width: 720px; background-color: #ffffff !important; color: #000000; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #9333ea; padding-bottom: 15px; background-color: transparent;">
              <h1 style="color: #9333ea; font-size: 32px; margin: 0 0 5px 0; font-weight: bold; background-color: transparent;">DressBill</h1>
              <p style="color: #666666; font-size: 14px; margin: 2px 0; background-color: transparent;">Boutique Billing System</p>
              <p style="color: #666666; font-size: 14px; margin: 2px 0; background-color: transparent;">Women's Fashion Store</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background-color: transparent;">
              <div style="background-color: transparent;">
                <p style="font-size: 14px; margin-bottom: 5px; color: #333333; background-color: transparent;"><strong style="background-color: transparent;">Bill Number:</strong></p>
                <p style="font-size: 14px; color: #000000; background-color: transparent;">${viewingBill.invoiceNumber}</p>
              </div>
              <div style="text-align: right; background-color: transparent;">
                <p style="font-size: 14px; margin-bottom: 5px; color: #333333; background-color: transparent;"><strong style="background-color: transparent;">Date:</strong></p>
                <p style="font-size: 14px; color: #000000; background-color: transparent;">${new Date(viewingBill.createdAt).toLocaleDateString()}</p>
              </div>
              ${viewingBill.customerName && viewingBill.customerName !== 'Walk-in Customer' ? `
              <div style="background-color: transparent;">
                <p style="font-size: 14px; margin-bottom: 5px; color: #333333; background-color: transparent;"><strong style="background-color: transparent;">Customer:</strong></p>
                <p style="font-size: 14px; color: #000000; background-color: transparent;">${viewingBill.customerName}</p>
                <p style="font-size: 14px; color: #000000; background-color: transparent;">${viewingBill.customerPhone}</p>
              </div>
              ` : ''}
              <div style="text-align: right; background-color: transparent;">
                <p style="font-size: 14px; margin-bottom: 5px; color: #333333; background-color: transparent;"><strong style="background-color: transparent;">Payment Mode:</strong></p>
                <p style="font-size: 14px; text-transform: uppercase; color: #000000; background-color: transparent;">${viewingBill.paymentMode}</p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: transparent;">
              <thead style="background-color: transparent;">
                <tr style="border-bottom: 2px solid #333333; background-color: transparent;">
                  <th style="padding: 10px; text-align: left; font-weight: bold; color: #333333; background-color: transparent;">Item</th>
                  <th style="padding: 10px; text-align: center; font-weight: bold; color: #333333; background-color: transparent;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-weight: bold; color: #333333; background-color: transparent;">Price</th>
                  <th style="padding: 10px; text-align: right; font-weight: bold; color: #333333; background-color: transparent;">Total</th>
                </tr>
              </thead>
              <tbody style="background-color: transparent;">
                ${(viewingBill.items || []).map((item: any) => `
                  <tr style="background-color: transparent;">
                    <td style="padding: 10px; border-bottom: 1px solid #dddddd; color: #000000; background-color: transparent;">${item.productName}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dddddd; color: #000000; background-color: transparent;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dddddd; color: #000000; background-color: transparent;">₹${item.price?.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dddddd; color: #000000; background-color: transparent;">₹${item.total?.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="border-top: 2px solid #333333; padding-top: 20px; margin-left: auto; width: 300px; background-color: transparent;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #000000; background-color: transparent;">
                <span style="background-color: transparent;">Subtotal:</span>
                <span style="background-color: transparent;">₹${viewingBill.subtotal?.toFixed(2)}</span>
              </div>
              ${viewingBill.gstAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #000000; background-color: transparent;">
                <span style="background-color: transparent;">GST:</span>
                <span style="background-color: transparent;">₹${viewingBill.gstAmount?.toFixed(2)}</span>
              </div>
              ` : ''}
              ${viewingBill.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #16a34a; background-color: transparent;">
                <span style="background-color: transparent;">Discount:</span>
                <span style="background-color: transparent;">-₹${viewingBill.discount?.toFixed(2)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 1px solid #333333; padding-top: 10px; margin-top: 10px; color: #000000; background-color: transparent;">
                <span style="background-color: transparent;">Total:</span>
                <span style="background-color: transparent;">₹${viewingBill.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #dddddd; color: #666666; font-size: 14px; background-color: transparent;">
              <p style="margin: 5px 0; background-color: transparent;">Thank you for shopping with us!</p>
              <p style="margin: 5px 0; background-color: transparent;">Visit again!</p>
            </div>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      // Wait longer for iframe to fully render
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate canvas from iframe body with explicit options
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        windowHeight: iframeDoc.body.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure all elements have white background
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              el.style.backgroundColor = 'transparent';
            }
          });
          if (clonedDoc.body) {
            clonedDoc.body.style.backgroundColor = '#ffffff';
          }
        }
      });

      // Remove iframe
      document.body.removeChild(iframe);

      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has invalid dimensions');
      }

      // Calculate dimensions for A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Add image to PDF - only add multiple pages if content exceeds one page
      if (imgHeight <= pageHeight) {
        // Content fits on one page
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages only if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      // Generate filename and save
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                padding: '20px'
              }}
            >
              <div 
                className="invoice-header"
                style={{
                  textAlign: 'center',
                  marginBottom: '30px',
                  borderBottom: '2px solid #9333ea',
                  paddingBottom: '15px'
                }}
              >
                <h1 style={{ color: '#9333ea', fontSize: '32px', marginBottom: '5px', fontWeight: 'bold' }}>
                  DressBill
                </h1>
                <p style={{ color: '#666666', fontSize: '14px', margin: '2px 0' }}>Boutique Billing System</p>
                <p style={{ color: '#666666', fontSize: '14px', margin: '2px 0' }}>Women's Fashion Store</p>
              </div>

              <div 
                className="invoice-info"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '30px'
                }}
              >
                <div className="info-section">
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <span className="info-label" style={{ fontWeight: 'bold', color: '#333333' }}>Bill Number:</span>
                  </p>
                  <p style={{ fontSize: '14px' }}>{viewingBill?.invoiceNumber}</p>
                </div>
                <div className="info-section text-right" style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <span className="info-label" style={{ fontWeight: 'bold', color: '#333333' }}>Date:</span>
                  </p>
                  <p style={{ fontSize: '14px' }}>
                    {viewingBill?.createdAt ? new Date(viewingBill.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
                {viewingBill?.customerName && viewingBill.customerName !== 'Walk-in Customer' && (
                  <>
                    <div className="info-section">
                      <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                        <span className="info-label" style={{ fontWeight: 'bold', color: '#333333' }}>Customer:</span>
                      </p>
                      <p style={{ fontSize: '14px' }}>{viewingBill.customerName}</p>
                      <p style={{ fontSize: '14px' }}>{viewingBill.customerPhone}</p>
                    </div>
                  </>
                )}
                <div className="info-section text-right" style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <span className="info-label" style={{ fontWeight: 'bold', color: '#333333' }}>Payment Mode:</span>
                  </p>
                  <p style={{ fontSize: '14px', textTransform: 'uppercase' }}>{viewingBill?.paymentMode}</p>
                </div>
              </div>

              <table 
                className="invoice-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '30px'
                }}
              >
                <thead style={{ borderBottom: '2px solid #333333' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#333333' }}>
                      Item
                    </th>
                    <th className="center" style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#333333' }}>
                      Qty
                    </th>
                    <th className="right" style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#333333' }}>
                      Price
                    </th>
                    <th className="right" style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#333333' }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingBill?.items || []).map((item: any, index: number) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #dddddd', color: '#000000' }}>
                        {item.productName}
                      </td>
                      <td className="center" style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dddddd', color: '#000000' }}>
                        {item.quantity}
                      </td>
                      <td className="right" style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dddddd', color: '#000000' }}>
                        ₹{item.price?.toFixed(2)}
                      </td>
                      <td className="right" style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dddddd', color: '#000000' }}>
                        ₹{item.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div 
                className="invoice-totals"
                style={{
                  borderTop: '2px solid #333333',
                  paddingTop: '20px',
                  marginLeft: 'auto',
                  width: '300px'
                }}
              >
                <div 
                  className="totals-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                >
                  <span>Subtotal:</span>
                  <span>₹{viewingBill?.subtotal?.toFixed(2)}</span>
                </div>
                {viewingBill?.gstAmount > 0 && (
                  <div 
                    className="totals-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#000000'
                    }}
                  >
                    <span>GST:</span>
                    <span>₹{viewingBill?.gstAmount?.toFixed(2)}</span>
                  </div>
                )}
                {viewingBill?.discount > 0 && (
                  <div 
                    className="totals-row discount-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#16a34a'
                    }}
                  >
                    <span>Discount:</span>
                    <span>-₹{viewingBill?.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div 
                  className="totals-row final"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderTop: '1px solid #333333',
                    paddingTop: '10px',
                    marginTop: '10px',
                    color: '#000000'
                  }}
                >
                  <span>Total:</span>
                  <span>₹{viewingBill?.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div 
                className="invoice-footer"
                style={{
                  textAlign: 'center',
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: '2px solid #dddddd',
                  color: '#666666',
                  fontSize: '14px'
                }}
              >
                <p>Thank you for shopping with us!</p>
                <p>Visit again!</p>
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