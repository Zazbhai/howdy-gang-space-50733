import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Package, MapPin, Calendar, Trash2, Bell, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useButtonSound } from '@/hooks/useButtonSound';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const { toast } = useToast();
  const { playSound } = useButtonSound();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      
      setLoadingActivity(true);
      
      // Fetch recent items reported by the user (excluding smart tags)
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_smart_tag', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (itemsError) {
        console.error('Error fetching items:', itemsError);
      } else {
        setRecentItems(items || []);
      }
      
      // Fetch recent claims made by the user
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          *,
          items (
            name,
            type,
            location
          )
        `)
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (claimsError) {
        console.error('Error fetching claims:', claimsError);
      } else {
        setRecentClaims(claims || []);
      }

      // Fetch ALL claims for user's items (pending, approved, rejected)
      const { data: userItems } = await supabase
        .from('items')
        .select('id')
        .eq('user_id', user.id);

      if (userItems && userItems.length > 0) {
        const { data: allClaims, error: allClaimsError } = await supabase
          .from('claims')
          .select(`
            *,
            items (
              id,
              name,
              category,
              is_smart_tag
            )
          `)
          .in('item_id', userItems.map(i => i.id))
          .order('created_at', { ascending: false });

        if (allClaimsError) {
          console.error('Error fetching all claims:', allClaimsError);
        } else if (allClaims && allClaims.length > 0) {
          // Fetch claimant profiles separately
          const claimantIds = allClaims.map(c => c.claimant_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', claimantIds);

          // Merge profile data with claims
          const claimsWithProfiles = allClaims.map(claim => ({
            ...claim,
            profiles: profiles?.find(p => p.id === claim.claimant_id) || null
          }));
          
          // Separate pending claims
          setPendingClaims(claimsWithProfiles.filter(c => c.status === 'pending'));
          
          // Add approved/rejected claims to recent claims
          const ownerClaims = claimsWithProfiles.filter(c => c.status !== 'pending').slice(0, 5);
          setRecentClaims(prev => [...prev, ...ownerClaims].slice(0, 10));
        } else {
          setPendingClaims([]);
        }
      }
      
      setLoadingActivity(false);
    };
    
    fetchRecentActivity();

    // Real-time subscription for claims updates
    if (user) {
      const channel = supabase
        .channel('claims-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'claims'
          },
          () => {
            fetchRecentActivity();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const playDeleteSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSR4LTKXh8bllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rllHAU+ltryy3cqBSp+zPLaizsIG2m98OihUBELTKzn8rlhHAU+');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleDeleteItem = async (itemId: string) => {
    playSound();
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      return;
    }

    playDeleteSound();
    setRecentItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Success",
      description: "Item deleted successfully.",
    });
  };

  const handleClearActivity = async () => {
    playSound();
    if (!confirm('Are you sure you want to clear all recent activity? This will delete all your reported items.')) {
      return;
    }

    try {
      const itemIds = recentItems.map(item => item.id);
      if (itemIds.length === 0) return;

      const { error } = await supabase
        .from('items')
        .delete()
        .in('id', itemIds);

      if (error) throw error;

      playDeleteSound();
      setRecentItems([]);
      toast({
        title: "Success",
        description: "Recent activity cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing activity:', error);
      toast({
        title: "Error",
        description: "Failed to clear activity.",
        variant: "destructive",
      });
    }
  };

  const handleClaimAction = async (claimId: string, action: 'approved' | 'rejected') => {
    playSound();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 tracking-tight">DASHBOARD</h1>
          <p className="text-lg text-muted-foreground font-medium">
            Manage your lost and found reports
          </p>
        </div>

        {pendingClaims.length > 0 && (
          <Card className="border-2 shadow-modern-lg mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl font-heading tracking-tight">PENDING CLAIMS</CardTitle>
              </div>
              <CardDescription className="font-medium">
                People who found your items are waiting for confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingClaims.map((claim) => (
                <Alert key={claim.id} className="bg-muted/50 border-2">
                  <AlertDescription className="space-y-3">
                    <div>
                      <p className="font-bold text-base">{claim.items?.name}</p>
                      <p className="text-sm text-muted-foreground font-medium">
                        Found by: {claim.profiles?.name || 'Anonymous'}
                      </p>
                      {claim.notes && (
                        <p className="text-sm mt-1 font-medium">{claim.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        Claim Code: {claim.claim_code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleClaimAction(claim.id, 'approved')}
                        className="flex-1 font-bold"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClaimAction(claim.id, 'rejected')}
                        className="flex-1 font-bold"
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

        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <Card className="hover:shadow-modern-xl hover-lift transition-all cursor-pointer border-2" onClick={() => navigate('/report-lost')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-tight">
                <Plus className="h-6 w-6 text-primary" />
                REPORT LOST
              </CardTitle>
              <CardDescription className="font-medium">
                Report an item you've lost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full font-bold shadow-modern-md">Report Lost</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-modern-xl hover-lift transition-all cursor-pointer border-2" onClick={() => navigate('/report-found')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-tight">
                <Package className="h-6 w-6 text-success" />
                REPORT FOUND
              </CardTitle>
              <CardDescription className="font-medium">
                Report an item you've found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full font-bold shadow-modern-md" variant="outline">Report Found</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-modern-xl hover-lift transition-all cursor-pointer border-2" onClick={() => navigate('/search')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-heading tracking-tight">
                <Search className="h-6 w-6 text-accent-foreground" />
                SEARCH ITEMS
              </CardTitle>
              <CardDescription className="font-medium">
                Find lost or found items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full font-bold shadow-modern-md" variant="secondary">Search</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 shadow-modern-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-heading tracking-tight">RECENT ACTIVITY</CardTitle>
                <CardDescription className="font-medium">Your recent reports and claims</CardDescription>
              </div>
              {(recentItems.length > 0 || recentClaims.length > 0) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearActivity}
                  className="text-destructive hover:text-destructive"
                >
                  Clear Activity
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : recentItems.length === 0 && recentClaims.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent activity yet. Start by reporting an item!
              </p>
            ) : (
              <div className="space-y-6">
                {recentItems.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Recent Reports</h3>
                    <div className="space-y-3">
                      {recentItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg border-2 bg-card hover:bg-accent/50 hover-lift transition-all shadow-modern-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className="font-bold">
                                {item.type === 'lost' ? 'LOST' : 'FOUND'}
                              </Badge>
                              <h4 className="font-bold truncate">{item.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 font-medium">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-heading text-xl">Delete Item</AlertDialogTitle>
                                <AlertDialogDescription className="font-medium">
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {recentClaims.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Claims Activity</h3>
                    <div className="space-y-3">
                      {recentClaims.map((claim) => (
                        <div key={claim.id} className="flex items-start gap-3 p-4 rounded-lg border-2 bg-card hover:bg-accent/50 hover-lift transition-all shadow-modern-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                claim.status === 'approved' ? 'default' : 
                                claim.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              } className="font-bold uppercase">
                                {claim.status}
                              </Badge>
                              <h4 className="font-bold truncate">{claim.items?.name || 'Item'}</h4>
                              {claim.items?.is_smart_tag && (
                                <Badge variant="outline" className="text-xs">Smart Tag</Badge>
                              )}
                            </div>
                            {claim.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-1 font-medium">{claim.notes}</p>
                            )}
                            {claim.profiles && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {claim.claimant_id === user?.id ? 'Your claim' : `Claim by: ${claim.profiles.name}`}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {claim.items?.location || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(claim.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
