/**
 * AdminSidebar - Sidebar enxuta do Portal Administrativo
 * Design azul/slate profissional com portais em menu expansível
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  Heart,
  Stethoscope,
  Shield,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Scale,
  CreditCard,
  Eye,
  Layers,
  Server,
  Bell,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Portais disponíveis (menu expansível)
const portals = [
  { id: 'academy', label: 'Aluno', icon: GraduationCap, href: '/academy', gradient: 'from-emerald-500 to-green-600' },
  { id: 'license', label: 'Licenciado', icon: Award, href: '/neolicense', gradient: 'from-amber-400 to-yellow-500' },
  { id: 'patient', label: 'Paciente', icon: Heart, href: '/neocare', gradient: 'from-rose-500 to-pink-600' },
  { id: 'staff', label: 'Colaborador', icon: Users, href: '/neoteam', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'doctor', label: 'Médico', icon: Stethoscope, href: '/neoteam/doctor-view', gradient: 'from-teal-500 to-cyan-600' },
  { id: 'avivar', label: 'Avivar', icon: Zap, href: '/avivar', gradient: 'from-purple-500 to-violet-600' },
  { id: 'ipromed', label: 'IPROMED', icon: Scale, href: '/ipromed', gradient: 'from-blue-600 to-indigo-700' },
  { id: 'vision', label: 'Vision', icon: Eye, href: '/vision', gradient: 'from-pink-500 to-rose-500' },
  { id: 'neopay', label: 'NeoPay', icon: CreditCard, href: '/neopay', gradient: 'from-green-500 to-emerald-600' },
];

// Menu principal enxuto
const mainMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin-portal' },
  { id: 'metrics', label: 'Métricas', icon: BarChart3, href: '/admin/metrics' },
];

// Menu de gestão
const managementMenu = [
  { id: 'users', label: 'Usuários', icon: Users, href: '/admin/users' },
  { id: 'permissions', label: 'Permissões', icon: Shield, href: '/admin/permissions' },
];

// Menu do sistema
const systemMenu = [
  { id: 'announcements', label: 'Anúncios', icon: Bell, href: '/admin/announcements' },
  { id: 'event-logs', label: 'Logs', icon: Activity, href: '/admin/event-logs' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/admin/settings' },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [portalsOpen, setPortalsOpen] = useState(false);

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
        <nav className="space-y-6">
          {/* Principal */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Principal
              </p>
            )}
            {mainMenu.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>

          {/* Portais - Collapsible */}
          <div>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Portais
              </p>
            )}
            <Collapsible open={portalsOpen} onOpenChange={setPortalsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                    portalsOpen && 'bg-slate-800/30 text-white'
                  )}
                >
                  <Layers className="h-5 w-5 text-slate-500" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium text-left">Acessar Portal</span>
                      <ChevronDown className={cn(
                        'h-4 w-4 text-slate-500 transition-transform duration-200',
                        portalsOpen && 'rotate-180'
                      )} />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1 pl-2">
                {portals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <button
                      key={portal.id}
                      onClick={() => handleNavigate(portal.href)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-slate-400 hover:bg-slate-800/50 hover:text-white group"
                    >
                      <div className={cn(
                        'p-1.5 rounded-md bg-gradient-to-br',
                        portal.gradient
                      )}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      {!collapsed && (
                        <>
                          <span className="text-sm">{portal.label}</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto text-slate-600 group-hover:text-slate-400" />
                        </>
                      )}
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Gestão */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Gestão
              </p>
            )}
            {managementMenu.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>

          {/* Sistema */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Sistema
              </p>
            )}
            {systemMenu.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
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
