"use client"

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { Gift, Plus, Edit, Trash2, Send, MessageSquare, Percent, IndianRupee, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface IOffer {
  id: number;
  title: string;
  description: string;
  discountPercent?: number;
  discountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  imageUrl?: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
}

interface ICustomer {
  id: number;
  name: string;
  phone: string;
  loyaltyPoints?: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<IOffer[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<IOffer | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percent' as 'percent' | 'amount',
    discountPercent: '',
    discountAmount: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  const [notificationData, setNotificationData] = useState({
    selectedCustomers: [] as number[],
    channel: 'whatsapp' as 'whatsapp' | 'sms',
    message: '',
  });

  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchOffers();
    fetchCustomers();
  }, []);

  const fetchOffers = async () => {
    try {
      const data = await api.get<{ offers: IOffer[] }>('/offers');
      setOffers(data.offers || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await api.get<{ customers: ICustomer[] }>('/customers');
      setCustomers(data.customers || []);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountType: 'percent',
      discountPercent: '',
      discountAmount: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
    });
    setImageUrl('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast.success('Image uploaded successfully');
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error('Failed to upload image');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error('Failed to upload image');
      setIsUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (formData.discountType === 'percent' && formData.discountPercent) {
        payload.discountPercent = parseFloat(formData.discountPercent);
      } else if (formData.discountType === 'amount' && formData.discountAmount) {
        payload.discountAmount = parseFloat(formData.discountAmount);
      }

      if (formData.validFrom) payload.validFrom = formData.validFrom;
      if (formData.validUntil) payload.validUntil = formData.validUntil;
      if (imageUrl) payload.imageUrl = imageUrl;

      await api.post('/offers', payload);
      toast.success('Offer created successfully!');
      setIsCreateOpen(false);
      resetForm();
      fetchOffers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    setIsLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (formData.discountType === 'percent' && formData.discountPercent) {
        payload.discountPercent = parseFloat(formData.discountPercent);
        payload.discountAmount = null;
      } else if (formData.discountType === 'amount' && formData.discountAmount) {
        payload.discountAmount = parseFloat(formData.discountAmount);
        payload.discountPercent = null;
      }

      if (formData.validFrom) payload.validFrom = formData.validFrom;
      if (formData.validUntil) payload.validUntil = formData.validUntil;
      if (imageUrl) payload.imageUrl = imageUrl;

      await api.put(`/offers/${selectedOffer.id}`, payload);
      toast.success('Offer updated successfully!');
      setIsEditOpen(false);
      setSelectedOffer(null);
      resetForm();
      fetchOffers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (id: number) => {
    setOfferToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;

    try {
      await api.delete(`/offers/${offerToDelete}`);
      toast.success('Offer deleted successfully!');
      setIsDeleteOpen(false);
      setOfferToDelete(null);
      fetchOffers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditDialog = (offer: IOffer) => {
    setSelectedOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      discountType: offer.discountPercent ? 'percent' : 'amount',
      discountPercent: offer.discountPercent?.toString() || '',
      discountAmount: offer.discountAmount?.toString() || '',
      validFrom: offer.validFrom ? offer.validFrom.split('T')[0] : '',
      validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : '',
      isActive: offer.isActive,
    });
    setImageUrl(offer.imageUrl || '');
    setIsEditOpen(true);
  };

  const openNotifyDialog = (offer: IOffer) => {
    setSelectedOffer(offer);
    const defaultMessage = `🎉 Special Offer: ${offer.title}\n\n${offer.description}\n\n${
      offer.discountPercent 
        ? `Get ${offer.discountPercent}% OFF` 
        : `Flat ₹${offer.discountAmount} OFF`
    }${offer.validUntil ? `\nValid until: ${new Date(offer.validUntil).toLocaleDateString()}` : ''}\n\nVisit us today! - DressBill`;
    
    setNotificationData({
      selectedCustomers: [],
      channel: 'whatsapp',
      message: defaultMessage,
    });
    setIsNotifyOpen(true);
  };

  const handleSendNotification = async () => {
    if (notificationData.selectedCustomers.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }

    if (!notificationData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/notifications/send', {
        customerIds: notificationData.selectedCustomers,
        channel: notificationData.channel,
        message: notificationData.message,
        offerId: selectedOffer?.id,
      });
      
      // Check if it's a configuration error (503)
      if (response.error && response.code === 'TWILIO_NOT_CONFIGURED') {
        toast.error('Twilio is not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your environment variables.');
        return;
      }
      
      if (response.error && (response.code === 'WHATSAPP_NOT_CONFIGURED' || response.code === 'SMS_NOT_CONFIGURED')) {
        toast.error(response.error);
        return;
      }
      
      toast.success(`Notifications sent to ${notificationData.selectedCustomers.length} customers!`);
      setIsNotifyOpen(false);
      setSelectedOffer(null);
      setNotificationData({
        selectedCustomers: [],
        channel: 'whatsapp',
        message: '',
      });
    } catch (err: any) {
      // Handle specific error codes
      if (err.code === 'TWILIO_NOT_CONFIGURED') {
        toast.error('⚠️ Twilio SMS/WhatsApp service is not configured. Please set up Twilio credentials in environment variables to enable notifications.');
      } else if (err.code === 'WHATSAPP_NOT_CONFIGURED') {
        toast.error('⚠️ WhatsApp is not configured. Please set TWILIO_WHATSAPP_NUMBER in environment variables.');
      } else if (err.code === 'SMS_NOT_CONFIGURED') {
        toast.error('⚠️ SMS is not configured. Please set TWILIO_SMS_NUMBER in environment variables.');
      } else {
        toast.error(err.message || 'Failed to send notifications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCustomerSelection = (customerId: number) => {
    setNotificationData(prev => ({
      ...prev,
      selectedCustomers: prev.selectedCustomers.includes(customerId)
        ? prev.selectedCustomers.filter(id => id !== customerId)
        : [...prev.selectedCustomers, customerId],
    }));
  };

  const selectAllCustomers = () => {
    setNotificationData(prev => ({
      ...prev,
      selectedCustomers: prev.selectedCustomers.length === customers.length 
        ? [] 
        : customers.map(c => c.id),
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Gift className="h-8 w-8" />
                Offers & Promotions
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage promotional offers
              </p>
            </div>
            <Button onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className={!offer.isActive ? 'opacity-60' : ''}>
                {offer.imageUrl && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={offer.imageUrl} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{offer.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {offer.description}
                      </CardDescription>
                    </div>
                    <Badge variant={offer.isActive ? 'default' : 'secondary'}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {offer.discountPercent ? (
                      <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                        <Percent className="h-5 w-5" />
                        {offer.discountPercent}% OFF
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                        <IndianRupee className="h-5 w-5" />
                        {offer.discountAmount} OFF
                      </div>
                    )}
                  </div>

                  {(offer.validFrom || offer.validUntil) && (
                    <div className="text-sm text-muted-foreground">
                      {offer.validFrom && (
                        <p>From: {new Date(offer.validFrom).toLocaleDateString()}</p>
                      )}
                      {offer.validUntil && (
                        <p>Until: {new Date(offer.validUntil).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openNotifyDialog(offer)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Notify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(offer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteDialog(offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {offers.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No offers yet. Create your first offer!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Offer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this offer? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Offer Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
              <DialogDescription>Add a new promotional offer</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Offer Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Flash Sale - 20% Off"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your offer..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Promotional Image</Label>
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setImageUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <label 
                          htmlFor="image-upload" 
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploadingImage ? (
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            ) : (
                              <>
                                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Click to upload image</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                              </>
                            )}
                          </div>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="amount">Flat Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.discountType === 'percent' ? (
                    <div className="space-y-2">
                      <Label htmlFor="discountPercent">Discount (%) *</Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                        placeholder="e.g., 20"
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="discountAmount">Discount (₹) *</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                        placeholder="e.g., 100"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isUploadingImage}>
                  {isLoading ? 'Creating...' : 'Create Offer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Offer Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Offer</DialogTitle>
              <DialogDescription>Update offer details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Offer Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Promotional Image</Label>
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setImageUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <label 
                          htmlFor="edit-image-upload" 
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploadingImage ? (
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            ) : (
                              <>
                                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Click to upload image</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                              </>
                            )}
                          </div>
                          <Input
                            id="edit-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="amount">Flat Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.discountType === 'percent' ? (
                    <div className="space-y-2">
                      <Label htmlFor="edit-discountPercent">Discount (%) *</Label>
                      <Input
                        id="edit-discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="edit-discountAmount">Discount (₹) *</Label>
                      <Input
                        id="edit-discountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-validFrom">Valid From</Label>
                    <Input
                      id="edit-validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-validUntil">Valid Until</Label>
                    <Input
                      id="edit-validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isUploadingImage}>
                  {isLoading ? 'Updating...' : 'Update Offer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Send Notification Dialog */}
        <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>
                Send offer details to customers via WhatsApp or SMS
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Notification Channel</Label>
                <Select
                  value={notificationData.channel}
                  onValueChange={(v: any) => setNotificationData({ ...notificationData, channel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  rows={6}
                  placeholder="Enter your message..."
                />
                <p className="text-xs text-muted-foreground">
                  {notificationData.message.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Customers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllCustomers}
                  >
                    {notificationData.selectedCustomers.length === customers.length 
                      ? 'Deselect All' 
                      : 'Select All'}
                  </Button>
                </div>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                      onClick={() => toggleCustomerSelection(customer.id)}
                    >
                      <input
                        type="checkbox"
                        checked={notificationData.selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      {customer.loyaltyPoints !== undefined && customer.loyaltyPoints > 0 && (
                        <Badge variant="secondary">
                          {customer.loyaltyPoints} pts
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {notificationData.selectedCustomers.length} customer(s) selected
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNotifyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendNotification} disabled={isLoading}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : `Send to ${notificationData.selectedCustomers.length} customers`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}