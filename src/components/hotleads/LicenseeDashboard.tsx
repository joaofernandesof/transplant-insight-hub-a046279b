import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGamification } from '@/hooks/useGamification';
import { GamificationWidget } from '@/components/hotleads/GamificationWidget';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, CheckCircle2, XCircle, Clock,
  Zap, Award, Users, ArrowUpRight, Minus,
} from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface LicenseeDashboardProps {
  myLeads: HotLead[];
  allLeads: HotLead[];
  userId: string;
}

export function LicenseeDashboard({ myLeads, allLeads, userId }: LicenseeDashboardProps) {
  const stats = useMemo(() => {
    const total = myLeads.length;
    const vendido = myLeads.filter(l => l.lead_outcome === 'vendido').length;
    const emAtendimento = myLeads.filter(l => l.lead_outcome === 'em_atendimento').length;
    const descartado = myLeads.filter(l => l.lead_outcome === 'descartado').length;
    const aguardando = myLeads.filter(l => !l.lead_outcome).length;

    const conversionRate = total > 0 ? (vendido / total) * 100 : 0;

    // Average response time (time between available_at/created_at and claimed_at)
    const responseTimes = myLeads
      .filter(l => l.claimed_at)
      .map(l => {
        const start = new Date(l.available_at || l.created_at).getTime();
        const end = new Date(l.claimed_at!).getTime();
        return Math.max(0, (end - start) / 1000 / 60); // minutes
      })
      .filter(t => t < 10080); // filter outliers > 7 days

    const avgResponseMin = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Network averages (all claimed leads by all users)
    const allClaimed = allLeads.filter(l => !!l.claimed_by);
    const claimerMap: Record<string, HotLead[]> = {};
    allClaimed.forEach(l => {
      if (l.claimed_by) {
        if (!claimerMap[l.claimed_by]) claimerMap[l.claimed_by] = [];
        claimerMap[l.claimed_by].push(l);
      }
    });

    const licenseeCount = Object.keys(claimerMap).length;
    const networkAvgClaimed = licenseeCount > 0 ? allClaimed.length / licenseeCount : 0;
    const networkConversions = allClaimed.filter(l => l.lead_outcome === 'vendido').length;
    const networkConversionRate = allClaimed.length > 0 ? (networkConversions / allClaimed.length) * 100 : 0;

    // Weekly trend (leads acquired this week vs last week)
    const now = Date.now();
    const thisWeek = myLeads.filter(l => l.claimed_at && now - new Date(l.claimed_at).getTime() < 7 * 86400000).length;
    const lastWeek = myLeads.filter(l => {
      if (!l.claimed_at) return false;
      const diff = now - new Date(l.claimed_at).getTime();
      return diff >= 7 * 86400000 && diff < 14 * 86400000;
    }).length;

    // Leads by day (last 14 days)
    const byDay: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const count = myLeads.filter(l => {
        const t = new Date(l.claimed_at || l.created_at).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      byDay.push({ date: key, count });
    }

    return {
      total, vendido, emAtendimento, descartado, aguardando,
      conversionRate, avgResponseMin,
      networkAvgClaimed, networkConversionRate, licenseeCount,
      thisWeek, lastWeek, byDay,
    };
  }, [myLeads, allLeads]);

  const statusPie = useMemo(() => [
    { name: 'Vendido', value: stats.vendido, color: '#22c55e' },
    { name: 'Em Atendimento', value: stats.emAtendimento, color: '#f59e0b' },
    { name: 'Descartado', value: stats.descartado, color: '#ef4444' },
    { name: 'Aguardando', value: stats.aguardando, color: '#94a3b8' },
  ].filter(s => s.value > 0), [stats]);

  const weekTrend = stats.lastWeek > 0
    ? ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100
    : stats.thisWeek > 0 ? 100 : 0;

  const formatResponseTime = (min: number) => {
    if (min < 60) return `${Math.round(min)}min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}h ${m}min`;
  };

  const comparisonVsNetwork = stats.networkAvgClaimed > 0
    ? ((stats.total - stats.networkAvgClaimed) / stats.networkAvgClaimed) * 100
    : 0;

  return (
    <div className="space-y-4 pb-8">

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total acquired */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="pt-4 pb-3">
            <p className="text-white/80 text-[11px] font-medium">Total Adquiridos</p>
            <p className="text-2xl font-bold mt-0.5">{stats.total}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {comparisonVsNetwork > 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-300" />
              ) : comparisonVsNetwork < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-300" />
              ) : (
                <Minus className="h-3 w-3 text-white/50" />
              )}
              <span className="text-[10px] text-white/70">
                {comparisonVsNetwork > 0 ? '+' : ''}{comparisonVsNetwork.toFixed(0)}% vs média ({Math.round(stats.networkAvgClaimed)})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conversion rate */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CardContent className="pt-4 pb-3">
            <p className="text-white/80 text-[11px] font-medium">Taxa de Conversão</p>
            <p className="text-2xl font-bold mt-0.5">{stats.conversionRate.toFixed(1)}%</p>
            <div className="flex items-center gap-1 mt-1.5">
              {stats.conversionRate > stats.networkConversionRate ? (
                <ArrowUpRight className="h-3 w-3 text-green-300" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-300" />
              )}
              <span className="text-[10px] text-white/70">
                Rede: {stats.networkConversionRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Response time */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="pt-4 pb-3">
            <p className="text-white/80 text-[11px] font-medium">Tempo de Resposta</p>
            <p className="text-2xl font-bold mt-0.5">{formatResponseTime(stats.avgResponseMin)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="h-3 w-3 text-white/50" />
              <span className="text-[10px] text-white/70">Média entre disponibilização e aquisição</span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly trend */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          <CardContent className="pt-4 pb-3">
            <p className="text-white/80 text-[11px] font-medium">Esta Semana</p>
            <p className="text-2xl font-bold mt-0.5">{stats.thisWeek}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {weekTrend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-300" />
              ) : weekTrend < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-300" />
              ) : (
                <Minus className="h-3 w-3 text-white/50" />
              )}
              <span className="text-[10px] text-white/70">
                Sem anterior: {stats.lastWeek} ({weekTrend > 0 ? '+' : ''}{weekTrend.toFixed(0)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Funil de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {statusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      fontSize={11}
                    >
                      {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center w-full">Nenhum lead adquirido ainda</p>
              )}
            </div>
            {/* Progress bars */}
            <div className="space-y-3 mt-4">
              {[
                { label: 'Vendido', value: stats.vendido, total: stats.total, color: 'bg-green-500', icon: CheckCircle2 },
                { label: 'Em Atendimento', value: stats.emAtendimento, total: stats.total, color: 'bg-amber-500', icon: Clock },
                { label: 'Descartado', value: stats.descartado, total: stats.total, color: 'bg-red-500', icon: XCircle },
                { label: 'Aguardando', value: stats.aguardando, total: stats.total, color: 'bg-slate-400', icon: Zap },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.value} ({item.total > 0 ? ((item.value / item.total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Atividade — Últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 'dataMax']} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Leads Adquiridos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Network comparison */}
      <Card className="border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-r from-orange-500/5 to-red-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-500" />
            Comparativo com a Rede
            <Badge variant="outline" className="text-[10px]">{stats.licenseeCount} licenciados ativos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Seus Leads</p>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Média: {Math.round(stats.networkAvgClaimed)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Sua Conversão</p>
              <p className="text-xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Rede: {stats.networkConversionRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Posição</p>
              <p className="text-xl font-bold">
                {(() => {
                  // Calculate rank among all claimers
                  const claimerCounts: Record<string, number> = {};
                  allLeads.filter(l => !!l.claimed_by).forEach(l => {
                    claimerCounts[l.claimed_by!] = (claimerCounts[l.claimed_by!] || 0) + 1;
                  });
                  const sorted = Object.entries(claimerCounts).sort((a, b) => b[1] - a[1]);
                  const rank = sorted.findIndex(([id]) => id === userId) + 1;
                  return rank > 0 ? `${rank}º` : '—';
                })()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">de {stats.licenseeCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gamification */}
      <GamificationSection />
    </div>
  );
}

function GamificationSection() {
  const { profile, isLoading } = useGamification();

  if (isLoading || !profile) return null;

  return <GamificationWidget profile={profile} />;
}
