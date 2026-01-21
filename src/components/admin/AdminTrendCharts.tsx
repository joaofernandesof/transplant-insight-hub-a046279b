import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Users, Activity } from 'lucide-react';

interface DailyStats {
  date: string;
  displayDate: string;
  newUsers: number;
  activeUsers: number;
  sessions: number;
}

export function AdminTrendCharts() {
  const [data, setData] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({ newUsers: 0, activeUsers: 0, sessions: 0 });

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 13); // Last 14 days
      
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const dailyStats: DailyStats[] = [];
      let totalNew = 0;
      let totalActive = 0;
      let totalSessions = 0;

      for (const day of days) {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        // Count new users created on this day
        const { count: newUsersCount } = await supabase
          .from('neohub_users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());

        // Count active users (last_seen_at on this day)
        const { count: activeUsersCount } = await supabase
          .from('neohub_users')
          .select('id', { count: 'exact', head: true })
          .gte('last_seen_at', dayStart.toISOString())
          .lt('last_seen_at', dayEnd.toISOString());

        // Count sessions on this day
        const { count: sessionsCount } = await supabase
          .from('user_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('started_at', dayStart.toISOString())
          .lt('started_at', dayEnd.toISOString());

        const newUsers = newUsersCount || 0;
        const activeUsers = activeUsersCount || 0;
        const sessions = sessionsCount || 0;

        totalNew += newUsers;
        totalActive += activeUsers;
        totalSessions += sessions;

        dailyStats.push({
          date: dayStart.toISOString(),
          displayDate: format(dayStart, 'dd/MM', { locale: ptBR }),
          newUsers,
          activeUsers,
          sessions
        });
      }

      setData(dailyStats);
      setTotals({ newUsers: totalNew, activeUsers: totalActive, sessions: totalSessions });
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando gráficos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* User Growth Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Crescimento de Usuários
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              +{totals.newUsers} novos (14d)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="newUsers" 
                name="Novos Usuários"
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorNewUsers)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Atividade Diária
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {totals.sessions} sessões (14d)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconSize={8}
              />
              <Bar 
                dataKey="activeUsers" 
                name="Usuários Ativos"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="sessions" 
                name="Sessões"
                fill="hsl(var(--muted-foreground))" 
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
