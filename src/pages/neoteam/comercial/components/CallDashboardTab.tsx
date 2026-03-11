import type { SalesCall, CallAnalysisRecord } from '@/hooks/useCallIntelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Phone, CheckCircle2, XCircle, Flame, Target, TrendingUp, BarChart3, Users, Calendar, Activity, Award, Zap, Snowflake, Sun, Clock, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
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

type CloserSortKey = 'name' | 'total' | 'fechou' | 'taxa' | 'followup' | 'taxaFollowup' | 'perdido' | 'taxaPerdido' | 'bantMedio' | 'spinMedio';

export function CallDashboardTab({ stats, analyses, calls }: Props) {
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [closerSortKey, setCloserSortKey] = useState<CloserSortKey>('taxa');
  const [closerSortDir, setCloserSortDir] = useState<'asc' | 'desc'>('desc');

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
      spinSum: number; spinCount: number;
      quente: number; morno: number; frio: number;
    }>();

    enrichedCalls.forEach(c => {
      const name = c.closer_name || 'Desconhecido';
      if (!map.has(name)) {
        map.set(name, { name, total: 0, fechou: 0, followup: 0, perdido: 0, bantSum: 0, bantCount: 0, probSum: 0, probCount: 0, spinSum: 0, spinCount: 0, quente: 0, morno: 0, frio: 0 });
      }
      const s = map.get(name)!;
      s.total++;
      if (c.status_call === 'fechou') s.fechou++;
      else if (c.status_call === 'followup') s.followup++;
      else s.perdido++;

      if (c.analysis) {
        s.bantSum += c.analysis.bant_total || 0;
        s.bantCount++;
        s.probSum += c.analysis.probabilidade_fechamento || 0;
        s.probCount++;
        if (c.analysis.closer_exploracao_spin != null) {
          s.spinSum += c.analysis.closer_exploracao_spin;
          s.spinCount++;
        }
        s[c.analysis.classificacao_lead]++;
      }
    });

    return Array.from(map.values())
      .map(s => ({
        ...s,
        taxa: s.total > 0 ? Math.round((s.fechou / s.total) * 100) : 0,
        taxaFollowup: s.total > 0 ? Math.round((s.followup / s.total) * 100) : 0,
        taxaPerdido: s.total > 0 ? Math.round((s.perdido / s.total) * 100) : 0,
        bantMedio: s.bantCount > 0 ? Math.round(s.bantSum / s.bantCount) : 0,
        probMedia: s.probCount > 0 ? Math.round(s.probSum / s.probCount) : 0,
        spinMedio: s.spinCount > 0 ? Math.round(s.spinSum / s.spinCount) : 0,
      }));
  }, [enrichedCalls]);

  const sortedCloserStats = useMemo(() => {
    const sorted = [...closerStats];
    sorted.sort((a, b) => {
      const aVal = a[closerSortKey] ?? 0;
      const bVal = b[closerSortKey] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return closerSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return closerSortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [closerStats, closerSortKey, closerSortDir]);

  // ── Top objections with solutions ──
  const [objSearch, setObjSearch] = useState('');
  const [objSortKey, setObjSortKey] = useState<'objection' | 'solution' | 'count'>('count');
  const [objSortDir, setObjSortDir] = useState<'asc' | 'desc'>('desc');

  const objectionRows = useMemo(() => {
    const rows: { objection: string; solution: string; count: number }[] = [];
    const map = new Map<string, { solutions: string[]; count: number }>();

    analyses.filter(a => a.objecoes).forEach(a => {
      const items = a.objecoes!.split(';').map(o => o.trim()).filter(Boolean);
      const solution = a.estrategia_followup || a.proximos_passos || '';
      items.forEach(obj => {
        // Extract keyword (first ~60 chars, clean up)
        const keyword = obj.length > 60 ? obj.slice(0, 60).replace(/\s\S*$/, '…') : obj;
        const existing = map.get(keyword);
        if (existing) {
          existing.count++;
          if (solution && !existing.solutions.includes(solution)) existing.solutions.push(solution);
        } else {
          map.set(keyword, { solutions: solution ? [solution] : [], count: 1 });
        }
      });
    });

    map.forEach((v, k) => {
      rows.push({ objection: k, solution: v.solutions[0] || '—', count: v.count });
    });
    return rows;
  }, [analyses]);

  const filteredObjRows = useMemo(() => {
    const q = objSearch.toLowerCase();
    return objectionRows
      .filter(r => !q || r.objection.toLowerCase().includes(q) || r.solution.toLowerCase().includes(q))
      .sort((a, b) => {
        let cmp = 0;
        if (objSortKey === 'count') cmp = a.count - b.count;
        else cmp = (a[objSortKey] || '').localeCompare(b[objSortKey] || '');
        return objSortDir === 'asc' ? cmp : -cmp;
      });
  }, [objectionRows, objSearch, objSortKey, objSortDir]);

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

      {/* ── Row 5: Per-closer analysis with ranking table + pie charts ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Análise por Vendedor</CardTitle>
          <CardDescription>Ranking comparativo com distribuição de status individual</CardDescription>
        </CardHeader>
        <CardContent>
           {closerStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem dados suficientes</p>
          ) : (
            <div className="space-y-6">
              {/* Ranking Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-3 font-semibold text-muted-foreground text-xs">#</th>
                      <SortableTh label="Closer" sortKey="name" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} align="left" />
                      <SortableTh label="Calls" sortKey="total" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="Fechou" sortKey="fechou" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="% Conv." sortKey="taxa" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="Follow-up" sortKey="followup" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="% F-up" sortKey="taxaFollowup" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="Perdido" sortKey="perdido" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="% Perd." sortKey="taxaPerdido" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="BANT" sortKey="bantMedio" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                      <SortableTh label="SPIN" sortKey="spinMedio" current={closerSortKey} dir={closerSortDir} onSort={(k) => { if (closerSortKey === k) setCloserSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCloserSortKey(k); setCloserSortDir('desc'); }}} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCloserStats.map((c, i) => {
                      const medalColors = [
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40',
                        'bg-slate-100 text-slate-600 dark:bg-slate-800',
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/40',
                      ];
                      return (
                        <tr key={c.name} className={`border-b last:border-0 ${i === 0 ? 'bg-amber-50/50 dark:bg-amber-950/10' : 'hover:bg-muted/30'}`}>
                          <td className="py-2.5 pr-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? medalColors[i] : 'bg-muted text-muted-foreground'}`}>
                              {i === 0 ? <Award className="h-3.5 w-3.5" /> : i + 1}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 font-semibold">{c.name}</td>
                          <td className="py-2.5 pr-3 text-center font-medium">{c.total}</td>
                          <td className="py-2.5 pr-3 text-center font-bold text-emerald-600">{c.fechou}</td>
                          <td className="py-2.5 pr-3 text-center">
                            <span className={`font-bold ${c.taxa >= 20 ? 'text-emerald-600' : c.taxa >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{c.taxa}%</span>
                          </td>
                          <td className="py-2.5 pr-3 text-center font-bold text-amber-600">{c.followup}</td>
                          <td className="py-2.5 pr-3 text-center font-medium text-amber-600">{c.taxaFollowup}%</td>
                          <td className="py-2.5 pr-3 text-center font-bold text-red-600">{c.perdido}</td>
                          <td className="py-2.5 pr-3 text-center font-medium text-red-600">{c.taxaPerdido}%</td>
                          <td className="py-2.5 pr-3 text-center font-medium">{c.bantMedio}<span className="text-muted-foreground text-xs">/40</span></td>
                          <td className="py-2.5 text-center font-medium text-violet-600">{c.spinMedio > 0 ? `${c.spinMedio}/10` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Individual Pie Charts */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {sortedCloserStats.map((c, i) => {
                  const pieData = [
                    { name: 'Fechou', value: c.fechou, color: '#10b981' },
                    { name: 'Follow-up', value: c.followup, color: '#f59e0b' },
                    { name: 'Perdido', value: c.perdido, color: '#ef4444' },
                  ].filter(d => d.value > 0);
                  return (
                    <Card key={i} className={`border ${i === 0 ? 'border-amber-200 dark:border-amber-800/40' : 'border-muted'}`}>
                      <CardContent className="p-3 space-y-1">
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'
                            }`}>{i + 1}</span>
                            <span className="font-semibold text-xs truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{c.total} calls</span>
                        </div>
                        <div className="h-[120px]">
                          {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                  {pieData.map((d, j) => <Cell key={j} fill={d.color} />)}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string) => [`${value} calls`, name]} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <EmptyChart />}
                        </div>
                        <div className="flex justify-center gap-2 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {c.fechou}</span>
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {c.followup}</span>
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-red-500" /> {c.perdido}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar objeção ou solução..."
                value={objSearch}
                onChange={e => setObjSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background z-10">
                      <ObjSortableTh label="Objeção" sortKey="objection" current={objSortKey} dir={objSortDir} onSort={(k) => { if (objSortKey === k) setObjSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setObjSortKey(k); setObjSortDir('desc'); } }} />
                    </TableHead>
                    <TableHead className="sticky top-0 bg-background z-10">
                      <ObjSortableTh label="Solução Sugerida" sortKey="solution" current={objSortKey} dir={objSortDir} onSort={(k) => { if (objSortKey === k) setObjSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setObjSortKey(k); setObjSortDir('desc'); } }} />
                    </TableHead>
                    <TableHead className="sticky top-0 bg-background z-10 w-[60px] text-center">
                      <ObjSortableTh label="#" sortKey="count" current={objSortKey} dir={objSortDir} onSort={(k) => { if (objSortKey === k) setObjSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setObjSortKey(k); setObjSortDir('desc'); } }} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObjRows.length > 0 ? filteredObjRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium max-w-[200px]">{row.objection}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px]">{row.solution}</TableCell>
                      <TableCell className="text-xs text-center font-semibold">{row.count}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-xs">Nenhuma objeção encontrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}

function SortableTh({ label, sortKey, current, dir, onSort, align = 'center' }: {
  label: string; sortKey: CloserSortKey; current: CloserSortKey; dir: 'asc' | 'desc';
  onSort: (key: CloserSortKey) => void; align?: 'left' | 'center';
}) {
  const isActive = current === sortKey;
  return (
    <th
      className={`pb-2 pr-3 font-semibold text-xs cursor-pointer select-none transition-colors hover:text-foreground ${
        isActive ? 'text-foreground' : 'text-muted-foreground'
      } ${align === 'center' ? 'text-center' : 'text-left'}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {isActive ? (
          dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

type ObjSortKey = 'objection' | 'solution' | 'count';
function ObjSortableTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: ObjSortKey; current: ObjSortKey; dir: 'asc' | 'desc';
  onSort: (key: ObjSortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <button
      className={`inline-flex items-center gap-0.5 font-semibold text-xs cursor-pointer select-none transition-colors hover:text-foreground ${
        isActive ? 'text-foreground' : 'text-muted-foreground'
      }`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {isActive ? (
        dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
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

type RankingMetric = 'vendas' | 'media_analise' | 'qtd_calls' | 'taxa_conversao';
type RankingPeriodo = 'tudo' | '7d' | '14d' | '30d' | '3m' | '6m';

const PERIODO_LABELS: Record<RankingPeriodo, string> = {
  tudo: 'Todo período',
  '7d': 'Últimos 7 dias',
  '14d': 'Últimas 2 semanas',
  '30d': 'Último mês',
  '3m': 'Últimos 3 meses',
  '6m': 'Últimos 6 meses',
};

function CloserRankingCard({ calls, analyses, enrichedCalls }: { calls: SalesCall[]; analyses: CallAnalysisRecord[]; enrichedCalls: (SalesCall & { analysis: CallAnalysisRecord | null })[] }) {
  const [metric, setMetric] = useState<RankingMetric>('vendas');
  const [rankPeriodo, setRankPeriodo] = useState<RankingPeriodo>('tudo');

  const filteredCalls = useMemo(() => {
    if (rankPeriodo === 'tudo') return enrichedCalls;
    const now = new Date();
    const cutoff = rankPeriodo === '7d' ? subDays(now, 7)
      : rankPeriodo === '14d' ? subWeeks(now, 2)
      : rankPeriodo === '30d' ? subMonths(now, 1)
      : rankPeriodo === '3m' ? subMonths(now, 3)
      : subMonths(now, 6);
    return enrichedCalls.filter(c => isAfter(parseISO(c.data_call), cutoff));
  }, [enrichedCalls, rankPeriodo]);

  const ranked = useMemo(() => {
    const map = new Map<string, {
      name: string; total: number; fechou: number;
      bantSum: number; bantCount: number; probSum: number; probCount: number;
    }>();

    filteredCalls.forEach(c => {
      const name = c.closer_name || 'Desconhecido';
      if (!map.has(name)) {
        map.set(name, { name, total: 0, fechou: 0, bantSum: 0, bantCount: 0, probSum: 0, probCount: 0 });
      }
      const s = map.get(name)!;
      s.total++;
      if (c.status_call === 'fechou') s.fechou++;
      if (c.analysis) {
        s.bantSum += c.analysis.bant_total || 0;
        s.bantCount++;
        s.probSum += c.analysis.probabilidade_fechamento || 0;
        s.probCount++;
      }
    });

    return Array.from(map.values())
      .map(s => ({
        ...s,
        taxa: s.total > 0 ? Math.round((s.fechou / s.total) * 100) : 0,
        bantMedio: s.bantCount > 0 ? Math.round(s.bantSum / s.bantCount) : 0,
        probMedia: s.probCount > 0 ? Math.round(s.probSum / s.probCount) : 0,
      }))
      .sort((a, b) => {
        if (metric === 'vendas') return b.fechou - a.fechou || b.taxa - a.taxa;
        if (metric === 'media_analise') return b.bantMedio - a.bantMedio;
        if (metric === 'qtd_calls') return b.total - a.total;
        return b.taxa - a.taxa || b.fechou - a.fechou;
      });
  }, [filteredCalls, metric]);

  const getMainValue = (c: typeof ranked[0]) => {
    if (metric === 'vendas') return { value: c.fechou, label: `${c.fechou} vendas`, sub: `${c.taxa}% conversão` };
    if (metric === 'media_analise') return { value: c.bantMedio, label: `${c.bantMedio}/40`, sub: `BANT médio` };
    if (metric === 'qtd_calls') return { value: c.total, label: `${c.total} calls`, sub: `${c.fechou} vendas` };
    return { value: c.taxa, label: `${c.taxa}%`, sub: `${c.fechou}/${c.total} calls` };
  };

  const metricTabs: { key: RankingMetric; label: string; icon: React.ReactNode }[] = [
    { key: 'vendas', label: 'Vendas', icon: <CheckCircle2 className="h-3 w-3" /> },
    { key: 'taxa_conversao', label: 'Conversão', icon: <TrendingUp className="h-3 w-3" /> },
    { key: 'qtd_calls', label: 'Calls', icon: <Phone className="h-3 w-3" /> },
    { key: 'media_analise', label: 'BANT', icon: <Target className="h-3 w-3" /> },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-amber-600" /> Ranking de Closers</CardTitle>
          <Select value={rankPeriodo} onValueChange={(v) => setRankPeriodo(v as RankingPeriodo)}>
            <SelectTrigger className="w-[160px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODO_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1 mt-1">
          {metricTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setMetric(t.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                metric === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {ranked.length === 0 ? <EmptyChart /> : (
          <div className="space-y-2">
            {ranked.map((c, i) => {
              const mv = getMainValue(c);
              const medalColors = [
                'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
              ];
              return (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                  i === 0 ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40' : 'border-transparent hover:bg-muted/40'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < 3 ? medalColors[i] : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.total} calls • {c.taxa}% conversão • BANT {c.bantMedio}/40</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-bold text-sm ${
                      metric === 'vendas' ? 'text-emerald-600' :
                      metric === 'taxa_conversao' ? 'text-blue-600' :
                      metric === 'qtd_calls' ? 'text-violet-600' : 'text-amber-600'
                    }`}>{mv.label}</span>
                    <div className="text-[10px] text-muted-foreground">{mv.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
