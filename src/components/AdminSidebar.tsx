import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Users,
  Settings,
  BarChart3,
  GitCompare,
  Flame,
  GraduationCap,
  Award,
  Handshake,
  BookOpen,
  Megaphone,
  ShoppingBag,
  DollarSign,
  CreditCard,
  MessageCircle,
  Wrench,
  Briefcase,
  FileCheck,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Crown,
  PieChart,
  CalendarDays
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";
import { useState, useEffect } from "react";

interface AdminSidebarProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'home', title: 'Início', icon: Home, route: '/' },
  { id: 'divider-1', title: 'Gestão', isDivider: true },
  { id: 'licensees', title: 'Licenciados', icon: Users, route: '/licensees' },
  { id: 'admin-panel', title: 'Configurações', icon: Settings, route: '/admin' },
  { id: 'comparison', title: 'Comparar Clínicas', icon: GitCompare, route: '/comparison' },
  { id: 'dashboard', title: 'Dashboard', icon: BarChart3, route: '/dashboard' },
  { id: 'consolidated', title: 'Resultados Consolidados', icon: PieChart, route: '/consolidated-results' },
  { id: 'surgery-schedule', title: 'Agenda Cirurgias', icon: CalendarDays, route: '/surgery-schedule' },
  { id: 'divider-2', title: 'Módulos', isDivider: true },
  { id: 'hotleads', title: 'HotLeads', icon: Flame, route: '/hotleads' },
  { id: 'university', title: 'Universidade', icon: GraduationCap, route: '/university' },
  { id: 'certificates', title: 'Certificados', icon: Award, route: '/certificates' },
  { id: 'partners', title: 'Parceiros', icon: Handshake, route: '/partners' },
  { id: 'materials', title: 'Materiais', icon: BookOpen, route: '/materials' },
  { id: 'marketing', title: 'Marketing', icon: Megaphone, route: '/marketing' },
  { id: 'store', title: 'Loja Neo-Spa', icon: ShoppingBag, route: '/store' },
  { id: 'financial', title: 'Financeiro', icon: DollarSign, route: '/financial' },
  { id: 'license-payments', title: 'Pagamentos Licença', icon: CreditCard, route: '/license-payments' },
  { id: 'mentorship', title: 'Mentoria', icon: MessageCircle, route: '/mentorship' },
  { id: 'systems', title: 'Sistemas', icon: Wrench, route: '/systems' },
  { id: 'career', title: 'Carreira', icon: Briefcase, route: '/career' },
  { id: 'regularization', title: 'Regularização', icon: FileCheck, route: '/regularization' },
  { id: 'community', title: 'Comunidade', icon: Users, route: '/community' },
];

export function AdminSidebar({ children }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isActive = (route: string) => location.pathname === route;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full overflow-x-hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-card border-r z-40 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "p-4 border-b flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <img src={logoByNeofolic} alt="ByNeofolic" className="h-8 object-contain" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Admin Info */}
        {!isCollapsed && (
          <div className="p-4 border-b">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="p-2 border-b flex justify-center">
            <Avatar 
              className="h-10 w-10 cursor-pointer ring-2 ring-primary/20"
              onClick={() => navigate('/profile')}
            >
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => {
              if (item.isDivider) {
                if (isCollapsed) return null;
                return (
                  <div key={item.id} className="pt-4 pb-2 px-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.title}
                    </p>
                  </div>
                );
              }
              
              return (
                <Button
                  key={item.id}
                  variant={isActive(item.route!) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isCollapsed && "justify-center px-2",
                    isActive(item.route!) && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => navigate(item.route!)}
                >
                  {item.icon && <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive(item.route!) && "text-primary")} />}
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer with Logout */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <p className="text-[10px] text-muted-foreground text-center">
              Painel Administrativo
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 overflow-x-hidden w-full min-w-0",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
