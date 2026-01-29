import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
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
} from 'recharts';

// Mock data
const revenueData = [
  { date: '01/01', revenue: 12500, transactions: 45 },
  { date: '08/01', revenue: 18200, transactions: 62 },
  { date: '15/01', revenue: 15800, transactions: 53 },
  { date: '22/01', revenue: 22400, transactions: 78 },
  { date: '29/01', revenue: 28900, transactions: 95 },
];

const statusData = [
  { name: 'Aprovadas', value: 847, color: '#10b981' },
  { name: 'Pendentes', value: 23, color: '#f59e0b' },
  { name: 'Falhas', value: 18, color: '#ef4444' },
  { name: 'Reembolsadas', value: 12, color: '#6b7280' },
];

const paymentMethodData = [
  { method: 'Cartão Crédito', value: 65 },
  { method: 'PIX', value: 28 },
  { method: 'Boleto', value: 5 },
  { method: 'Débito', value: 2 },
];

const recentTransactions = [
  { id: 1, customer: 'Dr. João Silva', amount: 2500, method: 'credit_card', status: 'captured', date: '29/01 14:32' },
  { id: 2, customer: 'Clínica Vida', amount: 8500, method: 'pix', status: 'captured', date: '29/01 13:15' },
  { id: 3, customer: 'Maria Santos', amount: 450, method: 'credit_card', status: 'pending', date: '29/01 12:48' },
  { id: 4, customer: 'Dr. Pedro Costa', amount: 1200, method: 'pix', status: 'failed', date: '29/01 11:22' },
  { id: 5, customer: 'Ana Ferreira', amount: 3200, method: 'credit_card', status: 'captured', date: '29/01 10:55' },
];

const pendingTransfers = [
  { recipient: 'Licenciado SP - Centro', amount: 12450, scheduled: '30/01' },
  { recipient: 'Licenciado RJ - Barra', amount: 8720, scheduled: '30/01' },
  { recipient: 'Licenciado MG - Savassi', amount: 5380, scheduled: '31/01' },
];

export default function NeoPayDashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      captured: { label: 'Aprovada', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      failed: { label: 'Falha', variant: 'destructive' },
      refunded: { label: 'Reembolsada', variant: 'outline' },
    };
    const { label, variant } = config[status] || { label: status, variant: 'outline' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getMethodIcon = (method: string) => {
    if (method === 'pix') return '⚡';
    if (method === 'credit_card') return '💳';
    return '📄';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral do gateway de pagamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Faturamento Mensal</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 97.800,00</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Transações</span>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">900</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              94.1% taxa de aprovação
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Saldo Bloqueado</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.450,00</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              Liberação em 2-14 dias
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Inadimplência</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 4.250,00</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              3 cobranças pendentes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução de Faturamento</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status das Transações</CardTitle>
            <CardDescription>Distribuição do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Transações Recentes</CardTitle>
              <CardDescription>Últimas movimentações</CardDescription>
            </div>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{getMethodIcon(tx.method)}</div>
                    <div>
                      <p className="font-medium text-sm">{tx.customer}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(tx.status)}
                    <span className="font-medium text-sm">{formatCurrency(tx.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Transfers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repasses Pendentes</CardTitle>
            <CardDescription>Próximos pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTransfers.map((transfer, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{transfer.recipient}</p>
                    <p className="text-xs text-muted-foreground">Agendado: {transfer.scheduled}</p>
                  </div>
                  <span className="font-medium text-sm text-emerald-600">
                    {formatCurrency(transfer.amount)}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              Ver histórico de repasses
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métodos de Pagamento</CardTitle>
          <CardDescription>Distribuição percentual do mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethodData.map((item) => (
              <div key={item.method} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.method}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
