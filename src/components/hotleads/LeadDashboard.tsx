import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Lead, statusConfig, PROCEDURES } from './LeadCard';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

interface LeadDashboardProps {
  leads: Lead[];
  isAdmin: boolean;
  profiles: Record<string, { name: string; state: string | null }>;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  licenseeFilter: string;
  setLicenseeFilter: (value: string) => void;
  periodFilter: string;
  setPeriodFilter: (value: string) => void;
}

export function LeadDashboard({
  leads,
  isAdmin,
  profiles,
  cityFilter,
  setCityFilter,
  licenseeFilter,
  setLicenseeFilter,
  periodFilter,
  setPeriodFilter
}: LeadDashboardProps) {
  // Filter leads based on dashboard filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
      if (licenseeFilter !== 'all' && lead.claimed_by !== licenseeFilter) return false;
      
      // Period filter
      const leadDate = new Date(lead.created_at);
      const now = new Date();
      switch (periodFilter) {
        case '7d':
          return leadDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return leadDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return leadDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '1y':
          return leadDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });
  }, [leads, cityFilter, licenseeFilter, periodFilter]);

  // Available cities
  const cities = useMemo(() => {
    return [...new Set(leads.map(l => l.city).filter(Boolean))] as string[];
  }, [leads]);

  // Available licensees
  const licensees = useMemo(() => {
    const ids = [...new Set(leads.map(l => l.claimed_by).filter(Boolean))] as string[];
    return ids.map(id => ({ id, name: profiles[id]?.name || 'Licenciado' }));
  }, [leads, profiles]);

  // Procedures sold stats
  const procedureStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {};
    
    filteredLeads.forEach(lead => {
      if (lead.status === 'converted' && lead.procedures_sold) {
        lead.procedures_sold.forEach(proc => {
          if (!stats[proc]) stats[proc] = { count: 0, value: 0 };
          stats[proc].count++;
          stats[proc].value += (lead.converted_value || 0) / lead.procedures_sold!.length;
        });
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // Leads by city
  const leadsByCity = useMemo(() => {
    const byCity: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      const city = lead.city || 'Não informado';
      byCity[city] = (byCity[city] || 0) + 1;
    });
    return Object.entries(byCity)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredLeads]);

  // Sales by city
  const salesByCity = useMemo(() => {
    const byCity: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      if (lead.status === 'converted') {
        const city = lead.city || 'Não informado';
        byCity[city] = (byCity[city] || 0) + (lead.converted_value || 0);
      }
    });
    return Object.entries(byCity)
      .map(([city, value]) => ({ city, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredLeads]);

  // Funnel distribution
  const funnelStats = useMemo(() => {
    const total = filteredLeads.length;
    const statusCounts = {
      new: filteredLeads.filter(l => l.status === 'new').length,
      contacted: filteredLeads.filter(l => l.status === 'contacted').length,
      scheduled: filteredLeads.filter(l => l.status === 'scheduled').length,
      converted: filteredLeads.filter(l => l.status === 'converted').length,
      lost: filteredLeads.filter(l => l.status === 'lost').length,
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusConfig[status as keyof typeof statusConfig].label,
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
    }));
  }, [filteredLeads]);

  // Daily leads evolution
  const dailyEvolution = useMemo(() => {
    const days: Record<string, { date: string; leads: number; conversions: number; value: number }> = {};
    
    filteredLeads.forEach(lead => {
      const date = new Date(lead.created_at).toLocaleDateString('pt-BR');
      if (!days[date]) {
        days[date] = { date, leads: 0, conversions: 0, value: 0 };
      }
      days[date].leads++;
      if (lead.status === 'converted') {
        days[date].conversions++;
        days[date].value += lead.converted_value || 0;
      }
    });

    return Object.values(days)
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split('/').map(Number);
        const [db, mb, yb] = b.date.split('/').map(Number);
        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
      })
      .slice(-30);
  }, [filteredLeads]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    const converted = filteredLeads.filter(l => l.status === 'converted').length;
    const totalValue = filteredLeads.reduce((sum, l) => sum + (l.converted_value || 0), 0);
    const avgTicket = converted > 0 ? totalValue / converted : 0;

    return {
      total,
      converted,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : '0',
      totalValue,
      avgTicket,
      scheduled: filteredLeads.filter(l => l.status === 'scheduled').length,
      lost: filteredLeads.filter(l => l.status === 'lost').length
    };
  }, [filteredLeads]);

  return (
    <div className="space-y-6">
      {/* Dashboard Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas cidades</SelectItem>
                {cities.sort().map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && licensees.length > 0 && (
              <Select value={licenseeFilter} onValueChange={setLicenseeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Licenciado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos licenciados</SelectItem>
                  {licensees.map(lic => (
                    <SelectItem key={lic.id} value={lic.id}>{lic.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{kpis.converted}</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{kpis.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">
              R$ {(kpis.totalValue / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-muted-foreground">Faturamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              R$ {kpis.avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{kpis.scheduled}</p>
            <p className="text-xs text-muted-foreground">Agendados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Funnel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição do Funil</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={funnelStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={false}
                >
                  {funnelStats.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} leads`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Procedures Sold */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procedimentos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={procedureStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" name="Vendas" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Leads by City */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por Cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadsByCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="city" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Leads" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by City */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas por Cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="city" type="category" width={100} fontSize={12} />
                <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                <Bar dataKey="value" fill="#22c55e" name="Valor" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Diária de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#22c55e" name="Conversões" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
