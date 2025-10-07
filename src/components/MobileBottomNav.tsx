import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="grid grid-cols-4 h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive('/') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          to="/search"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive('/search') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs">Search</span>
        </Link>

        <Link
          to="/report-lost"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive('/report-lost') || isActive('/report-found')
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">Report</span>
        </Link>

        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 ${
            isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Dashboard</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
