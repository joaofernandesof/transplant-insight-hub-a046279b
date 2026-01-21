import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, AlertTriangle } from "lucide-react";

interface ChartDataPoint {
  date: string;
  uptime: number;
  responseTime: number;
  errorCount: number;
  alertCount: number;
}

export function SentinelMetricsChart() {
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Fetch systems for dropdown
  const { data: systems } = useQuery({
    queryKey: ['sentinel-systems-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('monitored_systems')
        .select('id, name')
        .eq('is_active', true);
      return data || [];
    },
  });

  // Fetch historical data
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['sentinel-metrics-history', selectedSystem, timeRange],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();

      // Build query for health checks
      let checksQuery = supabase
        .from('system_health_checks')
        .select('status, response_time_ms, checked_at, system_id')
        .gte('checked_at', startDate)
        .order('checked_at');

      if (selectedSystem !== 'all') {
        checksQuery = checksQuery.eq('system_id', selectedSystem);
      }

      const { data: checks } = await checksQuery;

      // Build query for alerts
      let alertsQuery = supabase
        .from('system_alerts')
        .select('created_at, system_id')
        .gte('created_at', startDate);

      if (selectedSystem !== 'all') {
        alertsQuery = alertsQuery.eq('system_id', selectedSystem);
      }

      const { data: alerts } = await alertsQuery;

      // Group by day
      const dataByDay: Record<string, ChartDataPoint> = {};

      for (let i = 0; i <= days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dataByDay[date] = {
          date: format(subDays(new Date(), i), 'dd/MM', { locale: ptBR }),
          uptime: 100,
          responseTime: 0,
          errorCount: 0,
          alertCount: 0,
        };
      }

      // Process health checks
      const checksByDay: Record<string, { total: number; healthy: number; responseTimes: number[] }> = {};
      
      (checks || []).forEach(check => {
        const date = format(new Date(check.checked_at), 'yyyy-MM-dd');
        if (!checksByDay[date]) {
          checksByDay[date] = { total: 0, healthy: 0, responseTimes: [] };
        }
        checksByDay[date].total++;
        if (check.status === 'healthy') {
          checksByDay[date].healthy++;
        }
        if (check.response_time_ms) {
          checksByDay[date].responseTimes.push(check.response_time_ms);
        }
      });

      Object.entries(checksByDay).forEach(([date, data]) => {
        if (dataByDay[date]) {
          dataByDay[date].uptime = data.total > 0 ? (data.healthy / data.total) * 100 : 100;
          dataByDay[date].responseTime = data.responseTimes.length > 0 
            ? Math.round(data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length)
            : 0;
          dataByDay[date].errorCount = data.total - data.healthy;
        }
      });

      // Process alerts
      (alerts || []).forEach(alert => {
        const date = format(new Date(alert.created_at), 'yyyy-MM-dd');
        if (dataByDay[date]) {
          dataByDay[date].alertCount++;
        }
      });

      return Object.values(dataByDay).reverse();
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={selectedSystem} onValueChange={setSelectedSystem}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os sistemas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Sistemas</SelectItem>
            {systems?.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Uptime Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Uptime (%)
            </CardTitle>
            <CardDescription>Disponibilidade dos sistemas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uptime" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#uptimeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Tempo de Resposta (ms)
            </CardTitle>
            <CardDescription>Latência média diária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="hsl(217 91% 60%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Chart */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Erros e Alertas
            </CardTitle>
            <CardDescription>Incidentes registrados por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Bar dataKey="errorCount" fill="hsl(0 84% 60%)" name="Erros" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alertCount" fill="hsl(38 92% 50%)" name="Alertas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
