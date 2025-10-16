import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Download, AlertCircle, CheckCircle, Pencil, Trash2, Bell, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartTag {
  id: string;
  name: string;
  description: string;
  category: string;
  phone_number: string | null;
  status: string;
  created_at: string;
  owner_name: string | null;
  estimated_value: number | null;
  reward_amount: number | null;
}

const SmartTags = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState<SmartTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'personal',
    phone_number: '',
    owner_name: '',
    estimated_value: '',
  });
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<SmartTag | null>(null);
  const [rewardAmount, setRewardAmount] = useState('');
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: 'personal',
    phone_number: '',
    owner_name: '',
    estimated_value: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSmartTags();
      fetchPendingClaims();

      // Real-time subscription for claims updates
      const channel = supabase
        .channel('smart-tag-claims')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'claims'
          },
          () => {
            fetchPendingClaims();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchSmartTags = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_smart_tag', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching smart tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load smart tags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingClaims = async () => {
    try {
      const { data: smartTagItems } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_smart_tag', true);

      if (smartTagItems && smartTagItems.length > 0) {
        const { data, error } = await supabase
          .from('claims')
          .select(`
            *,
            items (
              id,
              name,
              category
            )
          `)
          .eq('status', 'pending')
          .in('item_id', smartTagItems.map(i => i.id))
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Fetch claimant profiles separately
        if (data && data.length > 0) {
          const claimantIds = data.map(c => c.claimant_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', claimantIds);

          // Merge profile data with claims
          const claimsWithProfiles = data.map(claim => ({
            ...claim,
            profiles: profiles?.find(p => p.id === claim.claimant_id) || null
          }));
          
          setPendingClaims(claimsWithProfiles);
        } else {
          setPendingClaims([]);
        }
      }
    } catch (error) {
      console.error('Error fetching pending claims:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('items').insert([{
        user_id: user?.id,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        phone_number: formData.phone_number || null,
        owner_name: formData.owner_name || null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        is_smart_tag: true,
        status: 'registered',
        type: 'lost',
        date: new Date().toISOString().split('T')[0],
        location: 'N/A',
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Smart tag created successfully',
      });

      setFormData({ name: '', description: '', category: 'personal', phone_number: '', owner_name: '', estimated_value: '' });
      setShowForm(false);
      fetchSmartTags();
    } catch (error) {
      console.error('Error creating smart tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create smart tag',
        variant: 'destructive',
      });
    }
  };

  const downloadQRCode = (itemId: string, itemName: string) => {
    const svg = document.getElementById(`qr-${itemId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${itemName}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const toggleLostStatus = async (tag: SmartTag) => {
    if (tag.status === 'registered') {
      // Marking as lost - check if phone number exists
      if (!tag.phone_number) {
        // Show phone dialog first
        setSelectedTag(tag);
        setPhoneNumber('');
        setShowPhoneDialog(true);
        return;
      }
      // Show reward dialog
      setSelectedTag(tag);
      setShowRewardDialog(true);
    } else {
      // Marking as safe
      try {
        const { error } = await supabase
          .from('items')
          .update({ status: 'registered', reward_amount: null })
          .eq('id', tag.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Item marked as safe',
        });

        fetchSmartTags();
      } catch (error) {
        console.error('Error updating status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update status',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddPhoneAndMarkLost = async () => {
    if (!selectedTag || !phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please provide a contact number',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update phone number first
      const { error } = await supabase
        .from('items')
        .update({ phone_number: phoneNumber })
        .eq('id', selectedTag.id);

      if (error) throw error;

      // Close phone dialog and open reward dialog
      setShowPhoneDialog(false);
      setShowRewardDialog(true);
      fetchSmartTags();
    } catch (error) {
      console.error('Error updating phone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update phone number',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsLost = async () => {
    if (!selectedTag) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({ 
          status: 'active',
          reward_amount: rewardAmount ? parseFloat(rewardAmount) : null
        })
        .eq('id', selectedTag.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Item marked as lost',
      });

      setShowRewardDialog(false);
      setSelectedTag(null);
      setRewardAmount('');
      fetchSmartTags();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleEditTag = (tag: SmartTag) => {
    setSelectedTag(tag);
    setEditFormData({
      name: tag.name,
      description: tag.description,
      category: tag.category,
      phone_number: tag.phone_number || '',
      owner_name: tag.owner_name || '',
      estimated_value: tag.estimated_value?.toString() || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateTag = async () => {
    if (!selectedTag) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          category: editFormData.category as any,
          phone_number: editFormData.phone_number || null,
          owner_name: editFormData.owner_name || null,
          estimated_value: editFormData.estimated_value ? parseFloat(editFormData.estimated_value) : null,
        })
        .eq('id', selectedTag.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Smart tag updated successfully',
      });

      setShowEditDialog(false);
      setSelectedTag(null);
      fetchSmartTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update smart tag',
        variant: 'destructive',
      });
    }
  };

  const playDeleteSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSR4LTKXh8bllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rlhHAU+');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this smart tag? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      playDeleteSound();
      toast({
        title: 'Success',
        description: 'Smart tag deleted successfully',
      });

      fetchSmartTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete smart tag',
        variant: 'destructive',
      });
    }
  };

  const handleClaimAction = async (claimId: string, action: 'approved' | 'rejected') => {
    try {
      // Get the claim to find the item_id
      const claim = pendingClaims.find(c => c.id === claimId);
      if (!claim) return;

      // Update claim status
      const { error: claimError } = await supabase
        .from('claims')
        .update({ status: action })
        .eq('id', claimId);

      if (claimError) throw claimError;

      // If approved, mark the item as lost (active status)
      if (action === 'approved') {
        const { error: itemError } = await supabase
          .from('items')
          .update({ status: 'active' })
          .eq('id', claim.item_id);

        if (itemError) throw itemError;
      }

      setPendingClaims(prev => prev.filter(c => c.id !== claimId));
      fetchSmartTags(); // Refresh tags to show updated status
      toast({
        title: 'Success',
        description: `Claim ${action === 'approved' ? 'approved' : 'rejected'} successfully${action === 'approved' ? '. Item marked as lost.' : ''}`,
      });
    } catch (error) {
      console.error('Error updating claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to update claim',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const currentUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">Smart Tags</h1>
              <p className="text-muted-foreground">
                Register your valuable items and generate QR codes for easy recovery
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Register Item
            </Button>
          </div>

          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Register New Item</CardTitle>
                <CardDescription>
                  Create a smart tag for your valuable item
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Wallet, Phone, ID Card"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your item (color, brand, distinctive features)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="owner_name">Owner Name</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimated_value">Estimated Value (₹)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      step="0.01"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                      placeholder="e.g., 500.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Contact Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="Your contact number"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Create Smart Tag</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {pendingClaims.length > 0 && (
            <Card className="border-2 shadow-lg mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl font-heading">PENDING CLAIMS</CardTitle>
                </div>
                <CardDescription>
                  People who found your smart tag items are waiting for confirmation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingClaims.map((claim) => (
                  <Alert key={claim.id} className="bg-muted/50 border-2">
                    <AlertDescription className="space-y-3">
                      <div>
                        <p className="font-bold text-base">{claim.items?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Found by: {claim.profiles?.name || 'Anonymous'}
                        </p>
                        {claim.notes && (
                          <p className="text-sm mt-1">{claim.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Claim Code: {claim.claim_code}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleClaimAction(claim.id, 'approved')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClaimAction(claim.id, 'rejected')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {tags.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No smart tags yet. Register your first item to get started!
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tags.map((tag) => (
                <Card key={tag.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{tag.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {tag.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge variant={tag.status === 'active' ? 'destructive' : 'default'}>
                        {tag.status === 'active' ? 'Lost' : 'Safe'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                     <div className="flex flex-col items-center gap-4">
                      <div className="relative group bg-white p-4 rounded-lg shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-110 animate-fade-in">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-orange-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl animate-pulse"></div>
                        <div className="absolute inset-0 rounded-lg border-2 border-primary/0 group-hover:border-primary/50 transition-all duration-500 animate-[spin_3s_linear_infinite]"></div>
                        <div className="relative transform transition-transform duration-500 group-hover:rotate-2">
                          <QRCodeSVG
                            id={`qr-${tag.id}`}
                            value={`${currentUrl}/item/${tag.id}`}
                            size={200}
                            level="H"
                            includeMargin
                            className="drop-shadow-2xl"
                          />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"></div>
                      </div>
                      
                      <div className="w-full space-y-2 text-sm">
                        {tag.owner_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Owner:</span>
                            <span className="font-medium">{tag.owner_name}</span>
                          </div>
                        )}
                        {tag.estimated_value && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Value:</span>
                            <span className="font-medium">₹{tag.estimated_value}</span>
                          </div>
                        )}
                        {tag.status === 'active' && tag.reward_amount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reward:</span>
                            <span className="font-semibold text-primary">₹{tag.reward_amount}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-center text-muted-foreground break-all">
                        {currentUrl}/item/{tag.id}
                      </div>
                      
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTag(tag)}
                          className="flex-1"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTag(tag.id)}
                          className="flex-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQRCode(tag.id, tag.name)}
                          className="w-full"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download QR Code
                        </Button>
                        <Button
                          variant={tag.status === 'active' ? 'default' : 'destructive'}
                          size="sm"
                          onClick={() => toggleLostStatus(tag)}
                          className="w-full"
                        >
                          {tag.status === 'active' ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Safe
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Mark as Lost
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Number Required</DialogTitle>
            <DialogDescription>
              Please provide a contact number so people can reach you if they find your item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Contact Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Your contact number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPhoneAndMarkLost}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Item as Lost</DialogTitle>
            <DialogDescription>
              Optionally offer a reward for the return of your item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reward">Reward Amount (₹)</Label>
              <Input
                id="reward"
                type="number"
                step="0.01"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="Optional reward amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsLost}>
              Mark as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Smart Tag</DialogTitle>
            <DialogDescription>
              Update the details of your smart tag
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Wallet, Phone"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Describe your item"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editFormData.category}
                onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-owner-name">Owner Name</Label>
              <Input
                id="edit-owner-name"
                value={editFormData.owner_name}
                onChange={(e) => setEditFormData({ ...editFormData, owner_name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="edit-estimated-value">Estimated Value (₹)</Label>
              <Input
                id="edit-estimated-value"
                type="number"
                step="0.01"
                value={editFormData.estimated_value}
                onChange={(e) => setEditFormData({ ...editFormData, estimated_value: e.target.value })}
                placeholder="e.g., 500.00"
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Contact Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editFormData.phone_number}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                placeholder="Your contact number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartTags;
