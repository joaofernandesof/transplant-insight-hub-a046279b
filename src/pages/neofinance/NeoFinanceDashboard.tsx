/**
 * NeoFinance Dashboard - Visão Geral Financeira de Todos os Portais
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  GraduationCap,
  Wallet,
  ArrowRight,
  RefreshCw,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

// Mock data consolidada de todos os portais
const consolidatedRevenue = [
  { month: 'Ago', neopay: 125000, neoteam: 45000, ipromed: 32000, academy: 18000, neolicense: 28000 },
  { month: 'Set', neopay: 142000, neoteam: 48000, ipromed: 35000, academy: 21000, neolicense: 32000 },
  { month: 'Out', neopay: 138000, neoteam: 52000, ipromed: 38000, academy: 24000, neolicense: 35000 },
  { month: 'Nov', neopay: 165000, neoteam: 58000, ipromed: 42000, academy: 28000, neolicense: 38000 },
  { month: 'Dez', neopay: 198000, neoteam: 65000, ipromed: 48000, academy: 32000, neolicense: 42000 },
  { month: 'Jan', neopay: 215000, neoteam: 72000, ipromed: 52000, academy: 35000, neolicense: 45000 },
];

const portalBreakdown = [
  { name: 'NeoPay', value: 215000, color: '#10b981', icon: CreditCard },
  { name: 'NeoTeam', value: 72000, color: '#3b82f6', icon: Building2 },
  { name: 'IPROMED', value: 52000, color: '#8b5cf6', icon: FileText },
  { name: 'NeoLicense', value: 45000, color: '#f59e0b', icon: Wallet },
  { name: 'Academy', value: 35000, color: '#ec4899', icon: GraduationCap },
];

const pendingActions = [
  { type: 'chargeback', label: 'Chargebacks pendentes', count: 3, severity: 'high', href: '/neofinance/gateway/transactions' },
  { type: 'refund', label: 'Reembolsos aguardando', count: 5, severity: 'medium', href: '/neofinance/gateway/transactions' },
  { type: 'invoice', label: 'Faturas vencidas', count: 12, severity: 'high', href: '/neofinance/portals/ipromed' },
  { type: 'subscription', label: 'Renovações hoje', count: 8, severity: 'low', href: '/neofinance/gateway/subscriptions' },
];

const recentTransactions = [
  { id: 1, portal: 'NeoPay', description: 'Assinatura Premium - Dr. João', amount: 2500, type: 'income', date: '29/01 14:32' },
  { id: 2, portal: 'NeoTeam', description: 'Procedimento FUE - Clínica Vida', amount: 8500, type: 'income', date: '29/01 13:15' },
  { id: 3, portal: 'IPROMED', description: 'Honorários advocatícios', amount: -3200, type: 'expense', date: '29/01 12:48' },
  { id: 4, portal: 'Academy', description: 'Curso Tricologia Avançada', amount: 1800, type: 'income', date: '29/01 11:22' },
  { id: 5, portal: 'NeoLicense', description: 'Licença mensal - SP Centro', amount: 4500, type: 'income', date: '29/01 10:55' },
];

export default function NeoFinanceDashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalRevenue = portalBreakdown.reduce((sum, p) => sum + p.value, 0);
  const monthGrowth = 12.5;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro Consolidado</h1>
          <p className="text-muted-foreground">Visão geral de todos os portais NeoHub</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receita Total (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+{monthGrowth}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Transações Gateway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.247</div>
            <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.3% processadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(89500)}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <span>32 faturas pendentes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(12450)}</div>
            <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
              <span>2.8% da carteira</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Pendentes */}
      {pendingActions.some(a => a.count > 0) && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {pendingActions.map((action, i) => (
                <Link 
                  key={i}
                  to={action.href}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className={`text-2xl font-bold ${
                      action.severity === 'high' ? 'text-red-600' : 
                      action.severity === 'medium' ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {action.count}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Receita por Portal ao longo do tempo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita por Portal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consolidatedRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="neopay" name="NeoPay" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="neoteam" name="NeoTeam" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ipromed" name="IPROMED" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="neolicense" name="NeoLicense" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="academy" name="Academy" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Portal */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição</CardTitle>
            <CardDescription>Por portal (mês atual)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portalBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {portalBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {portalBreakdown.map((portal) => (
                <div key={portal.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: portal.color }} />
                    <span>{portal.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(portal.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações de todos os portais</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/neofinance/consolidated">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                  }`}>
                    {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{tx.portal}</Badge>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Acesso Rápido aos Portais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {portalBreakdown.map((portal) => (
          <Card key={portal.name} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${portal.color}20` }}
                >
                  <portal.icon className="h-5 w-5" style={{ color: portal.color }} />
                </div>
                <div>
                  <p className="font-medium text-sm">{portal.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(portal.value)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
