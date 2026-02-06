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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { HotLead } from '@/hooks/useHotLeads';

interface HotLeadsChartsProps {
  leads: HotLead[];
}

const CHART_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444'];

export function HotLeadsCharts({ leads }: HotLeadsChartsProps) {
  // Daily evolution (last 30 days)
  const dailyData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayLeads = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= dayStart && created < dayEnd;
      });
      
      const claimed = dayLeads.filter(l => l.claimed_by).length;
      
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        fullDate: format(day, 'dd MMM', { locale: ptBR }),
        leads: dayLeads.length,
        claimed,
        available: dayLeads.length - claimed,
      };
    });
  }, [leads]);

  // Leads by city (top 10)
  const cityData = useMemo(() => {
    const byCity: Record<string, number> = {};
    leads.forEach(l => {
      const city = l.city || 'Não informado';
      byCity[city] = (byCity[city] || 0) + 1;
    });
    
    return Object.entries(byCity)
      .map(([city, count]) => ({ city: city.length > 15 ? city.slice(0, 15) + '...' : city, fullCity: city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [leads]);

  // Status distribution
  const statusData = useMemo(() => {
    const claimed = leads.filter(l => l.claimed_by).length;
    const available = leads.length - claimed;
    
    return [
      { name: 'Disponíveis', value: available, color: '#22c55e' },
      { name: 'Adquiridos', value: claimed, color: '#3b82f6' },
    ];
  }, [leads]);

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    const weeks: { week: string; leads: number }[] = [];
    const today = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const weekStart = subDays(today, i * 7 + 6);
      const weekEnd = subDays(today, i * 7);
      
      const weekLeads = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= weekStart && created <= weekEnd;
      });
      
      weeks.push({
        week: `Sem ${5 - i}`,
        leads: weekLeads.length,
      });
    }
    
    return weeks;
  }, [leads]);

  // Cumulative growth
  const cumulativeData = useMemo(() => {
    const sorted = [...leads].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    let cumulative = 0;
    const data: { date: string; total: number }[] = [];
    const seen = new Set<string>();
    
    sorted.forEach(lead => {
      const date = format(new Date(lead.created_at), 'dd/MM');
      cumulative++;
      
      if (!seen.has(date)) {
        seen.add(date);
        data.push({ date, total: cumulative });
      } else {
        // Update last entry
        const last = data[data.length - 1];
        if (last) last.total = cumulative;
      }
    });
    
    return data.slice(-30); // Last 30 unique days
  }, [leads]);

  return (
    <div className="grid gap-6">
      {/* Row 1: Evolution + Status */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Evolution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evolução Diária de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fill="url(#colorLeads)" 
                  name="Novos Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="claimed" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Adquiridos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Cities + Cumulative Growth */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top 10 Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  dataKey="city" 
                  type="category" 
                  width={100} 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value, name, props) => [value, props.payload.fullCity]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#f97316" 
                  radius={[0, 4, 4, 0]} 
                  name="Leads"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Crescimento Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cumulativeData}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fill="url(#colorCumulative)" 
                  name="Total Acumulado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Tendência Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="week" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="leads" 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]} 
                name="Leads na Semana"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
