import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import {
  Flame, MapPin, Building2, TrendingUp, Clock, UserCheck, Target,
  BarChart3, Lightbulb, Zap, AlertTriangle, CheckCircle2, Trophy, Crown, Medal, User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllLeadStats } from '@/hooks/useAllLeadStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#f43f5e'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export function HotLeadsAdminDashboard() {
  const stats = useAllLeadStats();

  // Per-KPI insights
  const kpiInsights = useMemo(() => {
    if (stats.isLoading || stats.total === 0) return { total: null, queued: null, available: null, claimed: null };
    
    const result: Record<string, string | null> = { total: null, queued: null, available: null, claimed: null };

    // Total insight - top state concentration + diversity
    const topState = stats.byState[0];
    if (topState) {
      const pct = ((topState.total / stats.total) * 100).toFixed(0);
      result.total = `${topState.state} concentra ${pct}% (${topState.total.toLocaleString('pt-BR')}). Base em ${stats.byState.length} estados.`;
    }

    // Queue insight
    if (stats.queued > 0) {
      result.queued = `Fila sendo liberada gradualmente para manter qualidade de distribuição.`;
    }

    // Available insight - zero capture states
    const zeroCaptureStates = stats.byState.filter(s => s.claimed === 0 && s.total >= 5);
    if (zeroCaptureStates.length > 0) {
      result.available = `${zeroCaptureStates.length} estado(s) sem captação: ${zeroCaptureStates.slice(0, 3).map(s => s.state).join(', ')}. Oportunidade!`;
    } else if (stats.available > 0) {
      result.available = `${stats.available.toLocaleString('pt-BR')} leads aguardando ação dos licenciados.`;
    }

    // Claimed insight - capture rate
    const captureRate = stats.total > 0 ? (stats.claimed / stats.total) * 100 : 0;
    if (captureRate < 5 && stats.total > 0) {
      result.claimed = `Taxa de captação de ${captureRate.toFixed(1)}%. Engaje os licenciados para aumentar.`;
    } else if (stats.claimed > 0) {
      result.claimed = `${captureRate.toFixed(1)}% dos leads já foram captados pelos licenciados.`;
    }

    return result;
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

  // Region data
  const STATE_TO_REGION: Record<string, string> = {
    AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
    AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
    DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
    ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
    PR: 'Sul', RS: 'Sul', SC: 'Sul',
  };
  const REGION_COLORS: Record<string, string> = {
    'Norte': '#06b6d4', 'Nordeste': '#f97316', 'Centro-Oeste': '#eab308',
    'Sudeste': '#8b5cf6', 'Sul': '#22c55e',
  };
  const regionPie = useMemo(() => {
    const regionMap: Record<string, number> = {};
    stats.byState.forEach(s => {
      const region = STATE_TO_REGION[s.state] || 'Outros';
      regionMap[region] = (regionMap[region] || 0) + s.total;
    });
    return Object.entries(regionMap)
      .map(([name, value]) => ({ name, value, color: REGION_COLORS[name] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
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
      {/* KPI Cards with embedded insights */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total de Leads', value: stats.total, icon: Flame, gradient: 'from-orange-500 to-red-500', insight: kpiInsights.total },
          { label: 'Disponíveis', value: stats.available, icon: Target, gradient: 'from-green-500 to-emerald-500', insight: kpiInsights.available },
          { label: 'Adquiridos', value: stats.claimed, icon: UserCheck, gradient: 'from-blue-500 to-indigo-500', insight: kpiInsights.claimed },
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
              {kpi.insight && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-white/70 shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-white/80">{kpi.insight}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline - Full Width */}
      <Card>
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
              <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} allowDataOverflow={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend fontSize={11} />
              <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} fill="url(#gradTotal)" name="Novos Leads" />
              <Area type="monotone" dataKey="claimed" stroke="#3b82f6" strokeWidth={2} fill="url(#gradClaimed)" name="Capturados" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Region + State Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* State Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statePie}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  fontSize={11}
                >
                  {statePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Region Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-500" />
              Leads por Região
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regionPie}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  fontSize={11}
                >
                  {regionPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {regionPie.map((item, i) => (
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
                  <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground min-w-[200px]">Volume</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Na Fila</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Disponíveis</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">Adquiridos</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {stats.byState.map((s, i) => {
                  const pct = stats.total > 0 ? ((s.total / stats.total) * 100) : 0;
                  const maxTotal = stats.byState[0]?.total || 1;
                  const barWidth = (s.total / maxTotal) * 100;
                  const queuedWidth = s.total > 0 ? (s.queued / s.total) * barWidth : 0;
                  const availableWidth = s.total > 0 ? (s.available / s.total) * barWidth : 0;
                  const claimedWidth = s.total > 0 ? (s.claimed / s.total) * barWidth : 0;
                  return (
                    <tr key={s.state} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {s.state}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted/50">
                          {queuedWidth > 0 && (
                            <div
                              className="h-full bg-amber-400 transition-all duration-500"
                              style={{ width: `${queuedWidth}%` }}
                              title={`Na Fila: ${s.queued.toLocaleString('pt-BR')}`}
                            />
                          )}
                          {availableWidth > 0 && (
                            <div
                              className="h-full bg-green-500 transition-all duration-500"
                              style={{ width: `${availableWidth}%` }}
                              title={`Disponíveis: ${s.available.toLocaleString('pt-BR')}`}
                            />
                          )}
                          {claimedWidth > 0 && (
                            <div
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${claimedWidth}%` }}
                              title={`Adquiridos: ${s.claimed.toLocaleString('pt-BR')}`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2.5 px-3 font-bold">{s.total.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3 text-amber-600 font-medium">{s.queued.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3 text-green-600 font-medium">{s.available.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3 text-blue-600 font-medium">{s.claimed.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3">
                        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/30">
                  <td className="py-2.5 px-3 font-bold">TOTAL</td>
                  <td className="py-2.5 px-3"></td>
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



      {/* Top Licensees Ranking */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background via-background to-amber-50/30 dark:to-amber-950/10 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              Ranking de Licenciados
            </CardTitle>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0 font-semibold text-xs">
              {stats.topLicensees.length} licenciados
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <th className="text-center py-3 px-3 w-12 font-bold text-xs uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Licenciado</th>
                  <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Cidade</th>
                  <th className="text-center py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">UF</th>
                  <th className="text-center py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Leads Captados</th>
                  <th className="text-center py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Tempo Online</th>
                </tr>
              </thead>
              <tbody>
                {stats.topLicensees.map((lic, i) => {
                  const initials = lic.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                  const isTopThree = i < 3;
                  const rankBgs = ['bg-amber-50 dark:bg-amber-950', 'bg-slate-50 dark:bg-slate-900', 'bg-orange-50 dark:bg-orange-950'];

                  // Format online time
                  const totalSec = lic.total_online_seconds;
                  const hours = Math.floor(totalSec / 3600);
                  const minutes = Math.floor((totalSec % 3600) / 60);
                  const onlineLabel = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

                  return (
                    <tr key={lic.user_id} className={`border-b last:border-0 transition-colors ${isTopThree ? rankBgs[i] : 'hover:bg-muted/40'}`}>
                      <td className="text-center py-3 px-3">
                        {isTopThree ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full font-extrabold text-sm">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-9 w-9 ${isTopThree ? 'ring-2 ring-amber-200 dark:ring-amber-800' : ''}`}>
                            <AvatarImage src={lic.avatar_url || ''} />
                            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className={`text-sm truncate ${isTopThree ? 'font-bold' : 'font-medium'}`}>{lic.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{lic.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{lic.city || '—'}</span>
                      </td>
                      <td className="text-center py-3 px-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{lic.state || '—'}</span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full text-sm font-extrabold ${
                          lic.total_claimed > 0 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {lic.total_claimed}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                          totalSec > 0 
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                            : 'text-muted-foreground/40'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {totalSec > 0 ? onlineLabel : 'sem registro'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
