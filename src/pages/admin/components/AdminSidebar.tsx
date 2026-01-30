/**
 * AdminSidebar - Sidebar dedicada do Portal Administrativo
 * Design azul/slate profissional com acesso a todos os módulos do sistema
 */

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Menu,
  Zap,
  Scale,
  CreditCard,
  Eye,
  Building2,
  FileText,
  Megaphone,
  Calendar,
  Bot,
  GitCompare,
  Flame,
  BookOpen,
  Server,
  Send,
  Home,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VisionIcon } from '@/components/icons/VisionIcon';

const menuSections = [
  {
    id: 'main',
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
      { id: 'metrics', label: 'Métricas', icon: BarChart3, href: '/admin/metrics' },
    ]
  },
  {
    id: 'portals',
    title: 'Portais do NeoHub',
    items: [
      { id: 'academy', label: 'Aluno', icon: GraduationCap, href: '/academy', external: true, gradient: 'from-emerald-500 to-green-600' },
      { id: 'license', label: 'Licenciado', icon: Award, href: '/neolicense', external: true, gradient: 'from-amber-400 to-yellow-500' },
      { id: 'patient', label: 'Paciente', icon: Heart, href: '/neocare', external: true, gradient: 'from-rose-500 to-pink-600' },
      { id: 'staff', label: 'Colaborador', icon: Users, href: '/neoteam', external: true, gradient: 'from-blue-500 to-cyan-600' },
      { id: 'doctor', label: 'Médico', icon: Stethoscope, href: '/neoteam/doctor-view', external: true, gradient: 'from-teal-500 to-cyan-600' },
      { id: 'avivar', label: 'Avivar', icon: Zap, href: '/avivar', external: true, gradient: 'from-purple-500 to-violet-600' },
      { id: 'ipromed', label: 'IPROMED', icon: Scale, href: '/ipromed', external: true, gradient: 'from-blue-600 to-indigo-700' },
      { id: 'vision', label: 'Vision', icon: Eye, href: '/vision', external: true, gradient: 'from-pink-500 to-rose-500' },
      { id: 'neopay', label: 'NeoPay', icon: CreditCard, href: '/neopay', external: true, gradient: 'from-green-500 to-emerald-600' },
    ]
  },
  {
    id: 'users',
    title: 'Gestão de Usuários',
    items: [
      { id: 'all-users', label: 'Todos os Usuários', icon: Users, href: '/admin/users' },
      { id: 'licensees', label: 'Alunos IBRAMEC', icon: Award, href: '/alunos' },
      { id: 'onboarding', label: 'Onboarding', icon: Sparkles, href: '/admin/licensee-onboarding' },
      { id: 'permissions', label: 'Permissões', icon: Shield, href: '/admin/permissions' },
    ]
  },
  {
    id: 'operations',
    title: 'Operações',
    items: [
      { id: 'surgery', label: 'Agenda Cirurgias', icon: Calendar, href: '/admin/surgery-schedule' },
      { id: 'hotleads', label: 'HotLeads', icon: Flame, href: '/hotleads' },
      { id: 'comparison', label: 'Comparar Clínicas', icon: GitCompare, href: '/comparison' },
      { id: 'results', label: 'Resultados', icon: BarChart3, href: '/consolidated-results' },
    ]
  },
  {
    id: 'content',
    title: 'Conteúdo & Educação',
    items: [
      { id: 'university', label: 'Universidade', icon: GraduationCap, href: '/university' },
      { id: 'materials', label: 'Materiais', icon: FileText, href: '/materials' },
      { id: 'exams', label: 'Provas', icon: BookOpen, href: '/exams' },
      { id: 'announcements', label: 'Anúncios', icon: Megaphone, href: '/admin/announcements' },
    ]
  },
  {
    id: 'system',
    title: 'Sistema',
    items: [
      { id: 'monitoring', label: 'Monitoramento', icon: Eye, href: '/monitoring' },
      { id: 'event-logs', label: 'Log de Eventos', icon: Activity, href: '/admin/event-logs' },
      { id: 'sentinel', label: 'System Sentinel', icon: Server, href: '/admin/sentinel' },
      { id: 'code-assistant', label: 'Assistente IA', icon: Bot, href: '/admin/code-assistant' },
      { id: 'api-docs', label: 'API Docs', icon: Zap, href: '/api-docs' },
      { id: 'settings', label: 'Configurações', icon: Settings, href: '/admin/settings' },
    ]
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden border-r border-slate-800">
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 relative overflow-hidden">
            <Shield className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <h1 className="font-bold text-white text-lg">Admin</h1>
              <p className="text-xs text-slate-400">Portal Administrativo</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 relative z-10">
        <nav className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.id}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/admin' && location.pathname.startsWith(item.href));
                  const isExternal = (item as any).external;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.href);
                        onCollapse?.();
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                        isActive
                          ? 'bg-blue-500/20 text-white shadow-lg shadow-blue-500/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                        isExternal && 'border border-slate-700/50'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
                      )}
                      {isExternal && (item as any).gradient ? (
                        <div className={cn(
                          'p-1.5 rounded-lg bg-gradient-to-br',
                          (item as any).gradient
                        )}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <Icon className={cn(
                          'h-5 w-5 flex-shrink-0 transition-all duration-300',
                          isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
                        )} />
                      )}
                      {!collapsed && (
                        <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                      )}
                      {isExternal && !collapsed && (
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 relative z-10">
        {!collapsed && (
          <div className="px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-slate-400">Sistema Online</p>
            </div>
            <p className="text-sm font-semibold text-white">Acesso Total</p>
            <p className="text-xs text-slate-500">Todos os módulos disponíveis</p>
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
