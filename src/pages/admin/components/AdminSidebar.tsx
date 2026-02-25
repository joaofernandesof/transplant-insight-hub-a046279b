/**
 * AdminSidebar - Sidebar enxuta do Portal Administrativo
 * Design azul/slate profissional com portais em menu expansível
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  Shield,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Home,
  UserPlus,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PortalSwitcherButton } from '@/components/shared/PortalSwitcherButton';

// Menu principal enxuto
const mainMenu = [
  { id: 'dashboard', label: 'Início', icon: Home, href: '/admin-portal' },
  { id: 'metrics', label: 'Métricas', icon: BarChart3, href: '/system-metrics' },
];

// Menu de gestão
const managementMenu = [
  { id: 'users', label: 'Usuários', icon: Users, href: '/admin' },
  { id: 'approvals', label: 'Aprovações', icon: UserPlus, href: '/admin/approvals' },
  { id: 'permissions', label: 'Permissões', icon: Shield, href: '/access-matrix' },
];

// Menu do sistema
const systemMenu = [
  { id: 'monitoring', label: 'Monitoramento', icon: Activity, href: '/admin-portal/monitoring' },
  { id: 'announcements', label: 'Anúncios', icon: Bell, href: '/admin/announcements' },
  { id: 'travas-agenda', label: 'Travas da Agenda', icon: Lock, href: '/admin/travas-agenda' },
  { id: 'event-logs', label: 'Logs', icon: Activity, href: '/admin/event-logs' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/admin/sentinel' },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (href: string) => {
    navigate(href);
    onCollapse?.();
  };

  const isActive = (href: string) =>
    location.pathname === href || 
    (href !== '/admin-portal' && location.pathname.startsWith(href));

  const MenuItem = ({ item }: { item: { id: string; label: string; icon: React.ElementType; href: string } }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <button
        onClick={() => handleNavigate(item.href)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
          active
            ? 'bg-blue-500/20 text-white'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        )}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
        )}
        <Icon className={cn(
          'h-5 w-5 flex-shrink-0 transition-colors',
          active ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
        )} />
        {!collapsed && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg">Admin</h1>
              <p className="text-xs text-slate-400">Portal Administrativo</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {/* Portal Switcher - Sempre primeiro */}
          <PortalSwitcherButton 
            isCollapsed={collapsed} 
            variant="light" 
            onNavigate={onCollapse}
          />

          {/* Menu principal */}
          {mainMenu.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}

          {/* Gestão */}
          {managementMenu.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}

          {/* Sistema */}
          {systemMenu.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-slate-400">Sistema Online</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar({ collapsed, onToggle, onMobileClose }: AdminSidebarProps) {
  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen transition-all duration-300 z-40',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <SidebarContent collapsed={collapsed} onCollapse={onMobileClose} />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/30"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}

export default AdminSidebar;
