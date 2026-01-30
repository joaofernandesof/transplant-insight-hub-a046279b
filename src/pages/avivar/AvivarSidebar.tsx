/**
 * AvivarSidebar - Sidebar do Portal Avivar com branding roxo/violeta IA
 * Estilo contemporâneo, futurístico, com gradientes roxos e efeitos de brilho
 */

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Kanban,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/avivar' },
  { id: 'pipeline', label: 'Pipeline (Kanban)', icon: Kanban, href: '/avivar/pipeline' },
  { id: 'inbox', label: 'Caixa de Entrada', icon: MessageSquare, href: '/avivar/inbox', badge: '5' },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo, href: '/avivar/tasks', badge: '3' },
  { id: 'leads', label: 'Leads', icon: Users, href: '/avivar/leads' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/avivar/analytics' },
  { id: 'divider1', label: '', icon: null, href: '', isDivider: true },
  { id: 'traffic', label: 'Tráfego', icon: TrendingUp, href: '/avivar/traffic' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, href: '/avivar/marketing' },
  { id: 'mentorship', label: 'Mentoria', icon: GraduationCap, href: '/avivar/mentorship' },
  { id: 'divider2', label: '', icon: null, href: '', isDivider: true },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/avivar/settings' },
];

interface AvivarSidebarProps {
  children: React.ReactNode;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0f0a1e] via-[#1a0f2e] to-[#0f0a1e] relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-1/2 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 right-0 w-24 h-24 bg-violet-500/15 rounded-full blur-2xl animate-pulse delay-1000" />
      
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 relative">
            <Zap className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/50 to-transparent animate-pulse" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg flex items-center gap-1.5">
                AVIVAR
                <Sparkles className="h-4 w-4 text-purple-400" />
              </h1>
              <p className="text-xs text-purple-300/60">Inteligência Artificial</p>
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
                <div key={item.id} className="my-3 border-t border-purple-500/20" />
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
                    ? 'bg-gradient-to-r from-purple-600/30 to-violet-600/20 text-white shadow-lg shadow-purple-500/10'
                    : 'text-purple-200/60 hover:bg-purple-500/10 hover:text-purple-100'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-400 to-violet-500 rounded-r-full" />
                )}
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-all duration-300',
                  isActive ? 'text-purple-300' : 'text-purple-400/50 group-hover:text-purple-300'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="h-5 px-1.5 text-xs bg-gradient-to-r from-purple-500 to-violet-600 border-0 text-white">
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
      <div className="p-3 border-t border-purple-500/20 relative z-10">
        {!collapsed && (
          <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-purple-900/50 to-violet-900/30 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-purple-300/70">IA Ativa</p>
            </div>
            <p className="text-lg font-bold text-white">127 leads</p>
            <p className="text-xs text-purple-300/50">Processados hoje</p>
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
      <div className="flex flex-col min-h-screen bg-[#0a0612]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0f0a1e] to-[#1a0f2e] border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white flex items-center gap-1">
              AVIVAR
              <Sparkles className="h-3 w-3 text-purple-400" />
            </span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-purple-100 hover:bg-purple-500/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-purple-500/30 bg-transparent">
              <SidebarContent collapsed={false} onCollapse={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto bg-gradient-to-br from-[#0a0612] via-[#12081f] to-[#0a0612]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0612]">
      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r border-purple-500/20',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-500 hover:to-violet-500 shadow-md shadow-purple-500/30"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-300 bg-gradient-to-br from-[#0a0612] via-[#12081f] to-[#0a0612]',
        collapsed ? 'ml-16' : 'ml-64'
      )}>
        {children}
      </main>
    </div>
  );
}

export default AvivarSidebar;
