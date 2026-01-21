import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  FileCheck, 
  BookOpen, 
  Video, 
  Crown, 
  Award, 
  Star, 
  Trophy, 
  Gem, 
  Shield, 
  Sparkles,
  Palette,
  ShoppingBag,
  DollarSign,
  Users,
  Settings,
  TrendingUp,
  Flame,
  GraduationCap,
  Store,
  Building2,
  CreditCard,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Gift,
  LogOut,
  CalendarDays,
  LayoutDashboard,
  GitCompare,
  PieChart,
  Handshake,
  Megaphone,
  MessageCircle,
  Wrench,
  Briefcase
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface UnifiedSidebarProps {
  children: React.ReactNode;
}

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';

const tierConfig: Record<LicenseeTier, { name: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  basic: { name: 'Basic', color: 'text-slate-700', bgColor: 'bg-slate-100', icon: <Shield className="h-4 w-4" /> },
  pro: { name: 'Pro', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Star className="h-4 w-4" /> },
  expert: { name: 'Expert', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Award className="h-4 w-4" /> },
  master: { name: 'Master', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: <Trophy className="h-4 w-4" /> },
  elite: { name: 'Elite', color: 'text-rose-700', bgColor: 'bg-rose-100', icon: <Gem className="h-4 w-4" /> },
  titan: { name: 'Titan', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: <Crown className="h-4 w-4" /> },
  legacy: { name: 'Legacy', color: 'text-primary', bgColor: 'bg-amber-100', icon: <Sparkles className="h-4 w-4" /> }
};

// Menu unificado - admin vê tudo, licenciado vê tudo
const menuItems = [
  { id: 'home', title: 'Início', icon: Home, route: '/' },
  { id: 'admin-dashboard', title: 'Dashboard Admin', icon: LayoutDashboard, route: '/admin-dashboard', adminOnly: true },
  { id: 'marketplace', title: 'Marketplace', icon: Store, route: '/marketplace' },
  
  { id: 'divider-gestao', title: 'Gestão', isDivider: true, adminOnly: true },
  { id: 'licensees', title: 'Gerenciar Licenciados', icon: Users, route: '/licensees', adminOnly: true },
  { id: 'monitoring', title: 'Monitoramento de Usuários', icon: Crown, route: '/monitoring', adminOnly: true },
  { id: 'admin-panel', title: 'Configurações do Sistema', icon: Settings, route: '/admin', adminOnly: true },
  { id: 'comparison', title: 'Comparar Clínicas', icon: GitCompare, route: '/comparison', adminOnly: true },
  { id: 'weekly-reports', title: 'Relatórios Semanais', icon: FileCheck, route: '/weekly-reports', adminOnly: true },
  
  { id: 'divider-dados', title: 'Dados & Indicadores', isDivider: true },
  { id: 'dashboard', title: 'Dashboard de Métricas', icon: BarChart3, route: '/dashboard' },
  { id: 'consolidated', title: 'Resultados Consolidados', icon: PieChart, route: '/consolidated-results' },
  { id: 'achievements', title: 'Conquistas', icon: Trophy, route: '/achievements' },
  { id: 'surgery-schedule', title: 'Agenda de Cirurgias', icon: CalendarDays, route: '/surgery-schedule' },
  { id: 'sala-tecnica', title: 'Sala Técnica', icon: Building2, route: '/sala-tecnica' },
  
  { id: 'divider-formacao', title: 'Formação', isDivider: true },
  { id: 'university', title: 'Universidade ByNeofolic', icon: GraduationCap, route: '/university' },
  { id: 'certificates', title: 'Certificados', icon: Award, route: '/certificates' },
  { id: 'regularization', title: 'Regularização da Clínica', icon: FileCheck, route: '/regularization' },
  
  { id: 'divider-recursos', title: 'Recursos', isDivider: true },
  { id: 'materials', title: 'Central de Materiais', icon: BookOpen, route: '/materials' },
  { id: 'marketing', title: 'Central de Marketing', icon: Megaphone, route: '/marketing' },
  { id: 'store', title: 'Loja Neo-Spa', icon: ShoppingBag, route: '/store' },
  { id: 'partners', title: 'Vitrine de Parceiros', icon: Handshake, route: '/partners' },
  
  { id: 'divider-gestao-cli', title: 'Gestão', isDivider: true },
  { id: 'estrutura-neo', title: 'Estrutura NEO', icon: Briefcase, route: '/estrutura-neo' },
  { id: 'financial', title: 'Gestão Financeira', icon: DollarSign, route: '/financial' },
  { id: 'license-payments', title: 'Financeiro Licença', icon: CreditCard, route: '/license-payments' },
  { id: 'hotleads', title: 'HotLeads', icon: Flame, route: '/hotleads' },
  
  { id: 'divider-suporte', title: 'Suporte & Comunidade', isDivider: true },
  { id: 'mentorship', title: 'Mentoria & Suporte', icon: MessageCircle, route: '/mentorship' },
  { id: 'systems', title: 'Sistemas & Ferramentas', icon: Wrench, route: '/systems' },
  { id: 'career', title: 'Plano de Carreira', icon: TrendingUp, route: '/career' },
  { id: 'community', title: 'Comunidade', icon: Users, route: '/community' },
  { id: 'referral', title: 'Indique e Ganhe', icon: Gift, route: '/indique-e-ganhe' },
];

const getLicenseeTier = (userId: string): LicenseeTier => {
  const tierMap: Record<string, LicenseeTier> = {
    'clinic-1': 'pro',
    'clinic-2': 'expert',
    'clinic-3': 'master'
  };
  return tierMap[userId] || 'basic';
};

export function UnifiedSidebar({ children }: UnifiedSidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Tier é apenas para licenciados, não para admins
  const tier = (!isAdmin && user) ? getLicenseeTier(user.id) : null;
  const tierInfo = tier ? tierConfig[tier] : null;

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Listen for custom event to open sidebar
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsMobileOpen(true);
    };
    
    window.addEventListener('openSidebar', handleOpenSidebar);
    return () => window.removeEventListener('openSidebar', handleOpenSidebar);
  }, []);

  const isActive = (route: string) => location.pathname === route;

  // Filter menu items based on admin status
  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

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

        {/* User Info */}
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
                {isAdmin ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                    <Crown className="h-3 w-3" />
                    <span className="ml-1">Admin</span>
                  </Badge>
                ) : tierInfo && (
                  <Badge className={cn("text-[10px] px-1.5 py-0", tierInfo.bgColor, tierInfo.color)}>
                    {tierInfo.icon}
                    <span className="ml-1">{tierInfo.name}</span>
                  </Badge>
                )}
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
            {visibleMenuItems.map((item) => {
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
            
            {/* Separator before logout */}
            <div className="my-3 border-t border-border" />
            
            {/* Logout Button - part of scrollable content */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
                isCollapsed && "justify-center px-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Sair</span>}
            </Button>
          </nav>
        </ScrollArea>

        {/* Footer - only theme toggle */}
        <div className={cn("p-4 border-t", isCollapsed && "flex flex-col items-center")}>
          {isCollapsed ? (
            <ThemeToggle />
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {isAdmin ? 'Painel Administrativo' : 'Portal do Licenciado'}
              </p>
              <ThemeToggle />
            </div>
          )}
        </div>
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
