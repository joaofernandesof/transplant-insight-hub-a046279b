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
  Flame,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/neocrm' },
  { id: 'pipeline', label: 'Pipeline (Kanban)', icon: Kanban, href: '/neocrm/pipeline' },
  { id: 'inbox', label: 'Caixa de Entrada', icon: MessageSquare, href: '/neocrm/inbox', badge: '5' },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo, href: '/neocrm/tasks', badge: '3' },
  { id: 'leads', label: 'Leads', icon: Users, href: '/neocrm/leads' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/neocrm/analytics' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/neocrm/settings' },
];

interface NeoCrmSidebarProps {
  children: React.ReactNode;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-orange-950 to-orange-900">
      {/* Header */}
      <div className="p-4 border-b border-orange-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <Flame className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg">NeoCRM</h1>
              <p className="text-xs text-orange-300/70">Gestão de Vendas</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/neocrm' && location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.id}
                to={item.href}
                onClick={onCollapse}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-orange-500/20 text-orange-100 shadow-sm'
                    : 'text-orange-200/70 hover:bg-orange-800/30 hover:text-orange-100'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-orange-400' : 'text-orange-400/60 group-hover:text-orange-400'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
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

      {/* Footer */}
      <div className="p-3 border-t border-orange-800/50">
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-orange-800/30">
            <p className="text-xs text-orange-300/70 mb-1">Leads Ativos</p>
            <p className="text-lg font-bold text-orange-100">127 leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function NeoCrmSidebar({ children }: NeoCrmSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-orange-950 border-b border-orange-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">NeoCRM</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-orange-100">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-orange-800">
              <SidebarContent collapsed={false} onCollapse={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r border-orange-800/50',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-orange-700 text-white hover:bg-orange-600 shadow-md"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-300',
        collapsed ? 'ml-16' : 'ml-64'
      )}>
        {children}
      </main>
    </div>
  );
}

export default NeoCrmSidebar;
