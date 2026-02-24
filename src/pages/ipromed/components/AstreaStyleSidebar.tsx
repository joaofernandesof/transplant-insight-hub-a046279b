/**
 * CPG Advocacia Médica - Astrea-style Sidebar Navigation
 * Navegação lateral inspirada no Astrea
 */

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  Calendar,
  Users,
  MessageCircle,
  FolderOpen,
  FileText,
  DollarSign,
  Sparkles,
  FileBox,
  BarChart3,
  Bell,
  HelpCircle,
  Home,
  LogOut,
  Scale,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  GraduationCap,
  Radar,
  Activity,
  CheckSquare,
  Target,
  FileSignature,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { PortalSwitcherButton } from "@/components/shared/PortalSwitcherButton";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  badgeColor?: string;
  isNew?: boolean;
  tourId?: string;
}

// CPG - Escritório Jurídico
const cpgNavItems: NavItem[] = [
  { id: 'home', label: 'Início', icon: Home, href: '/cpg', tourId: 'sidebar-home' },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/cpg/dashboard', tourId: 'sidebar-dashboard' },
  { id: 'clients', label: 'Clientes', icon: Users, href: '/cpg/clients', tourId: 'sidebar-clients' },
  { id: 'contracts', label: 'Contratos', icon: FileText, href: '/cpg/contracts', tourId: 'sidebar-contracts' },
  { id: 'journey', label: 'Jornada do Cliente', icon: LayoutGrid, href: '/cpg/journey' },
  { id: 'sales-funnel', label: 'Funil Comercial', icon: Target, href: '/cpg/sales-funnel' },
  { id: 'proposals', label: 'Propostas', icon: FileSignature, href: '/cpg/proposals', isNew: true },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare, href: '/cpg/tasks' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, href: '/cpg/financial', tourId: 'sidebar-financial' },
  { id: 'push', label: 'Push Jurídico', icon: Radar, href: '/cpg/push-juridico' },
  
  { id: 'agenda', label: 'Agenda', icon: Calendar, href: '/cpg/agenda', tourId: 'sidebar-agenda' },
  { id: 'cases', label: 'Processos', icon: FolderOpen, href: '/cpg/cases', tourId: 'sidebar-cases' },
  { id: 'contracts-hub', label: 'Contratos', icon: FileBox, href: '/cpg/contracts-hub' },
  { id: 'ai', label: 'IA Jurídica', icon: Sparkles, href: '/cpg/ai', tourId: 'sidebar-ai' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, href: '/cpg/reports' },
  { id: 'activity-logs', label: 'Log de Ações', icon: Activity, href: '/cpg/logs' },
];

// CPG Advocacia Médica - Educacional
const ipromedNavItems: NavItem[] = [
  { id: 'university', label: 'Universidade', icon: GraduationCap, href: '/cpg/university', tourId: 'sidebar-university' },
  { id: 'students', label: 'Alunos', icon: FolderOpen, href: '/cpg/students' },
];

interface AstreaStyleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AstreaStyleSidebar({ 
  isCollapsed, 
  onToggle,
  isMobileOpen = false,
  onMobileClose 
}: AstreaStyleSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useUnifiedAuth();

  const userName = user?.fullName || 'Usuário';
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card border-r flex flex-col transition-all duration-300 z-40",
        isCollapsed ? "w-16" : "w-60",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Collapse button */}
        <div className={cn(
          "p-2 border-b flex",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={onToggle}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Logo */}
        <div className={cn(
          "flex flex-col border-b py-3",
          isCollapsed ? "items-center px-2" : "px-4"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-primary">CPG</span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-primary">{userInitials}</span>
              </div>
              <span className="text-xs text-muted-foreground truncate">{userName}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {/* Portal Switcher - Always first */}
            <PortalSwitcherButton isCollapsed={isCollapsed} variant="default" />
            
            {/* CPG Section Header */}
            {!isCollapsed && (
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  CPG Escritório
                </p>
              </div>
            )}
            {isCollapsed && <Separator className="my-2" />}
            
            {cpgNavItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  onClick={onMobileClose}
                  data-tour={item.tourId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                    isCollapsed && "justify-center px-2",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-primary" : "text-muted-foreground"
                  )} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      
                      {item.isNew && (
                        <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">
                          Novo
                        </Badge>
                      )}
                      
                      {item.badge && (
                        <Badge className={cn("text-white text-xs px-1.5 min-w-[20px] justify-center", item.badgeColor)}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* CPG Advocacia Médica Section Header */}
            {!isCollapsed && (
              <div className="px-3 pt-4 pb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  CPG Educacional
                </p>
              </div>
            )}
            {isCollapsed && <Separator className="my-2" />}
            
            {ipromedNavItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  onClick={onMobileClose}
                  data-tour={item.tourId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                    isCollapsed && "justify-center px-2",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-primary" : "text-muted-foreground"
                  )} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      
                      {item.badge && (
                        <Badge className={cn("text-white text-xs px-1.5 min-w-[20px] justify-center", item.badgeColor)}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t py-4 px-2 space-y-1">
          <Separator className="my-2" />
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-3 py-2.5 h-auto text-destructive hover:text-destructive hover:bg-destructive/10",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
