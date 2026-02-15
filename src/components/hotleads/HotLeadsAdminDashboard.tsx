import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import {
  Flame, MapPin, Building2, TrendingUp, Clock, UserCheck, Target,
  BarChart3, Lightbulb, Zap, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useAllLeadStats } from '@/hooks/useAllLeadStats';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#f43f5e'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export function HotLeadsAdminDashboard() {
  const stats = useAllLeadStats();

  // AI Insights
  const insights = useMemo(() => {
    if (stats.isLoading || stats.total === 0) return [];
    const items: { icon: typeof Lightbulb; color: string; bg: string; text: string }[] = [];

    // Top state concentration
    const topState = stats.byState[0];
    if (topState) {
      const pct = ((topState.total / stats.total) * 100).toFixed(0);
      items.push({
        icon: MapPin,
        color: 'text-orange-600',
        bg: 'bg-orange-50 dark:bg-orange-950',
        text: `${topState.state} concentra ${pct}% dos leads (${topState.total.toLocaleString('pt-BR')}). Considere estratégias regionais.`,
      });
    }

    // Low capture rate
    const captureRate = stats.total > 0 ? (stats.claimed / stats.total) * 100 : 0;
    if (captureRate < 5) {
      items.push({
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950',
        text: `Taxa de captação de apenas ${captureRate.toFixed(1)}%. ${stats.available.toLocaleString('pt-BR')} leads disponíveis aguardando ação.`,
      });
    }

    // Queue size
    if (stats.queued > 1000) {
      items.push({
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: `${stats.queued.toLocaleString('pt-BR')} leads na fila de espera. A fila está sendo liberada gradualmente para manter qualidade.`,
      });
    }

    // States with zero captures
    const zeroCaptureStates = stats.byState.filter(s => s.claimed === 0 && s.total >= 5);
    if (zeroCaptureStates.length > 0) {
      items.push({
        icon: Zap,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950',
        text: `${zeroCaptureStates.length} estado(s) com leads mas sem nenhuma captação: ${zeroCaptureStates.slice(0, 3).map(s => s.state).join(', ')}. Oportunidade!`,
      });
    }

    // Diversity
    if (stats.byState.length >= 10) {
      items.push({
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-950',
        text: `Base diversificada: leads distribuídos em ${stats.byState.length} estados e ${stats.byCity.length}+ cidades.`,
      });
    }

    return items;
  }, [stats]);

  // Status pie
  const statusPie = useMemo(() => [
    { name: 'Na Fila', value: stats.queued, color: '#eab308' },
    { name: 'Disponíveis', value: stats.available, color: '#22c55e' },
    { name: 'Adquiridos', value: stats.claimed, color: '#3b82f6' },
  ], [stats]);

  // State pie (top 5 + others)
  const statePie = useMemo(() => {
    const top5 = stats.byState.slice(0, 5);
    const othersTotal = stats.byState.slice(5).reduce((s, v) => s + v.total, 0);
    const result = top5.map((s, i) => ({ name: s.state, value: s.total, color: COLORS[i] }));
    if (othersTotal > 0) result.push({ name: 'Outros', value: othersTotal, color: '#94a3b8' });
    return result;
  }, [stats.byState]);

  if (stats.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total de Leads', value: stats.total, icon: Flame, gradient: 'from-orange-500 to-red-500' },
          { label: 'Na Fila', value: stats.queued, icon: Clock, gradient: 'from-yellow-500 to-amber-500' },
          { label: 'Disponíveis', value: stats.available, icon: Target, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Adquiridos', value: stats.claimed, icon: UserCheck, gradient: 'from-blue-500 to-indigo-500' },
        ].map(kpi => (
          <Card key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium">{kpi.label}</p>
                  <p className="text-3xl font-bold mt-1">{kpi.value.toLocaleString('pt-BR')}</p>
                </div>
                <kpi.icon className="h-10 w-10 text-white/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Insights Inteligentes
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">IA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {insights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${insight.bg}`}>
                  <insight.icon className={`h-4 w-4 ${insight.color} shrink-0 mt-0.5`} />
                  <p className="text-xs leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline + Status Pie */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Linha do Tempo — Leads por Dia
              <Badge variant="outline" className="font-normal text-[10px]">30 dias</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.byDay}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClaimed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend fontSize={11} />
                <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} fill="url(#gradTotal)" name="Novos Leads" />
                <Area type="monotone" dataKey="claimed" stroke="#3b82f6" strokeWidth={2} fill="url(#gradClaimed)" name="Capturados" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {statusPie.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-semibold">{item.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* State Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* State Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              Leads por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, stats.byState.length * 30)}>
              <BarChart data={stats.byState} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="state" type="category" width={45} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend fontSize={11} />
                <Bar dataKey="queued" stackId="a" fill="#eab308" name="Na Fila" />
                <Bar dataKey="available" stackId="a" fill="#22c55e" name="Disponíveis" />
                <Bar dataKey="claimed" stackId="a" fill="#3b82f6" name="Adquiridos" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State Pie + Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statePie}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {statePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full State Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500" />
            Todos os Estados — Detalhamento Completo
            <Badge variant="outline" className="font-normal text-[10px]">{stats.byState.length} estados</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Na Fila</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Disponíveis</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Adquiridos</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.byState.map((s, i) => {
                  const pct = stats.total > 0 ? ((s.total / stats.total) * 100).toFixed(1) : '0';
                  return (
                    <tr key={s.state} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-semibold flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {s.state}
                      </td>
                      <td className="text-right py-2 px-3 font-bold">{s.total.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2 px-3 text-amber-600 font-medium">{s.queued.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2 px-3 text-green-600 font-medium">{s.available.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2 px-3 text-blue-600 font-medium">{s.claimed.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/30">
                  <td className="py-2.5 px-3 font-bold">TOTAL</td>
                  <td className="text-right py-2.5 px-3 font-bold">{stats.total.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-2.5 px-3 font-bold text-amber-600">{stats.queued.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-2.5 px-3 font-bold text-green-600">{stats.available.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-2.5 px-3 font-bold text-blue-600">{stats.claimed.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-2.5 px-3 font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Cities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            Top 20 Cidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(400, stats.byCity.length * 28)}>
            <BarChart data={stats.byCity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="city"
                type="category"
                width={130}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend fontSize={11} />
              <Bar dataKey="available" stackId="a" fill="#22c55e" name="Disponíveis" />
              <Bar dataKey="claimed" stackId="a" fill="#3b82f6" name="Adquiridos" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
