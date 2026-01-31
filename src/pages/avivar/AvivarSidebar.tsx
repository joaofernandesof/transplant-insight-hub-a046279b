/**
 * AvivarSidebar - Sidebar do Portal Avivar com branding roxo/violeta IA
 * Suporte a tema claro e escuro mantendo a identidade roxa
 */

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  ListTodo,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Zap,
  Sparkles,
  TrendingUp,
  Megaphone,
  GraduationCap,
  RefreshCw,
  Package,
  Activity,
  Briefcase,
  HeartPulse,
  CalendarDays,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/avivar' },
  { id: 'comercial', label: 'Kanban Comercial', icon: Briefcase, href: '/avivar/comercial', isHighlight: true },
  { id: 'posvenda', label: 'Kanban Pós-Venda', icon: HeartPulse, href: '/avivar/posvenda', isHighlight: true },
  { id: 'divider0', label: '', icon: null, href: '', isDivider: true },
  { id: 'inbox', label: 'Chats', icon: MessageSquare, href: '/avivar/inbox', badge: '5' },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo, href: '/avivar/tasks', badge: '3' },
  { id: 'leads', label: 'Leads', icon: Users, href: '/avivar/leads' },
  { id: 'followup', label: 'Follow-up', icon: RefreshCw, href: '/avivar/followup', badge: '12' },
  { id: 'cadences', label: 'Cadências', icon: Zap, href: '/avivar/cadences', isHighlight: true },
  { id: 'catalog', label: 'Catálogo', icon: Package, href: '/avivar/catalog' },
  { id: 'divider1', label: '', icon: null, href: '', isDivider: true },
  { id: 'config', label: 'Configurar IA', icon: Sparkles, href: '/avivar/config' },
  { id: 'divider1b', label: '', icon: null, href: '', isDivider: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/avivar/analytics' },
  { id: 'productivity', label: 'Produtividade', icon: Activity, href: '/avivar/productivity' },
  { id: 'divider2', label: '', icon: null, href: '', isDivider: true },
  { id: 'traffic', label: 'Tráfego', icon: TrendingUp, href: '/avivar/traffic' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, href: '/avivar/marketing' },
  { id: 'mentorship', label: 'Mentoria', icon: GraduationCap, href: '/avivar/mentorship' },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, href: '/avivar/agenda', isHighlight: true },
  { id: 'divider3', label: '', icon: null, href: '', isDivider: true },
  { id: 'integrations', label: 'Integrações', icon: Link2, href: '/avivar/integrations', isHighlight: true },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/avivar/settings' },
];

interface AvivarSidebarProps {
  children: React.ReactNode;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--avivar-card))] relative overflow-hidden border-r border-[hsl(var(--avivar-border))]">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-1/2 w-32 h-32 bg-[hsl(var(--avivar-primary)/0.15)] rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 right-0 w-24 h-24 bg-[hsl(var(--avivar-accent)/0.1)] rounded-full blur-2xl animate-pulse delay-1000" />
      
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--avivar-border))] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center shadow-lg shadow-[hsl(270_75%_45%/0.4)] relative overflow-hidden">
            <Zap className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <h1 className="font-bold text-[hsl(260_40%_12%)] text-lg flex items-center gap-1.5">
                AVIVAR
                <Sparkles className="h-4 w-4 text-[hsl(270_75%_45%)]" />
              </h1>
              <p className="text-xs text-[hsl(260_20%_40%)] font-medium">Inteligência Artificial</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 relative z-10">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            if (item.isDivider) {
              return (
                <div key={item.id} className="my-3 border-t border-[hsl(var(--avivar-border))]" />
              );
            }

            const Icon = item.icon!;
            const isActive = location.pathname === item.href || 
              (item.href !== '/avivar' && location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.id}
                to={item.href}
                onClick={onCollapse}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                  isActive
                    ? 'bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-foreground))] shadow-lg shadow-[hsl(var(--avivar-primary)/0.1)]'
                    : 'text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.08)] hover:text-[hsl(var(--avivar-foreground))]',
                  (item as any).isHighlight && !isActive && 'bg-gradient-to-r from-[hsl(var(--avivar-primary)/0.05)] to-[hsl(var(--avivar-accent)/0.05)] border border-[hsl(var(--avivar-primary)/0.2)]'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--avivar-gradient)] rounded-r-full" />
                )}
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-all duration-300',
                  isActive ? 'text-[hsl(var(--avivar-primary))]' : 'text-[hsl(var(--avivar-muted-foreground))] group-hover:text-[hsl(var(--avivar-primary))]',
                  (item as any).isHighlight && 'text-[hsl(var(--avivar-primary))]'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="h-5 px-1.5 text-xs bg-[hsl(var(--avivar-primary))] border-0 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-[hsl(var(--avivar-border))] relative z-10">
        {!collapsed && (
          <div className="px-3 py-3 rounded-xl bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-border))]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">IA Ativa</p>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--avivar-foreground))]">127 leads</p>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Processados hoje</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AvivarSidebar({ children }: AvivarSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-[hsl(var(--avivar-background))]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[hsl(var(--avivar-card))] border-b border-[hsl(var(--avivar-border))]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center shadow-lg shadow-[hsl(270_75%_45%/0.3)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[hsl(260_40%_12%)] flex items-center gap-1">
              AVIVAR
              <Sparkles className="h-3 w-3 text-[hsl(270_75%_45%)]" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-[hsl(var(--avivar-border))] bg-transparent">
                <SidebarContent collapsed={false} onCollapse={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[hsl(var(--avivar-background))]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[hsl(var(--avivar-background))]">
      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-[hsl(var(--avivar-primary))] text-white hover:bg-[hsl(var(--avivar-accent))] shadow-md shadow-[hsl(var(--avivar-primary)/0.3)]"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-300 bg-[hsl(var(--avivar-background))]',
        collapsed ? 'ml-16' : 'ml-64'
      )}>
        {children}
      </main>
    </div>
  );
}

export default AvivarSidebar;
