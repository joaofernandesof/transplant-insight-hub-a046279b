// ====================================
// UnifiedSidebar - Sidebar Única do Sistema
// ====================================
// Detecta automaticamente o portal ativo baseado na rota
// Menu derivado de menuConfig.ts - fonte única de verdade

import { useNavigate, useLocation } from "react-router-dom";
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
  LogOut,
  Layers,
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemedLogo } from "@/components/ThemedLogo";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
type PortalKey = 'admin' | 'neocare' | 'neoteam' | 'academy' | 'neolicense' | 'avivar' | 'main';

interface PortalConfig {
  name: string;
  color: string;
  bgColor: string;
}

const PORTAL_CONFIG: Record<PortalKey, PortalConfig> = {
  admin: { name: 'Administração', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  neocare: { name: 'NeoCare', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  neoteam: { name: 'NeoTeam', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  academy: { name: 'Academy IBRAMEC', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  neolicense: { name: 'NeoLicense', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  avivar: { name: 'Avivar', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  main: { name: 'NeoHub', color: 'text-primary', bgColor: 'bg-primary/10' },
};

function detectPortal(pathname: string): PortalKey {
  if (pathname.startsWith('/neocare')) return 'neocare';
  if (pathname.startsWith('/neoteam')) return 'neoteam';
  if (pathname.startsWith('/academy')) return 'academy';
  if (pathname.startsWith('/neolicense')) return 'neolicense';
  if (pathname.startsWith('/avivar')) return 'avivar';
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

  // Group menu items by category - use categorized menu if available
  const groupedMenuItems = useMemo((): MenuCategory[] => {
    // Check if portal has categorized menu
    const categorizedMenu = PORTAL_MENU_CATEGORIES[currentPortal];
    if (categorizedMenu) {
      return categorizedMenu.map(category => ({
        ...category,
        items: filterMenuByPermissions(category.items, hasPermission, isAdmin),
      })).filter(category => category.items.length > 0);
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
  }, [currentPortal, menuItems, isAdmin]);

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
        {/* Logo & Portal indicator - hide logo on admin dashboard */}
        {(currentPortal !== 'admin' && currentPortal !== 'main') && (
          <div className={cn(
            "p-4 border-b flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <ThemedLogo className="h-8 object-contain" />
                <Badge className={cn("text-[10px] px-1.5 py-0", portalConfig.bgColor, portalConfig.color)}>
                  {portalConfig.name}
                </Badge>
              </div>
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
        )}
        
        {/* Collapse button when no logo header (admin/main) */}
        {(currentPortal === 'admin' || currentPortal === 'main') && (
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
        )}

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
              className="h-10 w-10 cursor-pointer ring-2 ring-primary/20"
              onClick={() => navigate('/profile')}
            >
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Module Selector (Admin only) */}
        {isAdmin && !isCollapsed && (
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Layers className="h-3.5 w-3.5" />
              <span>Módulo:</span>
            </div>
            <Select value={currentPortal} onValueChange={(value) => {
              const portalRoutes: Record<PortalKey, string> = {
                admin: '/admin-dashboard',
                neocare: '/neocare',
                neoteam: '/neoteam',
                academy: '/academy',
                neolicense: '/neolicense',
                avivar: '/avivar',
                main: '/admin-dashboard',
              };
              navigate(portalRoutes[value as PortalKey] || '/admin-dashboard');
            }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { key: 'admin' as PortalKey, label: 'Administração', icon: LayoutDashboard },
                  { key: 'neoteam' as PortalKey, label: 'NeoTeam', icon: Clipboard },
                  { key: 'neocare' as PortalKey, label: 'NeoCare', icon: HeartPulse },
                  { key: 'academy' as PortalKey, label: 'Academy IBRAMEC', icon: BookOpen },
                  { key: 'neolicense' as PortalKey, label: 'NeoLicense', icon: Building2 },
                  { key: 'avivar' as PortalKey, label: 'Avivar', icon: Sparkles },
                ].map(({ key, label, icon: Icon }) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {/* Admin shortcut when in a portal (not main/admin) */}
            {isAdmin && currentPortal !== 'main' && currentPortal !== 'admin' && (
              <>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => navigate('/admin-dashboard')}
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">Início Admin</span>}
                </Button>
                <div className="my-2 border-t border-border" />
              </>
            )}

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
                          isActive(item.route) && "bg-primary/10 text-primary font-medium"
                        )}
                        onClick={() => navigate(item.route)}
                      >
                        {item.icon && <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive(item.route) && "text-primary")} />}
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
                        <Button
                          key={item.id}
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
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
            
            {/* Separator before footer actions */}
            <div className="my-3 border-t border-border" />
            
            {/* Switch Module */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-9 text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => navigate('/select-profile')}
            >
              <Layers className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate text-sm">Alternar Módulo</span>}
            </Button>
            
            {/* Logout Button */}
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
          </nav>
        </ScrollArea>
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
