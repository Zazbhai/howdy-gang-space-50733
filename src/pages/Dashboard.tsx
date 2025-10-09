import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Package, MapPin, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  const [loadingActivity, setLoadingActivity] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      
      setLoadingActivity(true);
      
      // Fetch recent items reported by the user
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
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
      
      setLoadingActivity(false);
    };
    
    fetchRecentActivity();
  }, [user]);

  const handleDeleteItem = async (itemId: string) => {
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

    setRecentItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Success",
      description: "Item deleted successfully.",
    });
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
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your lost and found reports
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/report-lost')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Report Lost Item
              </CardTitle>
              <CardDescription>
                Report an item you've lost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Report Lost</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/report-found')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-success" />
                Report Found Item
              </CardTitle>
              <CardDescription>
                Report an item you've found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Report Found</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/search')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-accent-foreground" />
                Search Items
              </CardTitle>
              <CardDescription>
                Find lost or found items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">Search</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent reports and claims</CardDescription>
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
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Recent Reports</h3>
                    <div className="space-y-3">
                      {recentItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={item.type === 'lost' ? 'destructive' : 'default'}>
                                {item.type === 'lost' ? 'Lost' : 'Found'}
                              </Badge>
                              <h4 className="font-semibold truncate">{item.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Recent Claims</h3>
                    <div className="space-y-3">
                      {recentClaims.map((claim) => (
                        <div key={claim.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                claim.status === 'approved' ? 'default' : 
                                claim.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }>
                                {claim.status}
                              </Badge>
                              <h4 className="font-semibold truncate">{claim.items?.name || 'Item'}</h4>
                            </div>
                            {claim.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{claim.notes}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
