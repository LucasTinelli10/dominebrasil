import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Home,
  Calendar,
  MessageSquare,
  User,
  Search,
  BookOpen,
  History,
  Car,
  Wallet,
  Settings,
  LogOut,
  Bell,
  Wrench,
  PieChart,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const studentMenuItems: MenuItem[] = [
  { title: 'Início', url: '/app/student', icon: Home },
  { title: 'Buscar Instrutor', url: '/app/student/search', icon: Search },
  { title: 'Minhas Aulas', url: '/app/student/lessons', icon: BookOpen },
  { title: 'Histórico', url: '/app/student/history', icon: History },
  { title: 'Progresso', url: '/app/student/progress', icon: PieChart },
  { title: 'Mensagens', url: '/app/student/messages', icon: MessageSquare },
];

const instructorMenuItems: MenuItem[] = [
  { title: 'Visão Geral', url: '/app/instructor', icon: Home },
  { title: 'Solicitações', url: '/app/instructor/requests', icon: Bell },
  { title: 'Minha Agenda', url: '/app/instructor/schedule', icon: Calendar },
  { title: 'Preços e Pacotes', url: '/app/instructor/packages', icon: Package },
  { title: 'Minha Carteira', url: '/app/instructor/wallet', icon: Wallet },
  { title: 'Carros para Alugar', url: '/app/instructor/cars', icon: Car },
  { title: 'Mensagens', url: '/app/instructor/messages', icon: MessageSquare },
  { title: 'Perfil Profissional', url: '/app/instructor/profile', icon: User },
];

const investorMenuItems: MenuItem[] = [
  { title: 'Visão Geral', url: '/app/investor', icon: Home },
  { title: 'Gestão de Frota', url: '/app/investor/fleet', icon: Car },
  { title: 'Manutenção', url: '/app/investor/maintenance', icon: Wrench },
  { title: 'Extrato Financeiro', url: '/app/investor/finances', icon: Wallet },
];

type UserRole = 'student' | 'instructor' | 'investor';

const roleConfig: Record<UserRole, { 
  menuItems: MenuItem[];
  label: string;
  colorClass: string;
  bgClass: string;
}> = {
  student: {
    menuItems: studentMenuItems,
    label: 'Área do Aluno',
    colorClass: 'text-student',
    bgClass: 'bg-student',
  },
  instructor: {
    menuItems: instructorMenuItems,
    label: 'Área do Instrutor',
    colorClass: 'text-instructor',
    bgClass: 'bg-instructor',
  },
  investor: {
    menuItems: investorMenuItems,
    label: 'Área do Investidor',
    colorClass: 'text-investor',
    bgClass: 'bg-investor',
  },
};

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const role = (profile?.role || 'student') as UserRole;
  const config = roleConfig[role];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (url: string) => {
    if (url === `/app/${role}`) {
      return location.pathname === url;
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className={cn(
      'border-r transition-all duration-300',
      role === 'student' && 'bg-student-accent/30',
      role === 'instructor' && 'bg-instructor-accent/30',
      role === 'investor' && 'bg-investor-accent/30',
    )}>
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg',
            config.bgClass,
            'text-white'
          )}>
            D
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-foreground">Domine</span>
              <span className={cn('text-xs', config.colorClass)}>{config.label}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-2 mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {config.menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        'hover:bg-card hover:shadow-sm',
                        isActive(item.url) && cn(
                          'bg-card shadow-sm',
                          role === 'student' && 'border-l-4 border-student',
                          role === 'instructor' && 'border-l-4 border-instructor',
                          role === 'investor' && 'border-l-4 border-investor',
                        )
                      )}
                    >
                      <item.icon className={cn(
                        'h-5 w-5',
                        isActive(item.url) ? config.colorClass : 'text-muted-foreground'
                      )} />
                      {!collapsed && (
                        <span className={cn(
                          'font-medium',
                          isActive(item.url) ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium px-2 mb-2">
            Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={`/app/${role}/settings`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'hover:bg-card hover:shadow-sm',
                      location.pathname.includes('/settings') && 'bg-card shadow-sm'
                    )}
                  >
                    <Settings className={cn(
                      'h-5 w-5',
                      location.pathname.includes('/settings') ? config.colorClass : 'text-muted-foreground'
                    )} />
                    {!collapsed && (
                      <span className={cn(
                        'font-medium',
                        location.pathname.includes('/settings') ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        Configurações
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className={cn(config.bgClass, 'text-white')}>
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}