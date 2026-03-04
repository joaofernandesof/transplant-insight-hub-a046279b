// ====================================
// UnifiedSidebar - Sidebar Única do Sistema
// ====================================
// Detecta automaticamente o portal ativo baseado na rota
// Menu derivado de menuConfig.ts - fonte única de verdade
// Fluxos de Processo são injetados dinamicamente via banco de dados

import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Crown, 
  Award, 
  Star, 
  Trophy, 
  Gem, 
  Shield, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Zap,
  LogOut,
  
  User,
  Users,
  Stethoscope,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  Building2,
  Clipboard,
  BookOpen,
  HeartPulse,
  Scale,
  Flame,
  Eye,
  GitCompare,
} from "lucide-react";
import { LayoutGrid } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ModuleSwitcher } from "@/components/shared/ModuleSwitcher";
import { PortalSwitcherButton } from "@/components/shared/PortalSwitcherButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  MAIN_MENU_CATEGORIES, 
  PORTAL_MENUS,
  PORTAL_MENU_CATEGORIES,
  filterMenuByPermissions,
  type MenuItem,
  type MenuCategory,
} from "@/config/menuConfig";
import type { ProfileKey } from "@/contexts/UnifiedAuthContext";

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

const getLicenseeTier = (userId: string): LicenseeTier => {
  const tierMap: Record<string, LicenseeTier> = {
    'clinic-1': 'pro',
    'clinic-2': 'expert',
    'clinic-3': 'master'
  };
  return tierMap[userId] || 'basic';
};

// Portal detection and metadata
type PortalKey = 'admin' | 'neocare' | 'neoteam' | 'neoacademy' | 'neolicense' | 'avivar' | 'hotleads' | 'neorh' | 'main';

interface PortalConfig {
  name: string;
  color: string;
  bgColor: string;
  headerBg: string;
  headerText: string;
  icon: React.ElementType;
  accentBorder: string;
  accentBg: string;
}

const PORTAL_CONFIG: Record<PortalKey, PortalConfig> = {
  admin: { name: 'Administração', color: 'text-purple-700', bgColor: 'bg-purple-100', headerBg: 'bg-gradient-to-r from-purple-900 to-purple-800', headerText: 'text-white', icon: Crown, accentBorder: 'border-l-purple-500', accentBg: 'bg-purple-500' },
  neocare: { name: 'NeoCare', color: 'text-rose-700', bgColor: 'bg-rose-100', headerBg: 'bg-gradient-to-r from-rose-900 to-rose-800', headerText: 'text-white', icon: Heart, accentBorder: 'border-l-rose-500', accentBg: 'bg-rose-500' },
  neoteam: { name: 'NeoTeam', color: 'text-blue-700', bgColor: 'bg-blue-100', headerBg: 'bg-gradient-to-r from-blue-900 to-blue-800', headerText: 'text-white', icon: Users, accentBorder: 'border-l-blue-500', accentBg: 'bg-blue-500' },
  neoacademy: { name: 'NeoAcademy', color: 'text-emerald-700', bgColor: 'bg-emerald-100', headerBg: 'bg-gradient-to-r from-emerald-900 to-emerald-800', headerText: 'text-white', icon: GraduationCap, accentBorder: 'border-l-emerald-500', accentBg: 'bg-emerald-500' },
  neolicense: { name: 'NeoLicense', color: 'text-amber-700', bgColor: 'bg-amber-100', headerBg: 'bg-gradient-to-r from-amber-900 to-amber-800', headerText: 'text-white', icon: Building2, accentBorder: 'border-l-amber-500', accentBg: 'bg-amber-500' },
  avivar: { name: 'Avivar', color: 'text-orange-700', bgColor: 'bg-orange-100', headerBg: 'bg-gradient-to-r from-orange-900 to-orange-800', headerText: 'text-white', icon: Zap, accentBorder: 'border-l-orange-500', accentBg: 'bg-orange-500' },
  hotleads: { name: 'HotLeads', color: 'text-orange-500', bgColor: 'bg-orange-500/10', headerBg: 'bg-gradient-to-r from-orange-600 to-red-600', headerText: 'text-white', icon: Flame, accentBorder: 'border-l-red-500', accentBg: 'bg-red-500' },
  neorh: { name: 'NeoRH', color: 'text-indigo-700', bgColor: 'bg-indigo-100', headerBg: 'bg-gradient-to-r from-indigo-900 to-indigo-800', headerText: 'text-white', icon: Users, accentBorder: 'border-l-indigo-500', accentBg: 'bg-indigo-500' },
  main: { name: 'NeoHub', color: 'text-primary', bgColor: 'bg-primary/10', headerBg: 'bg-gradient-to-r from-slate-900 to-slate-800', headerText: 'text-white', icon: LayoutGrid, accentBorder: 'border-l-slate-500', accentBg: 'bg-slate-500' },
};

function detectPortal(pathname: string): PortalKey {
  if (pathname.startsWith('/neocare')) return 'neocare';
  if (pathname.startsWith('/neoteam')) return 'neoteam';
  if (pathname.startsWith('/academy')) return 'neoacademy';
  if (pathname.startsWith('/hotleads')) return 'hotleads';
  if (pathname.startsWith('/neolicense')) return 'neolicense';
  if (pathname.startsWith('/avivar')) return 'avivar';
  if (pathname.startsWith('/neorh')) return 'neorh';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'main';
}

// Prevent nested sidebars (causes doubled left offset and large blank space)
const UnifiedSidebarNestingContext = createContext(false);

export function UnifiedSidebar({ children }: UnifiedSidebarProps) {
  const isNested = useContext(UnifiedSidebarNestingContext);

  if (isNested) {
    return <>{children}</>;
  }

  return (
    <UnifiedSidebarNestingContext.Provider value={true}>
      <UnifiedSidebarLayout>{children}</UnifiedSidebarLayout>
    </UnifiedSidebarNestingContext.Provider>
  );
}

function UnifiedSidebarLayout({ children }: UnifiedSidebarProps) {
  const { user, isAdmin, logout, activeProfile, setActiveProfile } = useUnifiedAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Detect current portal based on route
  const currentPortal = useMemo(() => detectPortal(location.pathname), [location.pathname]);
  const portalConfig = PORTAL_CONFIG[currentPortal];

  // Fetch dynamic process templates for NeoTeam sidebar
  const { data: processTemplates } = useQuery({
    queryKey: ['sidebar-process-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_process_templates')
        .select('id, name, color, status, category')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: currentPortal === 'neoteam',
    staleTime: 60_000, // cache 1 min
  });
  const { setTheme } = useTheme();

  // Force light theme for HotLeads portal
  useEffect(() => {
    if (currentPortal === 'hotleads') {
      setTheme('light');
    }
  }, [currentPortal, setTheme]);

  // Build profile route based on current portal
  const profileRoute = useMemo(() => {
    const portalProfileMap: Record<string, string> = {
      neolicense: '/neolicense/profile',
      avivar: '/avivar/profile',
      academy: '/academy/profile',
      hotleads: '/neolicense/profile',
      admin: '/neolicense/profile',
      neocare: '/neolicense/profile',
      neoteam: '/neolicense/profile',
      main: '/neolicense/profile',
    };
    return portalProfileMap[currentPortal] || '/neolicense/profile';
  }, [currentPortal]);

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

  const isActive = (route: string) => {
    if (route === location.pathname) return true;
    // For portal root routes (e.g. /hotleads, /neolicense), only match exactly
    const portalRoots = ['hotleads', 'neolicense', 'avivar', 'neoacademy', 'neocare', 'neoteam', 'flow', 'neopay', 'vision', 'postvenda'];
    const isPortalRoot = portalRoots.some(p => route === `/${p}`);
    if (isPortalRoot) return false;
    // Match parent routes for nested paths
    if (route !== '/' && location.pathname.startsWith(route + '/')) return true;
    return false;
  };

  // Função de verificação de permissão (TODO: integrar com sistema real)
  const hasPermission = (moduleCode: string, action?: string): boolean => {
    return true;
  };

  // Get menu items based on current portal
  const menuItems = useMemo((): MenuItem[] => {
    // For portal-specific routes, use portal menu
    if (currentPortal !== 'main' && currentPortal !== 'admin') {
      return PORTAL_MENUS[currentPortal] || [];
    }
    
    // For main/admin, flatten all categories
    return MAIN_MENU_CATEGORIES.flatMap(category => 
      filterMenuByPermissions(category.items, hasPermission, isAdmin).filter(item => {
        if (isAdmin && item.id === 'home') return false;
        return true;
      })
    );
  }, [currentPortal, isAdmin]);

  // Detect active sector from route (e.g. /neoteam/setor/tecnico)
  const activeSectorCode = useMemo(() => {
    const match = location.pathname.match(/\/neoteam\/setor\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Map sector codes to category IDs
  const SECTOR_TO_CATEGORY: Record<string, string> = {
    tecnico: 'setor_clinico',
    sucesso_paciente: 'setor_sucesso_paciente',
    operacional: 'setor_operacional',
    processos: 'setor_processos',
    financeiro: 'setor_financeiro',
    juridico: 'setor_juridico',
    marketing: 'setor_marketing',
    ti: 'setor_ti',
    rh: 'setor_rh',
    administracao: 'setor_admin',
  };

  // Group menu items by category - use categorized menu if available
  const groupedMenuItems = useMemo((): MenuCategory[] => {
    // Check if portal has categorized menu
    const categorizedMenu = PORTAL_MENU_CATEGORIES[currentPortal];
    if (categorizedMenu) {
      let filtered = categorizedMenu.map(category => {
        let items = filterMenuByPermissions(category.items, hasPermission, isAdmin);
        
        // Inject dynamic process templates as children of matching sidebar modules
        if (currentPortal === 'neoteam' && processTemplates?.length) {
          items = items.map(item => {
            // Find flows whose category matches this menu item's id
            // Flows with category 'custom' or null go under "Fluxos de Processo"
            const matchingFlows = processTemplates.filter(pt => {
              // Legacy categories and unset ones go under "Fluxos de Processo"
              const legacyCategories = ['pre_operatorio', 'pos_operatorio', 'documentacao', 'alta'];
              const isUnmapped = !pt.category || pt.category === 'custom' || pt.category === 'neoteam_processos' || legacyCategories.includes(pt.category || '');
              if (item.id === 'neoteam_processos') {
                return isUnmapped;
              }
              return pt.category === item.id;
            });
            if (matchingFlows.length > 0) {
              return {
                ...item,
                children: [
                  ...(item.children || []),
                  ...matchingFlows.map(pt => ({
                    id: `process_${pt.id}`,
                    code: `process_${pt.id}`,
                    title: pt.name,
                    icon: GitCompare,
                    route: `/neoteam/processos/${pt.id}`,
                  })),
                ],
              };
            }
            return item;
          });
        }
        
        return { ...category, items };
      }).filter(category => category.items.length > 0);

      // If inside a sector, show only that sector's items + home
      if (activeSectorCode && currentPortal === 'neoteam') {
        const targetCategoryId = SECTOR_TO_CATEGORY[activeSectorCode];
        filtered = filtered.filter(cat => 
          cat.id === 'neoteam_main' || cat.id === targetCategoryId
        ).map(cat => cat.id === targetCategoryId ? { ...cat, collapsible: false, defaultOpen: true } : cat);
      }

      return filtered;
    }
    
    // For portals without categorized menu, use flat list
    if (currentPortal !== 'main' && currentPortal !== 'admin') {
      return [{ id: 'portal', title: '', items: menuItems }];
    }
    
    // For main/admin, use main menu categories
    return MAIN_MENU_CATEGORIES.map(category => ({
      ...category,
      items: filterMenuByPermissions(category.items, hasPermission, isAdmin).filter(item => {
        if (isAdmin && item.id === 'home') return false;
        return true;
      })
    })).filter(category => category.items.length > 0);
  }, [currentPortal, menuItems, isAdmin, activeSectorCode, processTemplates]);

  // Track open state of collapsible categories
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groupedMenuItems.forEach(cat => {
      if (cat.collapsible) {
        initial[cat.id] = cat.defaultOpen ?? true;
      }
    });
    return initial;
  });

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const PortalIcon = portalConfig.icon;

  // Mobile layout with header like NeoPay
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full overflow-x-hidden">
      {/* Mobile Header - NeoPay style */}
      <header className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b lg:hidden",
        portalConfig.headerBg,
        "border-white/10"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <PortalIcon className={cn("h-4 w-4", portalConfig.headerText)} />
          </div>
          <span className={cn("font-bold", portalConfig.headerText)}>{portalConfig.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("hover:bg-white/10", portalConfig.headerText)}
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

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
          "border-l-[3px]",
          portalConfig.accentBorder,
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Portal accent strip */}
        <div className={cn("h-1 w-full shrink-0", portalConfig.accentBg, "opacity-60")} />
        {/* Collapse button */}
        <div className={cn(
          "p-2 border-b flex",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
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
              className="flex items-center gap-3 rounded-lg p-2 -m-2"
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                {isAdmin ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                    <Crown className="h-3 w-3 mr-1" />
                    Administrador
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
              className="h-10 w-10 ring-2 ring-primary/20"
            >
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Profile Simulator (Admin only) - Simula visualização sem trocar de portal */}
        {isAdmin && !isCollapsed && (
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Users className="h-3.5 w-3.5" />
              <span>Simular Perfil de Acesso:</span>
            </div>
            <Select 
              value={activeProfile || 'administrador'} 
              onValueChange={(value) => {
                // Apenas muda o perfil ativo para simular visualização - NÃO navega para outro portal
                setActiveProfile(value as ProfileKey);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([
                  { key: 'super_administrador', label: 'Super Administrador', icon: Shield },
                  { key: 'administrador', label: 'Administrador', icon: Crown },
                  { key: 'gerente', label: 'Gerente', icon: Building2 },
                  { key: 'coordenador', label: 'Coordenador', icon: Clipboard },
                  { key: 'supervisor', label: 'Supervisor', icon: Star },
                  { key: 'operador', label: 'Operador', icon: Users },
                  { key: 'visualizador', label: 'Visualizador', icon: Eye },
                  { key: 'externo', label: 'Externo', icon: Scale },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeProfile && activeProfile !== 'administrador' && (
              <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                Visualizando como {activeProfile}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {/* Portal Switcher - Always first */}
            <PortalSwitcherButton isCollapsed={isCollapsed} variant="default" />

            {groupedMenuItems.map((category) => (
              <div key={category.id}>
                {/* Non-collapsible category */}
                {(!category.collapsible || isCollapsed) ? (
                  <>
                    {/* Category Header */}
                    {category.title && !isCollapsed && (
                      <div className="pt-4 pb-2 px-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {category.title}
                        </p>
                      </div>
                    )}
                    
                    {/* Category Items */}
                    {category.items.map((item) => (
                      <Button
                        key={item.id}
                        variant={isActive(item.route) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-10",
                          isCollapsed && "justify-center px-2",
                          isActive(item.route) && currentPortal === 'hotleads' 
                            ? "bg-orange-500/10 text-orange-500 font-medium"
                            : isActive(item.route) && "bg-primary/10 text-primary font-medium"
                        )}
                        onClick={() => navigate(item.route)}
                      >
                        {item.icon && <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0", 
                          isActive(item.route) && currentPortal === 'hotleads' ? "text-orange-500" : isActive(item.route) && "text-primary"
                        )} />}
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </Button>
                    ))}
                  </>
                ) : (
                  /* Collapsible category */
                  <Collapsible
                    open={openCategories[category.id] ?? category.defaultOpen ?? true}
                    onOpenChange={() => toggleCategory(category.id)}
                    className="mt-2"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between gap-2 h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          {category.icon && <category.icon className="h-4 w-4" />}
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {category.title}
                          </span>
                        </div>
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            (openCategories[category.id] ?? category.defaultOpen ?? true) && "rotate-90"
                          )} 
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-2 space-y-0.5">
                      {category.items.map((item) => (
                        <div key={item.id}>
                          <Button
                            variant={isActive(item.route) ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 h-9",
                              isActive(item.route) && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => navigate(item.route)}
                          >
                            {item.icon && <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive(item.route) && "text-primary")} />}
                            <span className="truncate text-sm">{item.title}</span>
                          </Button>
                          {/* Render dynamic children (e.g. process templates) */}
                          {item.children && item.children.length > 0 && (
                            <div className="pl-5 space-y-0.5 mt-0.5">
                              {item.children.map((child) => (
                                <Button
                                  key={child.id}
                                  variant={isActive(child.route) ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start gap-2 h-8 text-xs",
                                    isActive(child.route) && "bg-primary/10 text-primary font-medium"
                                  )}
                                  onClick={() => navigate(child.route)}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                                  <span className="truncate">{child.title}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Fixed Footer - Theme Toggle + Logout */}
        <div className="border-t border-border p-2 flex-shrink-0 space-y-1">
          {currentPortal !== 'hotleads' && (
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "px-3")}>
              <ThemeToggle />
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 text-destructive hover:text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate text-sm">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 overflow-x-hidden w-full min-w-0",
        "lg:ml-0",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
