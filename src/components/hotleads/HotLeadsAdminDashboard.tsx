import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import {
  Flame, MapPin, Building2, TrendingUp, Clock, UserCheck, Target,
  BarChart3, Lightbulb, Zap, AlertTriangle, CheckCircle2, Trophy, Crown, Medal, User,
  XCircle, ShoppingCart, Stethoscope, Eye, ArrowLeft,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllLeadStats } from '@/hooks/useAllLeadStats';
import { supabase } from '@/integrations/supabase/client';
import { BrazilMapChart } from '@/components/hotleads/BrazilMapChart';
import { LicenseeDashboard } from '@/components/hotleads/LicenseeDashboard';
import type { HotLead } from '@/hooks/useHotLeads';
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

  // Licensee view mode
  const [viewMode, setViewMode] = useState<'admin' | 'licensee'>('admin');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [licenseeLeads, setLicenseeLeads] = useState<HotLead[]>([]);
  const [allLeadsForLicensee, setAllLeadsForLicensee] = useState<HotLead[]>([]);
  const [licenseeLeadsLoading, setLicenseeLeadsLoading] = useState(false);

  // Fetch leads for selected licensee
  useEffect(() => {
    if (viewMode !== 'licensee' || !selectedUserId) return;
    async function fetchLeads() {
      setLicenseeLeadsLoading(true);
      const [myRes, allRes] = await Promise.all([
        supabase.from('leads').select('*').eq('claimed_by', selectedUserId).in('source', ['planilha', 'n8n']),
        supabase.from('leads').select('*').in('source', ['planilha', 'n8n']).not('claimed_by', 'is', null),
      ]);
      setLicenseeLeads((myRes.data || []) as HotLead[]);
      setAllLeadsForLicensee((allRes.data || []) as HotLead[]);
      setLicenseeLeadsLoading(false);
    }
    fetchLeads();
  }, [viewMode, selectedUserId]);

  // Fetch lead outcome stats with lead details
  const [outcomeStats, setOutcomeStats] = useState({ vendido: 0, em_atendimento: 0, descartado: 0, sem_desfecho: 0 });
  const [outcomeLeads, setOutcomeLeads] = useState<any[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [outcomeUserFilter, setOutcomeUserFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchOutcomes() {
      const { data } = await supabase
        .from('leads')
        .select('id, name, phone, email, city, state, lead_outcome, claimed_by, claimed_at, source, created_at')
        .not('claimed_by', 'is', null)
        .in('source', ['planilha', 'n8n']);
      if (!data) return;
      setOutcomeLeads(data);
      const vendido = data.filter((l: any) => l.lead_outcome === 'vendido').length;
      const em_atendimento = data.filter((l: any) => l.lead_outcome === 'em_atendimento').length;
      const descartado = data.filter((l: any) => l.lead_outcome === 'descartado').length;
      const sem_desfecho = data.filter((l: any) => !l.lead_outcome).length;
      setOutcomeStats({ vendido, em_atendimento, descartado, sem_desfecho });
    }
    fetchOutcomes();
  }, []);

  // Filtered outcome leads
  const filteredOutcomeLeads = useMemo(() => {
    let filtered = outcomeLeads;
    if (selectedOutcome === 'sem_desfecho') {
      filtered = filtered.filter(l => !l.lead_outcome);
    } else if (selectedOutcome) {
      filtered = filtered.filter(l => l.lead_outcome === selectedOutcome);
    }
    if (outcomeUserFilter !== 'all') {
      filtered = filtered.filter(l => l.claimed_by === outcomeUserFilter);
    }
    return filtered;
  }, [outcomeLeads, selectedOutcome, outcomeUserFilter]);

  // Per-user outcome counts (for user filter)
  const outcomeUserCounts = useMemo(() => {
    const map = new Map<string, { vendido: number; em_atendimento: number; descartado: number; sem_desfecho: number; total: number }>();
    outcomeLeads.forEach(l => {
      if (!l.claimed_by) return;
      if (!map.has(l.claimed_by)) map.set(l.claimed_by, { vendido: 0, em_atendimento: 0, descartado: 0, sem_desfecho: 0, total: 0 });
      const entry = map.get(l.claimed_by)!;
      entry.total++;
      if (l.lead_outcome === 'vendido') entry.vendido++;
      else if (l.lead_outcome === 'em_atendimento') entry.em_atendimento++;
      else if (l.lead_outcome === 'descartado') entry.descartado++;
      else entry.sem_desfecho++;
    });
    return map;
  }, [outcomeLeads]);

  // Unique users from outcome leads
  const outcomeUsers = useMemo(() => {
    const userMap = new Map<string, { user_id: string; full_name: string }>();
    outcomeLeads.forEach(l => {
      if (l.claimed_by && !userMap.has(l.claimed_by)) {
        const lic = stats.topLicensees.find(u => u.user_id === l.claimed_by);
        userMap.set(l.claimed_by, { user_id: l.claimed_by, full_name: lic?.full_name || l.claimed_by.slice(0, 8) });
      }
    });
    return Array.from(userMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [outcomeLeads, stats.topLicensees]);

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

  const selectedLicensee = stats.topLicensees.find(l => l.user_id === selectedUserId);

  return (
    <div className="space-y-6 pb-8">
      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'admin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('admin')}
            className="gap-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            Visão Admin
          </Button>
          <Button
            variant={viewMode === 'licensee' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('licensee')}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" />
            Visão do Licenciado
          </Button>
        </div>

        {viewMode === 'licensee' && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Selecione um licenciado..." />
              </SelectTrigger>
              <SelectContent>
                {stats.topLicensees.map(lic => (
                  <SelectItem key={lic.user_id} value={lic.user_id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{lic.full_name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{lic.total_claimed} leads</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLicensee && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {selectedLicensee.city || selectedLicensee.state || 'Sem localização'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Licensee Dashboard View */}
      {viewMode === 'licensee' ? (
        !selectedUserId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">Selecione um licenciado acima para visualizar o dashboard dele</p>
            </CardContent>
          </Card>
        ) : licenseeLeadsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <Avatar className="h-9 w-9">
                <AvatarImage src={selectedLicensee?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {selectedLicensee?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{selectedLicensee?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedLicensee?.email}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs shrink-0">
                Visualizando como este usuário
              </Badge>
            </div>
            <LicenseeDashboard
              myLeads={licenseeLeads}
              allLeads={allLeadsForLicensee}
              userId={selectedUserId}
            />
          </div>
        )
      ) : (
      <>
      {/* KPI Cards with embedded insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total de Leads', value: stats.total, icon: Flame, gradient: 'from-orange-500 to-red-500', insight: kpiInsights.total },
          { label: 'Disponíveis', value: stats.available, icon: Target, gradient: 'from-green-500 to-emerald-500', insight: kpiInsights.available },
          { label: 'Adquiridos', value: stats.claimed, icon: UserCheck, gradient: 'from-blue-500 to-indigo-500', insight: kpiInsights.claimed },
        ].map(kpi => (
          <Card key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`}>
            <CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-white/80 text-xs font-medium">{kpi.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{kpi.value.toLocaleString('pt-BR')}</p>
                </div>
                <kpi.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white/30 shrink-0" />
              </div>
              {kpi.insight && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-white/70 shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-[11px] leading-relaxed text-white/80">{kpi.insight}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outcome Stats - Situação dos Leads Adquiridos */}
      {stats.claimed > 0 && (() => {
        const totalOutcome = outcomeStats.vendido + outcomeStats.em_atendimento + outcomeStats.descartado + outcomeStats.sem_desfecho;
        const items = [
          { label: 'Vendido', value: outcomeStats.vendido, color: 'bg-green-500', textColor: 'text-green-600', icon: ShoppingCart },
          { label: 'Em Atendimento', value: outcomeStats.em_atendimento, color: 'bg-amber-500', textColor: 'text-amber-600', icon: Stethoscope },
          { label: 'Descartado', value: outcomeStats.descartado, color: 'bg-red-500', textColor: 'text-red-600', icon: XCircle },
          { label: 'Sem Desfecho', value: outcomeStats.sem_desfecho, color: 'bg-slate-400', textColor: 'text-slate-500', icon: Clock },
        ];
        const outcomePie = items.filter(i => i.value > 0).map(i => ({
          name: i.label,
          value: i.value,
          color: i.label === 'Vendido' ? '#22c55e' : i.label === 'Em Atendimento' ? '#f59e0b' : i.label === 'Descartado' ? '#ef4444' : '#94a3b8',
        }));
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Situação dos Leads Adquiridos
                <Badge variant="outline" className="font-normal text-[10px]">{totalOutcome} leads</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-center justify-center">
                  {outcomePie.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={outcomePie} cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}
                        >
                          {outcomePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8">Nenhum desfecho registrado ainda</p>
                  )}
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                  {items.map(item => {
                    const pct = totalOutcome > 0 ? (item.value / totalOutcome) * 100 : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 shrink-0 ${item.textColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${item.textColor}`}>{item.value}</span>
                              <span className="text-xs text-muted-foreground">({pct.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

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
          <ResponsiveContainer width="100%" height={220}>
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
              <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 'dataMax']} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend fontSize={11} />
              <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} fill="url(#gradTotal)" name="Novos Leads" />
              <Area type="monotone" dataKey="claimed" stroke="#3b82f6" strokeWidth={2} fill="url(#gradClaimed)" name="Capturados" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Region + State Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* State Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
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
            <ResponsiveContainer width="100%" height={250}>
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

      {/* Heat Map */}
      <BrazilMapChart byState={stats.byState} />

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
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <th className="text-center py-3 px-3 w-12 font-bold text-xs uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Licenciado</th>
                  <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Cidade</th>
                  <th className="text-center py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">UF</th>
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
                      <td className="py-3 px-3">
                        <span className="text-xs text-muted-foreground">{lic.city || '—'}</span>
                      </td>
                      <td className="text-center py-3 px-3">
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
      </>
      )}
    </div>
  );
}
