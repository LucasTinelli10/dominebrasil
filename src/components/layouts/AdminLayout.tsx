import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Shield, LayoutDashboard, UserCheck, LogOut, ChevronRight, Home 
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/verifications', label: 'Verificações', icon: UserCheck },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get current page for breadcrumb
  const currentNav = navItems.find(item => item.path === location.pathname) || navItems[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Shield className="h-7 w-7 text-teal-400" />
              <span className="text-lg font-bold text-white">Admin Panel</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Sign Out */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b border-slate-700/50 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link 
              to="/" 
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <Link 
              to="/admin" 
              className="text-slate-400 hover:text-white transition-colors"
            >
              Admin
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-teal-400 font-medium">{currentNav.label}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
