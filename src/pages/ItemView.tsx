import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Phone, Mail, CheckCircle, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface ItemData {
  id: string;
  name: string;
  description: string;
  category: string;
  phone_number: string | null;
  status: string;
  is_smart_tag: boolean;
  user_id: string;
  created_at: string;
  owner_name: string | null;
  estimated_value: number | null;
  reward_amount: number | null;
}

interface OwnerProfile {
  name: string;
}

const ItemView = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemData | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (itemId) {
      fetchItemData();
    }
  }, [itemId]);

  const fetchItemData = async () => {
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('is_smart_tag', true)
        .single();

      if (itemError) throw itemError;
      setItem(itemData);

      // Fetch owner profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', itemData.user_id)
        .single();

      if (profileError) throw profileError;
      setOwnerProfile(profileData);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast({
        title: 'Error',
        description: 'Failed to load item information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportFound = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to report this item',
      });
      navigate('/auth');
      return;
    }

    if (!item) return;

    setReporting(true);
    try {
      // Create a claim for this item
      const claimCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase.from('claims').insert({
        item_id: item.id,
        claimant_id: user.id,
        status: 'pending',
        claim_code: claimCode,
        notes: 'Item found via smart tag QR code',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your report has been submitted. The owner will be notified.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error reporting found item:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Item Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This item doesn't exist or is not registered as a smart tag.
              </p>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isLost = item.status === 'active';
  const isOwner = user?.id === item.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl mb-2">{item.name}</CardTitle>
                  <CardDescription className="text-base">
                    Smart Tag Item
                  </CardDescription>
                </div>
                <Badge variant={isLost ? 'destructive' : 'default'} className="text-base px-4 py-2">
                  {isLost ? 'LOST' : 'Registered'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isOwner && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is your item. Manage it from the Smart Tags page.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {item.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Category</h3>
                <Badge variant="outline">{item.category}</Badge>
              </div>

              {isOwner && item.estimated_value && (
                <div>
                  <h3 className="font-semibold mb-2">Estimated Value</h3>
                  <p className="text-lg font-medium">${item.estimated_value}</p>
                </div>
              )}

              {isLost ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-semibold">
                      This item has been reported as LOST
                    </AlertDescription>
                  </Alert>

                  {item.reward_amount && (
                    <Alert className="bg-primary/10 border-primary">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-semibold text-lg">
                        💰 Reward Offered: ${item.reward_amount}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-lg mb-3">Owner Contact Information</h3>
                    
                    {(item.owner_name || ownerProfile) && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Name:</span>
                        <span>{item.owner_name || ownerProfile?.name}</span>
                      </div>
                    )}

                    {item.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">Phone:</span>
                        <a
                          href={`tel:${item.phone_number}`}
                          className="text-primary hover:underline"
                        >
                          {item.phone_number}
                        </a>
                      </div>
                    )}

                    {!item.phone_number && (
                      <p className="text-sm text-muted-foreground">
                        Contact information will be visible once the owner marks this item as lost.
                      </p>
                    )}

                    {item.phone_number && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Please contact the owner to return this item. They will be very grateful!
                      </p>
                    )}
                  </div>

                  {!isOwner && (
                    <Button
                      onClick={handleReportFound}
                      disabled={reporting}
                      className="w-full"
                      size="lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {reporting ? 'Submitting...' : 'I Found This Item'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This item is currently registered and not reported as lost.
                    </AlertDescription>
                  </Alert>

                  {!isOwner && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        Did you find this item somewhere?
                      </p>
                      <Button
                        onClick={handleReportFound}
                        disabled={reporting}
                        size="lg"
                      >
                        <MapPin className="mr-2 h-5 w-5" />
                        {reporting ? 'Submitting...' : 'Report as Found'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => navigate('/smart-tags')}
                    variant="outline"
                    className="w-full"
                  >
                    Manage Smart Tags
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ItemView;
