import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';
import {
  Flame, MapPin, Building2, TrendingUp, Clock, UserCheck, Target,
  BarChart3, Lightbulb, Zap, AlertTriangle, CheckCircle2, Trophy, Crown, Medal, User,
  XCircle, ShoppingCart, Stethoscope, Eye, ArrowLeft, ChevronDown, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, Filter,
} from 'lucide-react';
import { SalesControlTable } from '@/components/hotleads/SalesControlTable';
import { StateDetailTable } from '@/components/hotleads/StateDetailTable';
import { DiscardRankingTable } from '@/components/hotleads/DiscardRankingTable';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllLeadStats } from '@/hooks/useAllLeadStats';
import { supabase } from '@/integrations/supabase/client';
import { BrazilMapChart } from '@/components/hotleads/BrazilMapChart';
import { LicenseeDashboard } from '@/components/hotleads/LicenseeDashboard';
import { ChartDetailDialog } from '@/components/hotleads/ChartDetailDialog';
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

  // Fetch leads for selected licensee (paginated to avoid 1000-row limit)
  useEffect(() => {
    if (viewMode !== 'licensee' || !selectedUserId) return;
    async function fetchLeads() {
      setLicenseeLeadsLoading(true);
      try {
        const pageSize = 1000;

        // Fetch my leads (paginated)
        let myLeads: any[] = [];
        let myFrom = 0;
        while (true) {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('claimed_by', selectedUserId)
            .in('source', ['planilha', 'n8n'])
            .range(myFrom, myFrom + pageSize - 1);
          if (error) { console.error('Error fetching licensee leads:', error); break; }
          if (!data || data.length === 0) break;
          myLeads = myLeads.concat(data);
          if (data.length < pageSize) break;
          myFrom += pageSize;
        }

        // Fetch all claimed leads (paginated)
        let allLeads: any[] = [];
        let allFrom = 0;
        while (true) {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .in('source', ['planilha', 'n8n'])
            .not('claimed_by', 'is', null)
            .range(allFrom, allFrom + pageSize - 1);
          if (error) { console.error('Error fetching all leads:', error); break; }
          if (!data || data.length === 0) break;
          allLeads = allLeads.concat(data);
          if (data.length < pageSize) break;
          allFrom += pageSize;
        }

        console.log(`[LicenseeView] Loaded ${myLeads.length} user leads, ${allLeads.length} total claimed leads`);
        setLicenseeLeads(myLeads as HotLead[]);
        setAllLeadsForLicensee(allLeads as HotLead[]);
      } catch (e) {
        console.error('Error loading licensee view:', e);
      } finally {
        setLicenseeLeadsLoading(false);
      }
    }
    fetchLeads();
  }, [viewMode, selectedUserId]);

  // Chart drill-down state
  const [drillDown, setDrillDown] = useState<{ type: string; filter: string; title: string } | null>(null);
  const [drillDownLeads, setDrillDownLeads] = useState<any[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // Region map for drill-down
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

  // Fetch leads for drill-down
  const fetchDrillDownLeads = useCallback(async (type: string, filter: string, title: string) => {
    setDrillDown({ type, filter, title });
    setDrillDownLoading(true);
    try {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;

      if (type === 'state') {
        while (true) {
          const { data } = await supabase
            .from('leads')
            .select('id, name, phone, email, city, state, claimed_by, claimed_at, lead_outcome, created_at')
            .eq('state', filter)
            .in('source', ['planilha', 'n8n'])
            .range(from, from + pageSize - 1);
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
      } else if (type === 'region') {
        const regionStates = Object.entries(STATE_TO_REGION)
          .filter(([_, r]) => r === filter)
          .map(([s]) => s);
        while (true) {
          const { data } = await supabase
            .from('leads')
            .select('id, name, phone, email, city, state, claimed_by, claimed_at, lead_outcome, created_at')
            .in('state', regionStates)
            .in('source', ['planilha', 'n8n'])
            .range(from, from + pageSize - 1);
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
      } else if (type === 'day') {
        // filter is a date string like "15/02"
        while (true) {
          const { data } = await supabase
            .from('leads')
            .select('id, name, phone, email, city, state, claimed_by, claimed_at, lead_outcome, created_at')
            .in('source', ['planilha', 'n8n'])
            .gte('created_at', `${filter}T00:00:00`)
            .lt('created_at', `${filter}T23:59:59`)
            .range(from, from + pageSize - 1);
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
      }

      setDrillDownLeads(allData);
    } catch (e) {
      console.error('Drill-down fetch error:', e);
      setDrillDownLeads([]);
    } finally {
      setDrillDownLoading(false);
    }
  }, []);

  // Fetch lead outcome stats with lead details
  const [outcomeStats, setOutcomeStats] = useState({ vendido: 0, em_atendimento: 0, descartado: 0, sem_desfecho: 0 });
  const [outcomeLeads, setOutcomeLeads] = useState<any[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [outcomeUserFilter, setOutcomeUserFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchOutcomes() {
      // Fetch all claimed leads (paginate to avoid 1000 row limit)
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, email, city, state, lead_outcome, claimed_by, claimed_at, source, created_at')
          .not('claimed_by', 'is', null)
          .in('source', ['planilha', 'n8n'])
          .range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      // Filter out test leads and admin/internal users
      const EXCLUDED_USERS = [
        '00294ac4-0194-47bc-95ef-6efb83c316f7', // Administrador ByNeofolic
        '1b58da47-d988-4f96-9847-ed2d8939505e', // TI Neo Folic
        '9003cecf-7be7-45c7-8c53-1f4923c974f6', // Nicholas Barreto
        '860ae553-aa79-4e54-af98-a90dd8317c15', // Lucas Araujo
      ];
      const filtered = allData.filter((l: any) => 
        !l.name?.toLowerCase().includes('teste') && !EXCLUDED_USERS.includes(l.claimed_by)
      );
      setOutcomeLeads(filtered);
      const vendido = filtered.filter((l: any) => l.lead_outcome === 'vendido').length;
      const em_atendimento = filtered.filter((l: any) => l.lead_outcome === 'em_atendimento').length;
      const descartado = filtered.filter((l: any) => l.lead_outcome === 'descartado').length;
      const sem_desfecho = filtered.filter((l: any) => !l.lead_outcome).length;
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

  // Region data (using STATE_TO_REGION and REGION_COLORS defined above)
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
        const effectiveStats = outcomeUserFilter === 'all' ? outcomeStats : (() => {
          const uc = outcomeUserCounts.get(outcomeUserFilter);
          return uc || { vendido: 0, em_atendimento: 0, descartado: 0, sem_desfecho: 0 };
        })();
        const totalOutcome = effectiveStats.vendido + effectiveStats.em_atendimento + effectiveStats.descartado + effectiveStats.sem_desfecho;
        const OUTCOME_KEYS = [
          { key: 'vendido', label: 'Vendido', value: effectiveStats.vendido, color: 'bg-green-500', textColor: 'text-green-600', icon: ShoppingCart, pieColor: '#22c55e' },
          { key: 'em_atendimento', label: 'Em Atendimento', value: effectiveStats.em_atendimento, color: 'bg-amber-500', textColor: 'text-amber-600', icon: Stethoscope, pieColor: '#f59e0b' },
          { key: 'descartado', label: 'Descartado', value: effectiveStats.descartado, color: 'bg-red-500', textColor: 'text-red-600', icon: XCircle, pieColor: '#ef4444' },
          { key: 'sem_desfecho', label: 'Sem Desfecho', value: effectiveStats.sem_desfecho, color: 'bg-slate-400', textColor: 'text-slate-500', icon: Clock, pieColor: '#94a3b8' },
        ];
        const outcomePie = OUTCOME_KEYS.filter(i => i.value > 0).map(i => ({
          name: i.label, value: i.value, color: i.pieColor,
        }));
        return (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Situação dos Leads Adquiridos
                  <Badge variant="outline" className="font-normal text-[10px]">{totalOutcome} leads</Badge>
                </CardTitle>
                <div className="sm:ml-auto flex items-center gap-2">
                  <Select value={outcomeUserFilter} onValueChange={(v) => { setOutcomeUserFilter(v); setSelectedOutcome(null); }}>
                    <SelectTrigger className="h-8 text-xs w-full max-w-[220px]">
                      <SelectValue placeholder="Todos os usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {outcomeUsers.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{u.full_name}</span>
                            <Badge variant="outline" className="text-[9px] shrink-0">
                              {outcomeUserCounts.get(u.user_id)?.total || 0}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex items-center justify-center">
                  {outcomePie.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                        <Pie data={outcomePie} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}
                          cursor="pointer"
                          onClick={(_: any, idx: number) => {
                            const key = OUTCOME_KEYS.find(k => k.label === outcomePie[idx]?.name)?.key;
                            if (key) setSelectedOutcome(prev => prev === key ? null : key);
                          }}
                        >
                          {outcomePie.map((e, i) => <Cell key={i} fill={e.color} stroke={OUTCOME_KEYS.find(k => k.label === e.name)?.key === selectedOutcome ? '#000' : 'transparent'} strokeWidth={2} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8">Nenhum desfecho registrado ainda</p>
                  )}
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                  {OUTCOME_KEYS.map(item => {
                    const pct = totalOutcome > 0 ? (item.value / totalOutcome) * 100 : 0;
                    const isActive = selectedOutcome === item.key;
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2.5 transition-all border-2 ${
                          isActive 
                            ? 'bg-muted shadow-md border-foreground/20 scale-[1.02]' 
                            : 'hover:bg-muted/60 hover:shadow-sm border-transparent hover:border-muted-foreground/10'
                        }`}
                        onClick={() => setSelectedOutcome(prev => prev === item.key ? null : item.key)}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <div>
                              <span className="text-sm font-semibold">{item.label}</span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                {isActive ? '▼ clique para fechar' : '▶ clique para detalhar'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-extrabold ${item.textColor}`}>{item.value}</span>
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

              {/* Detail Table - shown when an outcome is selected */}
              {selectedOutcome && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      {(() => {
                        const item = OUTCOME_KEYS.find(k => k.key === selectedOutcome);
                        if (!item) return null;
                        return <><item.icon className={`h-4 w-4 ${item.textColor}`} />{item.label}<Badge variant="outline" className="text-[10px]">{filteredOutcomeLeads.length} leads</Badge></>;
                      })()}
                    </h4>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOutcome(null)} className="text-xs gap-1">
                      <ArrowLeft className="h-3 w-3" /> Fechar
                    </Button>
                  </div>
                  <div className="overflow-auto max-h-[400px] rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Nome</th>
                          <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Telefone</th>
                          <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden md:table-cell">Cidade/UF</th>
                          <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Licenciado</th>
                          <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden sm:table-cell">Adquirido em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOutcomeLeads.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-6 text-muted-foreground text-xs">Nenhum lead encontrado</td></tr>
                        ) : filteredOutcomeLeads.slice(0, 100).map(lead => {
                          const lic = stats.topLicensees.find(u => u.user_id === lead.claimed_by);
                          return (
                            <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3 font-medium truncate max-w-[180px]">{lead.name}</td>
                              <td className="py-2 px-3 text-muted-foreground text-xs">{lead.phone}</td>
                              <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell">
                                {[lead.city, lead.state].filter(Boolean).join('/') || '—'}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={lic?.avatar_url || ''} />
                                    <AvatarFallback className="text-[8px] bg-muted">{lic?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate max-w-[120px]">{lic?.full_name || '—'}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-xs text-muted-foreground hidden sm:table-cell">
                                {lead.claimed_at ? format(new Date(lead.claimed_at), 'dd/MM/yy', { locale: ptBR }) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredOutcomeLeads.length > 100 && (
                      <p className="text-center text-xs text-muted-foreground py-2">Mostrando 100 de {filteredOutcomeLeads.length} leads</p>
                    )}
                  </div>
                </div>
              )}
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
            <span className="text-[10px] text-muted-foreground font-normal ml-auto">Clique em um ponto para ver detalhes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.byDay} onClick={(e: any) => {
                if (e?.activePayload?.[0]?.payload?.rawDate) {
                  const raw = e.activePayload[0].payload.rawDate;
                  const label = e.activePayload[0].payload.date;
                  fetchDrillDownLeads('day', raw, `Leads do dia ${label}`);
                }
              }} style={{ cursor: 'pointer' }}>
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
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">Clique para detalhar</span>
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
                  cursor="pointer"
                  onClick={(_: any, idx: number) => {
                    const item = statePie[idx];
                    if (item && item.name !== 'Outros') {
                      fetchDrillDownLeads('state', item.name, `Leads de ${item.name}`);
                    }
                  }}
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
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">Clique para detalhar</span>
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
                  cursor="pointer"
                  onClick={(_: any, idx: number) => {
                    const item = regionPie[idx];
                    if (item) {
                      fetchDrillDownLeads('region', item.name, `Leads da região ${item.name}`);
                    }
                  }}
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

      {/* Full State Table - Enhanced */}
      <StateDetailTable stats={stats} COLORS={COLORS} fetchDrillDownLeads={fetchDrillDownLeads} />


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
      {/* Sales Control & Discard Ranking (collapsible) */}
      <SalesControlTable leads={outcomeLeads} licensees={stats.topLicensees} />
      <DiscardRankingTable leads={outcomeLeads} licensees={stats.topLicensees} />
      </>
      )}

      {/* Chart Drill-Down Dialog */}
      <ChartDetailDialog
        open={!!drillDown}
        onOpenChange={(open) => { if (!open) setDrillDown(null); }}
        title={drillDown?.title || ''}
        subtitle={`${drillDownLeads.length} leads`}
        leads={drillDownLeads}
        licensees={stats.topLicensees}
        isLoading={drillDownLoading}
      />
    </div>
  );
}
