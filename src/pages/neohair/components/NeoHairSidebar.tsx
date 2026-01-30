import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Scan,
  Package,
  ShoppingCart,
  Users,
  UserCheck,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  History,
  Stethoscope,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

// Menus por perfil
const patientMenu = [
  { id: 'home', label: 'Início', icon: LayoutDashboard, href: '/neohair' },
  { id: 'evaluation', label: 'Avaliação Capilar', icon: Scan, href: '/neohair/avaliacao' },
  { id: 'evolution', label: 'Minha Evolução', icon: TrendingUp, href: '/neohair/evolucao' },
  { id: 'history', label: 'Histórico', icon: History, href: '/neohair/historico' },
  { id: 'store', label: 'Loja de Tratamentos', icon: ShoppingCart, href: '/neohair/loja' },
  { id: 'orders', label: 'Meus Pedidos', icon: Package, href: '/neohair/pedidos' },
  { id: 'consultation', label: 'Agendar Consulta', icon: Stethoscope, href: '/neohair/consulta' },
];

const professionalMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/neohair/profissional' },
  { id: 'leads', label: 'Leads de Transplante', icon: Users, href: '/neohair/leads', badge: 'new' },
  { id: 'patients', label: 'Meus Pacientes', icon: UserCheck, href: '/neohair/pacientes' },
  { id: 'metrics', label: 'Métricas', icon: BarChart3, href: '/neohair/metricas' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/neohair/configuracoes' },
];

const adminMenu = [
  { id: 'admin', label: 'Painel Admin', icon: Crown, href: '/neohair/admin' },
  { id: 'products', label: 'Produtos', icon: Package, href: '/neohair/admin/produtos' },
  { id: 'leads-admin', label: 'Gestão de Leads', icon: Users, href: '/neohair/admin/leads' },
  { id: 'distribution', label: 'Distribuição', icon: TrendingUp, href: '/neohair/admin/distribuicao' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, href: '/neohair/admin/relatorios' },
  { id: 'settings-admin', label: 'Configurações', icon: Settings, href: '/neohair/admin/configuracoes' },
];

interface NeoHairSidebarProps {
  children: React.ReactNode;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();
  const { user, isAdmin } = useUnifiedAuth();

  // Determinar menu baseado no perfil
  const isProfessional = user?.profiles.some(p => ['medico', 'licenciado', 'colaborador'].includes(p));
  
  const menuItems = isAdmin 
    ? [...patientMenu, { id: 'divider1', label: 'Profissional', divider: true }, ...professionalMenu, { id: 'divider2', label: 'Administração', divider: true }, ...adminMenu]
    : isProfessional 
      ? [...patientMenu, { id: 'divider1', label: 'Profissional', divider: true }, ...professionalMenu]
      : patientMenu;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-950 to-teal-900">
      {/* Header */}
      <div className="p-4 border-b border-teal-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg">NeoHair</h1>
              <p className="text-xs text-teal-300/70">Tratamento Capilar</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item: any) => {
            if (item.divider) {
              return collapsed ? null : (
                <div key={item.id} className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-teal-400/60 uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/neohair' && location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.id}
                to={item.href}
                onClick={onCollapse}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-teal-500/20 text-teal-100 shadow-sm'
                    : 'text-teal-200/70 hover:bg-teal-800/30 hover:text-teal-100'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-teal-400' : 'text-teal-400/60 group-hover:text-teal-400'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="h-5 px-1.5 text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
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
      <div className="p-3 border-t border-teal-800/50">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-lg bg-teal-800/30">
            <p className="text-xs text-teal-300/70 mb-1">Olá,</p>
            <p className="text-sm font-medium text-teal-100 truncate">{user.fullName}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function NeoHairSidebar({ children }: NeoHairSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile Header - Padrão NeoHub */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-teal-950 border-b border-teal-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">NeoHair</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-teal-100">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-teal-800">
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
        'fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r border-teal-800/50',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-teal-700 text-white hover:bg-teal-600 shadow-md"
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

export default NeoHairSidebar;
