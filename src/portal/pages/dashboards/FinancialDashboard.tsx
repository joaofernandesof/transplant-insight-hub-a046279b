import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, 
  Receipt, ArrowRight, CreditCard, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../contexts/PortalAuthContext';

export default function FinancialDashboard() {
  const { user } = usePortalAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Receitas (Mês)', value: 'R$ 0,00', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Despesas (Mês)', value: 'R$ 0,00', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Saldo', value: 'R$ 0,00', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'A Receber', value: 'R$ 0,00', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const quickActions = [
    { icon: Receipt, label: 'Nova Fatura', path: '/portal/invoices/new' },
    { icon: DollarSign, label: 'Registrar Pagamento', path: '/portal/payments/new' },
    { icon: TrendingUp, label: 'Fluxo de Caixa', path: '/portal/cash-flow' },
    { icon: Wallet, label: 'Contas', path: '/portal/accounts' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <DollarSign className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">Painel Financeiro</h1>
            <p className="opacity-90">Olá, {user?.full_name?.split(' ')[0]}. Visão geral financeira.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-6 w-6" />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Pending Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Faturas Pendentes</CardTitle>
            <CardDescription>Faturas aguardando pagamento</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/invoices')}>
            Ver todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma fatura pendente</p>
          </div>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Faturas Vencidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Nenhuma fatura vencida</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
