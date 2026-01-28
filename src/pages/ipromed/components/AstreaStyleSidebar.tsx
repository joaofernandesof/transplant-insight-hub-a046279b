/**
 * IPROMED - Astrea-style Sidebar Navigation
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  badgeColor?: string;
  isNew?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: 'home', label: 'Início', icon: Home, href: '/ipromed' },
  { id: 'workspace', label: 'Área de trabalho', icon: LayoutGrid, href: '/ipromed/legal' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, href: '/ipromed/legal?tab=agenda' },
  { id: 'contacts', label: 'Contatos', icon: Users, href: '/ipromed/clients' },
  { id: 'services', label: 'Atendimentos', icon: MessageCircle, href: '/ipromed/legal?tab=portal' },
  { id: 'cases', label: 'Processos e casos', icon: FolderOpen, href: '/ipromed/legal?tab=cases' },
  { id: 'movements', label: 'Andamentos', icon: LayoutGrid, href: '/ipromed/legal?tab=movements' },
  { id: 'documents', label: 'Documentos', icon: FileBox, href: '/ipromed/legal?tab=documents' },
  { id: 'templates', label: 'Templates', icon: FileText, href: '/ipromed/legal?tab=templates' },
  { id: 'publications', label: 'Publicações', icon: FileText, href: '/ipromed/legal?tab=publications', badge: 99, badgeColor: 'bg-rose-500' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, href: '/ipromed/legal?tab=financial' },
  { id: 'billing', label: 'Régua de Cobrança', icon: Bell, href: '/ipromed/legal?tab=billing' },
  { id: 'timesheet', label: 'Timesheet', icon: LayoutGrid, href: '/ipromed/legal?tab=timesheet', isNew: true },
  { id: 'ai', label: 'IA Jurídica', icon: Sparkles, href: '/ipromed/legal?tab=ai', isNew: true },
  { id: 'tags', label: 'Etiquetas', icon: LayoutGrid, href: '/ipromed/legal?tab=tags' },
  { id: 'indicators', label: 'Indicadores', icon: BarChart3, href: '/ipromed/legal?tab=analytics' },
  { id: 'alerts', label: 'Alertas', icon: Bell, href: '/ipromed/legal?tab=alerts', badge: 5, badgeColor: 'bg-rose-500' },
];

interface AstreaStyleSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function AstreaStyleSidebar({ isCollapsed = false, onToggle }: AstreaStyleSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUnifiedAuth();

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "h-screen bg-card border-r flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-primary">IPROMED</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
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
                      <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5">
                        <Sparkles className="h-3 w-3 mr-0.5" />
                        IA
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
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t py-4 px-2 space-y-1">
        <NavLink
          to="/ipromed/support"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-muted"
          )}
        >
          <HelpCircle className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Suporte</span>}
        </NavLink>
        
        <Separator className="my-2" />
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
