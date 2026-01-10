import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || 'student';

  const handleNotificationsClick = () => {
    navigate(`/app/${role}/messages`);
  };

  const handleSettingsClick = () => {
    navigate(`/app/${role}/settings`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className={cn(
            'h-16 border-b flex items-center justify-between px-6',
            'bg-card/80 backdrop-blur-sm sticky top-0 z-10'
          )}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden md:block">
                <h1 className="text-lg font-display font-semibold text-foreground">
                  Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'} 👋
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={handleNotificationsClick}
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className={cn(
                  'absolute top-1 right-1 w-2 h-2 rounded-full',
                  role === 'student' && 'bg-student',
                  role === 'instructor' && 'bg-instructor',
                  role === 'investor' && 'bg-investor',
                )} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSettingsClick}
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
