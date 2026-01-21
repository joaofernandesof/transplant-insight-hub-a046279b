import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Target,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCrmMetrics } from '@/hooks/useCrmMetrics';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const statusColors: Record<string, string> = {
  new: '#E5E7EB',
  contacted: '#FEF3C7',
  scheduled: '#E9D5FF',
  converted: '#BBF7D0',
  lost: '#FECACA',
};

const statusLabels: Record<string, string> = {
  new: 'Novos',
  contacted: 'Contatados',
  scheduled: 'Agendados',
  converted: 'Convertidos',
  lost: 'Perdidos',
};

interface SalesByMonth {
  month: string;
  sales: number;
  vgv: number;
}

function useSalesByMonth() {
  return useQuery({
    queryKey: ['sales-by-month'],
    queryFn: async (): Promise<SalesByMonth[]> => {
      const { data } = await supabase
        .from('sales')
        .select('month_year, vgv_initial');

      if (!data) return [];

      const monthData: Record<string, { sales: number; vgv: number }> = {};
      data.forEach(sale => {
        const month = sale.month_year;
        if (!monthData[month]) {
          monthData[month] = { sales: 0, vgv: 0 };
        }
        monthData[month].sales += 1;
        monthData[month].vgv += sale.vgv_initial || 0;
      });

      return Object.entries(monthData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);
    },
  });
}

export function CrmMetricsDashboard() {
  const { data: metrics, isLoading } = useCrmMetrics();
  const { data: salesByMonth = [] } = useSalesByMonth();

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{metrics.totalLeads}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.leadGrowth >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-destructive" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    metrics.leadGrowth >= 0 ? "text-green-500" : "text-destructive"
                  )}>
                    {Math.abs(metrics.leadGrowth)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs mês anterior</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.convertedThisMonth} vendas este mês
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.revenueThisMonth)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tarefas Pendentes</p>
                <p className="text-2xl font-bold">{metrics.pendingTasks}</p>
                <div className="flex items-center gap-2 mt-1">
                  {metrics.overdueTasks > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {metrics.overdueTasks} atrasadas
                    </Badge>
                  )}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - VGV + Daily Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VGV por Mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VGV por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesByMonth}>
                <defs>
                  <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'VGV']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vgv" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVgv)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Leads Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads nos Últimos 14 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics.dailyLeads.slice(-14)}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  labelFormatter={(value) => `Data: ${value}`}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                  name="Leads"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Status Distribution + Leads by State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={metrics.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {metrics.byStatus.map((entry, index) => (
                      <Cell key={index} fill={statusColors[entry.status] || '#E5E7EB'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {metrics.byStatus.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: statusColors[entry.status] || '#E5E7EB' }}
                      />
                      <span className="text-sm">{statusLabels[entry.status] || entry.status}</span>
                    </div>
                    <span className="font-medium">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads by State */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.byState.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 10 }} width={30} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Procedures */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Procedimentos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.byProcedure.slice(0, 5).map((item, index) => (
                <div key={item.procedure} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <span className="text-sm truncate max-w-[120px]">{item.procedure}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(item.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{item.count} vendas</p>
                  </div>
                </div>
              ))}
              {metrics.byProcedure.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum procedimento registrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads por Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.bySource.slice(0, 5).map((item) => (
                <div key={item.source} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[150px]">{item.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.count}</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.count / metrics.totalLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {metrics.bySource.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma fonte registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Conversion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversão por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.funnelConversion.map((step) => (
                <div key={`${step.from}-${step.to}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {statusLabels[step.from]} → {statusLabels[step.to]}
                    </span>
                    <span className="font-medium">{step.rate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(step.rate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
