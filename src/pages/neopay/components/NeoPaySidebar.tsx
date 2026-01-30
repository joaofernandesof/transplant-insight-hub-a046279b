import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Receipt,
  ArrowLeftRight,
  GitBranch,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminBackButton } from '@/components/shared/AdminBackButton';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/neopay' },
  { id: 'products', label: 'Produtos & Serviços', icon: Package, href: '/neopay/products' },
  { id: 'charges', label: 'Cobranças', icon: Receipt, href: '/neopay/charges' },
  { id: 'transactions', label: 'Transações', icon: ArrowLeftRight, href: '/neopay/transactions' },
  { id: 'split', label: 'Split de Pagamentos', icon: GitBranch, href: '/neopay/split' },
  { id: 'subscriptions', label: 'Assinaturas', icon: RefreshCw, href: '/neopay/subscriptions' },
  { id: 'delinquency', label: 'Inadimplência', icon: AlertTriangle, href: '/neopay/delinquency', badge: '3' },
  { id: 'refunds', label: 'Reembolsos', icon: RotateCcw, href: '/neopay/refunds' },
  { id: 'chargebacks', label: 'Chargebacks', icon: ShieldAlert, href: '/neopay/chargebacks', badge: '1' },
  { id: 'automations', label: 'Automações', icon: Zap, href: '/neopay/automations' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/neopay/settings' },
];

interface NeoPaySidebarProps {
  children: React.ReactNode;
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const location = useLocation();
  const { user } = useUnifiedAuth();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-emerald-950 to-emerald-900">
      {/* Header */}
      <div className="p-4 border-b border-emerald-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg">NeoPay</h1>
              <p className="text-xs text-emerald-300/70">Gateway de Pagamentos</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {/* Admin Back Button */}
          <AdminBackButton isCollapsed={collapsed} variant="light" />
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/neopay' && location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.id}
                to={item.href}
                onClick={onCollapse}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-100 shadow-sm'
                    : 'text-emerald-200/70 hover:bg-emerald-800/30 hover:text-emerald-100'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-emerald-400/60 group-hover:text-emerald-400'
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
      <div className="p-3 border-t border-emerald-800/50">
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-emerald-800/30">
            <p className="text-xs text-emerald-300/70 mb-1">Saldo Disponível</p>
            <p className="text-lg font-bold text-emerald-100">R$ 45.892,50</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function NeoPaySidebar({ children }: NeoPaySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-emerald-950 border-b border-emerald-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">NeoPay</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-emerald-100">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-emerald-800">
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
        'fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r border-emerald-800/50',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-emerald-700 text-white hover:bg-emerald-600 shadow-md"
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

export default NeoPaySidebar;
