import type { SalesCall, CallAnalysisRecord } from '@/hooks/useCallIntelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, CheckCircle2, XCircle, Flame, Target, TrendingUp, BarChart3, Users, Calendar, Activity, Award, Zap, Snowflake, Sun, Clock } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useState } from 'react';
import { format, parseISO, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, subDays, subWeeks, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  stats: {
    totalCalls: number;
    fechou: number;
    followup: number;
    perdido: number;
    taxaFechamento: number;
    analyzed: number;
    leadsQuentes: number;
    bantMedio: number;
    probMediaFechamento: number;
  };
  analyses: CallAnalysisRecord[];
  calls: SalesCall[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
const STATUS_COLORS = { fechou: '#10b981', followup: '#f59e0b', perdido: '#ef4444' };

export function CallDashboardTab({ stats, analyses, calls }: Props) {
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('semana');

  // ── Derived data ──
  const enrichedCalls = useMemo(() => {
    return calls.map(c => ({
      ...c,
      analysis: analyses.find(a => a.call_id === c.id) || null,
    }));
  }, [calls, analyses]);

  // ── BANT averages per dimension ──
  const bantAverages = useMemo(() => {
    const withAnalysis = enrichedCalls.filter(c => c.analysis);
    if (withAnalysis.length === 0) return { budget: 0, authority: 0, need: 0, timeline: 0 };
    const sum = (key: 'bant_budget' | 'bant_authority' | 'bant_need' | 'bant_timeline') =>
      Math.round(withAnalysis.reduce((s, c) => s + (c.analysis?.[key] || 0), 0) / withAnalysis.length * 10) / 10;
    return { budget: sum('bant_budget'), authority: sum('bant_authority'), need: sum('bant_need'), timeline: sum('bant_timeline') };
  }, [enrichedCalls]);

  const bantRadarData = [
    { subject: 'Budget', value: bantAverages.budget, fullMark: 10 },
    { subject: 'Authority', value: bantAverages.authority, fullMark: 10 },
    { subject: 'Need', value: bantAverages.need, fullMark: 10 },
    { subject: 'Timeline', value: bantAverages.timeline, fullMark: 10 },
  ];

  // ── Status distribution (pie) ──
  const statusData = [
    { name: 'Fechou', value: stats.fechou, color: STATUS_COLORS.fechou },
    { name: 'Follow-up', value: stats.followup, color: STATUS_COLORS.followup },
    { name: 'Perdido', value: stats.perdido, color: STATUS_COLORS.perdido },
  ].filter(d => d.value > 0);

  // ── Classification distribution ──
  const classifData = useMemo(() => {
    const counts = { quente: 0, morno: 0, frio: 0 };
    analyses.forEach(a => { counts[a.classificacao_lead] = (counts[a.classificacao_lead] || 0) + 1; });
    return [
      { name: 'Quente', value: counts.quente, color: '#ef4444' },
      { name: 'Morno', value: counts.morno, color: '#f59e0b' },
      { name: 'Frio', value: counts.frio, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, [analyses]);

  // ── Timeline data ──
  const timelineData = useMemo(() => {
    if (calls.length === 0) return [];
    const sorted = [...calls].sort((a, b) => a.data_call.localeCompare(b.data_call));
    const groupMap = new Map<string, { total: number; fechou: number; followup: number; perdido: number; bantSum: number; bantCount: number }>();

    sorted.forEach(c => {
      const d = parseISO(c.data_call);
      let key: string;
      if (periodo === 'dia') key = format(d, 'dd/MM', { locale: ptBR });
      else if (periodo === 'semana') key = 'Sem ' + format(startOfWeek(d, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR });
      else key = format(d, 'MMM/yy', { locale: ptBR });

      if (!groupMap.has(key)) groupMap.set(key, { total: 0, fechou: 0, followup: 0, perdido: 0, bantSum: 0, bantCount: 0 });
      const g = groupMap.get(key)!;
      g.total++;
      if (c.status_call === 'fechou') g.fechou++;
      else if (c.status_call === 'followup') g.followup++;
      else g.perdido++;

      const analysis = analyses.find(a => a.call_id === c.id);
      if (analysis) { g.bantSum += analysis.bant_total || 0; g.bantCount++; }
    });

    return Array.from(groupMap.entries()).map(([name, g]) => ({
      name,
      total: g.total,
      fechou: g.fechou,
      followup: g.followup,
      perdido: g.perdido,
      taxa: g.total > 0 ? Math.round((g.fechou / g.total) * 100) : 0,
      bantMedio: g.bantCount > 0 ? Math.round(g.bantSum / g.bantCount) : 0,
    }));
  }, [calls, analyses, periodo]);

  // ── Per-closer stats ──
  const closerStats = useMemo(() => {
    const map = new Map<string, {
      name: string; total: number; fechou: number; followup: number; perdido: number;
      bantSum: number; bantCount: number; probSum: number; probCount: number;
      quente: number; morno: number; frio: number;
    }>();

    enrichedCalls.forEach(c => {
      const name = c.closer_name || 'Desconhecido';
      if (!map.has(c.closer_id)) {
        map.set(c.closer_id, { name, total: 0, fechou: 0, followup: 0, perdido: 0, bantSum: 0, bantCount: 0, probSum: 0, probCount: 0, quente: 0, morno: 0, frio: 0 });
      }
      const s = map.get(c.closer_id)!;
      s.total++;
      if (c.status_call === 'fechou') s.fechou++;
      else if (c.status_call === 'followup') s.followup++;
      else s.perdido++;

      if (c.analysis) {
        s.bantSum += c.analysis.bant_total || 0;
        s.bantCount++;
        s.probSum += c.analysis.probabilidade_fechamento || 0;
        s.probCount++;
        s[c.analysis.classificacao_lead]++;
      }
    });

    return Array.from(map.values())
      .map(s => ({
        ...s,
        taxa: s.total > 0 ? Math.round((s.fechou / s.total) * 100) : 0,
        bantMedio: s.bantCount > 0 ? Math.round(s.bantSum / s.bantCount) : 0,
        probMedia: s.probCount > 0 ? Math.round(s.probSum / s.probCount) : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa || b.bantMedio - a.bantMedio);
  }, [enrichedCalls]);

  // ── Top objections ──
  const topObjecoes = useMemo(() => {
    const objecoes = analyses
      .filter(a => a.objecoes)
      .flatMap(a => a.objecoes!.split(';').map(o => o.trim()).filter(Boolean));
    const count: Record<string, number> = {};
    objecoes.forEach(o => { count[o] = (count[o] || 0) + 1; });
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [analyses]);

  const objecoesChartData = topObjecoes.map(([name, count]) => ({ name: name.length > 35 ? name.slice(0, 35) + '…' : name, count }));

  // ── Efficiency score ──
  const efficiency = useMemo(() => {
    if (analyses.length === 0) return 0;
    const weights = { taxa: 0.35, bant: 0.25, prob: 0.25, quentes: 0.15 };
    const taxaScore = Math.min(stats.taxaFechamento, 100);
    const bantScore = (stats.bantMedio / 40) * 100;
    const probScore = stats.probMediaFechamento;
    const quenteScore = stats.totalCalls > 0 ? (stats.leadsQuentes / stats.totalCalls) * 100 : 0;
    return Math.round(taxaScore * weights.taxa + bantScore * weights.bant + probScore * weights.prob + quenteScore * weights.quentes);
  }, [stats, analyses]);

  return (
    <div className="space-y-5">
      {/* ── Row 1: KPI Cards ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={<Phone className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" value={stats.totalCalls} label="Calls Registradas" />
        <KpiCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-100 dark:bg-emerald-900/30" value={`${stats.taxaFechamento}%`} label="Taxa de Fechamento" valueColor="text-emerald-600" />
        <KpiCard icon={<Flame className="h-5 w-5 text-red-500" />} iconBg="bg-red-100 dark:bg-red-900/30" value={stats.leadsQuentes} label="Leads Quentes" />
        <KpiCard icon={<Target className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-100 dark:bg-amber-900/30" value={<>{stats.bantMedio}<span className="text-sm text-muted-foreground">/40</span></>} label="BANT Médio" />
        <KpiCard icon={<Zap className="h-5 w-5 text-violet-600" />} iconBg="bg-violet-100 dark:bg-violet-900/30" value={`${efficiency}%`} label="Eficiência Geral" valueColor="text-violet-600" />
      </div>

      {/* ── Row 2: Status pills ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
            <div><span className="text-xl font-bold text-emerald-600">{stats.fechou}</span><div className="text-xs text-muted-foreground">Fechou</div></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40"><Clock className="h-4 w-4 text-amber-600" /></div>
            <div><span className="text-xl font-bold text-amber-600">{stats.followup}</span><div className="text-xs text-muted-foreground">Follow-up</div></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40"><XCircle className="h-4 w-4 text-red-600" /></div>
            <div><span className="text-xl font-bold text-red-600">{stats.perdido}</span><div className="text-xs text-muted-foreground">Perdido</div></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40"><TrendingUp className="h-4 w-4 text-violet-600" /></div>
            <div><span className="text-xl font-bold">{stats.probMediaFechamento}%</span><div className="text-xs text-muted-foreground">Prob. Média Fechamento</div></div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Charts row ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* BANT Radar */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-amber-600" /> BANT Médio por Dimensão</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={bantRadarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-600" /> Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        {/* Classification Pie */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-red-500" /> Classificação de Leads</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {classifData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={classifData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {classifData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Timeline charts ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Evolução Temporal</CardTitle>
            <div className="flex gap-1">
              {(['dia', 'semana', 'mes'] as const).map(p => (
                <button key={p} onClick={() => setPeriodo(p)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${periodo === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {p === 'dia' ? 'Dia' : p === 'semana' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Volume */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Volume de Calls</p>
              <div className="h-[220px]">
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="fechou" name="Fechou" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="followup" name="Follow-up" fill="#f59e0b" stackId="a" />
                      <Bar dataKey="perdido" name="Perdido" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>

            {/* Conversion + BANT */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Taxa de Conversão & BANT Médio</p>
              <div className="h-[220px]">
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 40]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Line yAxisId="left" type="monotone" dataKey="taxa" name="Conversão %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="bantMedio" name="BANT Médio" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Row 5: Per-closer analysis ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Análise por Vendedor</CardTitle>
          <CardDescription>Performance individual detalhada de cada closer</CardDescription>
        </CardHeader>
        <CardContent>
          {closerStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem dados suficientes</p>
          ) : (
            <div className="space-y-4">
              {/* Comparative Bar Chart */}
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={closerStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="fechou" name="Fechou" fill="#10b981" stackId="a" />
                    <Bar dataKey="followup" name="Follow-up" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="perdido" name="Perdido" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detail cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {closerStats.map((c, i) => (
                  <Card key={i} className="border-muted">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                            {i === 0 ? <Award className="h-3.5 w-3.5" /> : i + 1}
                          </div>
                          <span className="font-semibold text-sm">{c.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{c.total} calls</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-emerald-600">{c.taxa}%</div>
                          <div className="text-[10px] text-muted-foreground">Conversão</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-amber-600">{c.bantMedio}<span className="text-xs">/40</span></div>
                          <div className="text-[10px] text-muted-foreground">BANT</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-violet-600">{c.probMedia}%</div>
                          <div className="text-[10px] text-muted-foreground">Prob. Fech.</div>
                        </div>
                      </div>
                      <div className="flex gap-1 text-[10px]">
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Flame className="h-2.5 w-2.5" /> {c.quente}</span>
                        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Sun className="h-2.5 w-2.5" /> {c.morno}</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Snowflake className="h-2.5 w-2.5" /> {c.frio}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Row 6: Objections chart + Ranking ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Top Objeções</CardTitle>
          </CardHeader>
          <CardContent>
            {objecoesChartData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={objecoesChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Ocorrências" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <CloserRankingCard calls={calls} analyses={analyses} enrichedCalls={enrichedCalls} />
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, value, label, valueColor }: { icon: React.ReactNode; iconBg: string; value: React.ReactNode; label: string; valueColor?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
          <div>
            <div className={`text-2xl font-bold ${valueColor || ''}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados suficientes</div>;
}
