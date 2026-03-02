/**
 * FinancialDashboardPage - Dashboard Financeiro do NeoTeam
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { useFinancialDashboard, type AccountEntry } from '@/neohub/hooks/useFinancialDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Calendar, FileText,
  CreditCard, Wallet, BarChart3,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    pago: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    recebido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelado: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] ?? variants.pendente}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function EntryRow({ entry }: { entry: AccountEntry }) {
  const isPayable = entry.type === 'payable';
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPayable ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
          {isPayable
            ? <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
            : <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        </div>
        <div>
          <p className="text-sm font-medium">{entry.description}</p>
          <p className="text-xs text-muted-foreground">
            {entry.category} • Vence {format(parseISO(entry.due_date), "dd/MM/yyyy")}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isPayable ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {isPayable ? '-' : '+'}{formatCurrency(entry.amount)}
        </p>
        <StatusBadge status={entry.status} />
      </div>
    </div>
  );
}

export default function FinancialDashboardPage() {
  const { summary, monthlyTrend, upcoming, overdue, isLoading } = useFinancialDashboard();

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Receita do Mês',
      value: formatCurrency(summary.totalReceita),
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'Despesa do Mês',
      value: formatCurrency(summary.totalDespesa),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Saldo',
      value: formatCurrency(summary.saldo),
      icon: Wallet,
      color: summary.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      bg: summary.saldo >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Contas Vencidas',
      value: String(summary.contasVencidas),
      icon: AlertTriangle,
      color: summary.contasVencidas > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
      bg: summary.contasVencidas > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted',
    },
  ];

  const secondaryKpis = [
    { label: 'A Receber (Pendente)', value: formatCurrency(summary.aReceberPendente), icon: ArrowDownLeft },
    { label: 'A Pagar (Pendente)', value: formatCurrency(summary.aPagarPendente), icon: ArrowUpRight },
    { label: 'Contratos Ativos', value: String(summary.contratosAtivos), icon: FileText },
    { label: 'VGV Total', value: formatCurrency(summary.vgvTotal), icon: CreditCard },
  ];

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <DollarSign className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
            <p className="opacity-90 text-sm">
              Visão consolidada de receitas, despesas e fluxo de caixa — {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryKpis.map((kpi, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <kpi.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Receita × Despesa (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming / Overdue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="w-full">
                <TabsTrigger value="upcoming" className="flex-1">
                  Próximos
                </TabsTrigger>
                <TabsTrigger value="overdue" className="flex-1">
                  Vencidos
                  {overdue.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                      {overdue.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-3 max-h-[280px] overflow-y-auto">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma conta próxima do vencimento
                  </p>
                ) : (
                  upcoming.map(e => <EntryRow key={e.id} entry={e} />)
                )}
              </TabsContent>

              <TabsContent value="overdue" className="mt-3 max-h-[280px] overflow-y-auto">
                {overdue.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma conta vencida 🎉
                  </p>
                ) : (
                  overdue.map(e => <EntryRow key={e.id} entry={e} />)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
