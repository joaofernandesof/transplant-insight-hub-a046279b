/**
 * NeoFinance Sidebar - Navegação do Portal Financeiro
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  TrendingUp,
  Wallet,
  CreditCard,
  Building2,
  Receipt,
  PieChart,
  ArrowLeftRight,
  Settings,
  AlertTriangle,
  FileText,
  Users,
  ChevronLeft,
  DollarSign,
  Landmark,
  BarChart3
} from 'lucide-react';

const menuItems = [
  {
    group: 'Visão Geral',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/neofinance' },
      { label: 'Resumo Consolidado', icon: PieChart, href: '/neofinance/consolidated' },
    ]
  },
  {
    group: 'Gateway (NeoPay)',
    items: [
      { label: 'Transações', icon: ArrowLeftRight, href: '/neofinance/gateway/transactions' },
      { label: 'Assinaturas', icon: CreditCard, href: '/neofinance/gateway/subscriptions' },
      { label: 'Cobranças', icon: Receipt, href: '/neofinance/gateway/charges' },
      { label: 'Split & Repasses', icon: Landmark, href: '/neofinance/gateway/split' },
    ]
  },
  {
    group: 'Portais',
    items: [
      { label: 'NeoTeam (Clínicas)', icon: Building2, href: '/neofinance/portals/neoteam' },
      { label: 'IPROMED (Jurídico)', icon: FileText, href: '/neofinance/portals/ipromed' },
      { label: 'Academy (Educação)', icon: Users, href: '/neofinance/portals/academy' },
      { label: 'NeoLicense', icon: Wallet, href: '/neofinance/portals/neolicense' },
    ]
  },
  {
    group: 'Análises',
    items: [
      { label: 'Receitas & Despesas', icon: TrendingUp, href: '/neofinance/analytics/revenue' },
      { label: 'Fluxo de Caixa', icon: BarChart3, href: '/neofinance/analytics/cashflow' },
      { label: 'Inadimplência', icon: AlertTriangle, href: '/neofinance/analytics/delinquency' },
    ]
  },
  {
    group: 'Configurações',
    items: [
      { label: 'Configurações', icon: Settings, href: '/neofinance/settings' },
    ]
  },
];

interface NeoFinanceSidebarProps {
  children: React.ReactNode;
}

export default function NeoFinanceSidebar({ children }: NeoFinanceSidebarProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        {/* Header */}
        <div className="p-4 border-b">
          <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Voltar ao Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">NeoFinance</h2>
              <p className="text-xs text-muted-foreground">Gestão Financeira</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-6">
            {menuItems.map((group) => (
              <div key={group.group}>
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/neofinance' && location.pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
