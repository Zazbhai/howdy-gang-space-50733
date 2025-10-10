import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Package } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Plus, label: 'Lost', path: '/report-lost' },
    { icon: Package, label: 'Found', path: '/report-found' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-around px-1 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center gap-1 h-auto py-2.5 rounded-lg transition-all ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
