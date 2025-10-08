import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Search, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/');
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Search className="h-6 w-6 text-primary" />
            <span className="text-xl font-heading font-bold">Lost & Found</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} size="sm">
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate('/search')} size="sm">
                  <Search className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Search</span>
                </Button>
                <Button variant="ghost" onClick={handleLogout} size="sm">
                  <LogOut className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
