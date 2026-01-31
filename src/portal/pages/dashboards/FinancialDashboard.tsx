import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, 
  Receipt, ArrowRight, CreditCard, AlertTriangle, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import { useProcedureFinancialSummary, useProcedureCostSummary } from '@/pages/neoteam/procedures/hooks/useProcedureCosts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

export default function FinancialDashboard() {
  const { user } = usePortalAuth();
  const navigate = useNavigate();
  
  // Get procedure costs data
  const { data: procedureSummary } = useProcedureFinancialSummary();
  const { data: procedureCosts } = useProcedureCostSummary();

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

      {/* Procedure Costs Section */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Custos de Procedimentos
            </CardTitle>
            <CardDescription>Consumo de materiais por aplicação</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/neoteam/procedures?tab=costs')}>
            Ver detalhes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Custo Mês</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(procedureSummary?.month_cost || 0)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Custo Hoje</p>
              <p className="text-lg font-bold">
                {formatCurrency(procedureSummary?.today_cost || 0)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Custo Médio</p>
              <p className="text-lg font-bold">
                {formatCurrency(procedureSummary?.avg_cost_per_execution || 0)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Aplicações</p>
              <p className="text-lg font-bold">{procedureSummary?.month_executions || 0}</p>
            </div>
          </div>

          {/* Top 3 Procedures by Cost */}
          {procedureCosts && procedureCosts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Top Procedimentos</p>
              {procedureCosts.slice(0, 3).map((proc, i) => (
                <div key={proc.procedure_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium">{proc.procedure_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(proc.total_cost)}</p>
                    <p className="text-xs text-muted-foreground">{proc.total_executions} aplicações</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
