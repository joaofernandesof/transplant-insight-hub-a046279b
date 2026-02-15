import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Line,
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Flame,
  Users,
  MapPin,
  Building2,
  TrendingUp,
  Clock,
  UserCheck,
  Target,
  BarChart3,
  Award,
} from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface HotLeadsAdminDashboardProps {
  leads: HotLead[];
  queuedCount: number;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#f43f5e'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export function HotLeadsAdminDashboard({ leads, queuedCount }: HotLeadsAdminDashboardProps) {
  // ── KPI calculations ──
  const kpis = useMemo(() => {
    const total = leads.length;
    const claimed = leads.filter(l => l.claimed_by).length;
    const available = leads.filter(l => !l.claimed_by && l.release_status === 'available').length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayLeads = leads.filter(l => new Date(l.created_at) >= today).length;
    const weekAgo = subDays(new Date(), 7);
    const weekLeads = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    const rate = total > 0 ? ((claimed / total) * 100).toFixed(1) : '0';

    return { total, claimed, available, todayLeads, weekLeads, rate };
  }, [leads]);

  // ── By State ──
  const stateData = useMemo(() => {
    const map: Record<string, { total: number; claimed: number }> = {};
    leads.forEach(l => {
      const s = l.state || 'N/A';
      if (!map[s]) map[s] = { total: 0, claimed: 0 };
      map[s].total++;
      if (l.claimed_by) map[s].claimed++;
    });
    return Object.entries(map)
      .map(([state, v]) => ({ state, total: v.total, claimed: v.claimed, available: v.total - v.claimed }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  // ── By City (top 15) ──
  const cityData = useMemo(() => {
    const map: Record<string, { total: number; claimed: number }> = {};
    leads.forEach(l => {
      const c = l.city || 'N/A';
      if (!map[c]) map[c] = { total: 0, claimed: 0 };
      map[c].total++;
      if (l.claimed_by) map[c].claimed++;
    });
    return Object.entries(map)
      .map(([city, v]) => ({
        city: city.length > 18 ? city.slice(0, 18) + '…' : city,
        fullCity: city,
        total: v.total,
        claimed: v.claimed,
        available: v.total - v.claimed,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [leads]);

  // ── Daily evolution (30 days) ──
  const dailyData = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 30);
    return eachDayOfInterval({ start, end: today }).map(day => {
      const ds = startOfDay(day);
      const de = new Date(ds); de.setDate(de.getDate() + 1);
      const dayLeads = leads.filter(l => { const c = new Date(l.created_at); return c >= ds && c < de; });
      const claimed = dayLeads.filter(l => l.claimed_by).length;
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        leads: dayLeads.length,
        claimed,
      };
    });
  }, [leads]);

  // ── Status pie ──
  const statusPie = useMemo(() => [
    { name: 'Disponíveis', value: kpis.available, color: '#22c55e' },
    { name: 'Adquiridos', value: kpis.claimed, color: '#3b82f6' },
    { name: 'Na Fila', value: queuedCount, color: '#eab308' },
  ], [kpis, queuedCount]);

  // ── State pie (top 5 + outros) ──
  const statePie = useMemo(() => {
    const top5 = stateData.slice(0, 5);
    const othersTotal = stateData.slice(5).reduce((s, v) => s + v.total, 0);
    const result = top5.map((s, i) => ({ name: s.state, value: s.total, color: COLORS[i] }));
    if (othersTotal > 0) result.push({ name: 'Outros', value: othersTotal, color: '#94a3b8' });
    return result;
  }, [stateData]);

  // ── Unique cities/states count ──
  const uniqueStates = stateData.length;
  const uniqueCities = useMemo(() => new Set(leads.map(l => l.city).filter(Boolean)).size, [leads]);

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: kpis.total, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Disponíveis', value: kpis.available, icon: Target, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Adquiridos', value: kpis.claimed, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Na Fila', value: queuedCount, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
          { label: 'Hoje', value: kpis.todayLeads, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Taxa Captação', value: `${kpis.rate}%`, icon: Award, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950' },
        ].map(kpi => (
          <Card key={kpi.label} className={`${kpi.bg} border`}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color} shrink-0`} />
                <span className="text-xs text-muted-foreground font-medium truncate">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Geography summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueStates}</p>
              <p className="text-xs text-muted-foreground">Estados com leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueCities}</p>
              <p className="text-xs text-muted-foreground">Cidades com leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Daily Evolution + Status Pie */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Evolução Diária (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="adminColorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={2} fill="url(#adminColorLeads)" name="Novos Leads" />
                <Line type="monotone" dataKey="claimed" stroke="#3b82f6" strokeWidth={2} dot={false} name="Adquiridos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Status Geral</CardTitle>
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

      {/* Row 2: States bar + State pie */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Leads por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(250, stateData.length * 28)}>
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="state" type="category" width={50} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="available" stackId="a" fill="#22c55e" name="Disponíveis" radius={[0, 0, 0, 0]} />
                <Bar dataKey="claimed" stackId="a" fill="#3b82f6" name="Adquiridos" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statePie} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {statePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            {/* State table */}
            <div className="mt-4 max-h-[200px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 font-medium text-muted-foreground">Estado</th>
                    <th className="text-right py-1.5 font-medium text-muted-foreground">Total</th>
                    <th className="text-right py-1.5 font-medium text-muted-foreground">Disp.</th>
                    <th className="text-right py-1.5 font-medium text-muted-foreground">Adq.</th>
                  </tr>
                </thead>
                <tbody>
                  {stateData.map(s => (
                    <tr key={s.state} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">{s.state}</td>
                      <td className="text-right py-1.5">{s.total}</td>
                      <td className="text-right py-1.5 text-green-600">{s.available}</td>
                      <td className="text-right py-1.5 text-blue-600">{s.claimed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Cities bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Top 15 Cidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="city" type="category" width={130} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: any, props: any) => [value, props.payload?.fullCity || name]} />
              <Bar dataKey="available" stackId="a" fill="#22c55e" name="Disponíveis" />
              <Bar dataKey="claimed" stackId="a" fill="#3b82f6" name="Adquiridos" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
