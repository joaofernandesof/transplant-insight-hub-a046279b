import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Building2,
  Flame,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface SystemStats {
  totalLicensees: number;
  activeLicensees: number;
  pendingLicensees: number;
  totalLeads: number;
  convertedLeads: number;
  totalSales: number;
  totalVGV: number;
  totalSurgeries: number;
  upcomingSurgeries: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  onlineUsers: number;
  weeklyActiveUsers: number;
}

interface RecentActivity {
  type: 'lead' | 'sale' | 'surgery' | 'user';
  description: string;
  timestamp: string;
  user?: string;
}

interface UserPresence {
  name: string;
  avatar_url: string | null;
  last_seen_at: string;
  status: string;
}

interface LeadsByState {
  state: string;
  count: number;
}

interface SalesByMonth {
  month: string;
  sales: number;
  vgv: number;
}

const CHART_COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(0, 84%, 60%)'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalLicensees: 0,
    activeLicensees: 0,
    pendingLicensees: 0,
    totalLeads: 0,
    convertedLeads: 0,
    totalSales: 0,
    totalVGV: 0,
    totalSurgeries: 0,
    upcomingSurgeries: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    onlineUsers: 0,
    weeklyActiveUsers: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [leadsByState, setLeadsByState] = useState<LeadsByState[]>([]);
  const [salesByMonth, setSalesByMonth] = useState<SalesByMonth[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivities(),
        fetchOnlineUsers(),
        fetchLeadsByState(),
        fetchSalesByMonth()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const fiveMinutesAgo = subDays(now, 1 / 288); // 5 minutes

    const [
      profilesRes,
      leadsRes,
      convertedLeadsRes,
      salesRes,
      surgeriesRes,
      upcomingSurgeriesRes,
      coursesRes,
      enrollmentsRes,
      completedEnrollmentsRes,
      onlineUsersRes,
      weeklyActiveRes
    ] = await Promise.all([
      supabase.from('profiles').select('status'),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
      supabase.from('sales').select('vgv_initial'),
      supabase.from('surgery_schedule').select('id', { count: 'exact', head: true }),
      supabase.from('surgery_schedule').select('id', { count: 'exact', head: true }).gte('surgery_date', format(now, 'yyyy-MM-dd')),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('user_course_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('user_course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', fiveMinutesAgo.toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', weekAgo.toISOString())
    ]);

    const profiles = profilesRes.data || [];
    const active = profiles.filter(p => p.status === 'active').length;
    const pending = profiles.filter(p => p.status === 'pending').length;
    const salesData = salesRes.data || [];
    const totalVGV = salesData.reduce((sum, s) => sum + (s.vgv_initial || 0), 0);

    setStats({
      totalLicensees: profiles.length,
      activeLicensees: active,
      pendingLicensees: pending,
      totalLeads: leadsRes.count || 0,
      convertedLeads: convertedLeadsRes.count || 0,
      totalSales: salesData.length,
      totalVGV,
      totalSurgeries: surgeriesRes.count || 0,
      upcomingSurgeries: upcomingSurgeriesRes.count || 0,
      totalCourses: coursesRes.count || 0,
      totalEnrollments: enrollmentsRes.count || 0,
      completedEnrollments: completedEnrollmentsRes.count || 0,
      onlineUsers: onlineUsersRes.count || 0,
      weeklyActiveUsers: weeklyActiveRes.count || 0
    });
  };

  const fetchRecentActivities = async () => {
    const activities: RecentActivity[] = [];

    // Recent leads
    const { data: leads } = await supabase
      .from('leads')
      .select('name, created_at, state')
      .order('created_at', { ascending: false })
      .limit(3);

    leads?.forEach(lead => {
      activities.push({
        type: 'lead',
        description: `Novo lead: ${lead.name} (${lead.state || 'N/A'})`,
        timestamp: lead.created_at
      });
    });

    // Recent sales
    const { data: sales } = await supabase
      .from('sales')
      .select('patient_name, created_at, vgv_initial')
      .order('created_at', { ascending: false })
      .limit(3);

    sales?.forEach(sale => {
      activities.push({
        type: 'sale',
        description: `Venda registrada: ${sale.patient_name} - R$ ${(sale.vgv_initial || 0).toLocaleString('pt-BR')}`,
        timestamp: sale.created_at
      });
    });

    // Recent surgeries scheduled
    const { data: surgeries } = await supabase
      .from('surgery_schedule')
      .select('patient_name, created_at, surgery_date')
      .order('created_at', { ascending: false })
      .limit(3);

    surgeries?.forEach(surgery => {
      activities.push({
        type: 'surgery',
        description: `Cirurgia agendada: ${surgery.patient_name} para ${format(new Date(surgery.surgery_date), 'dd/MM')}`,
        timestamp: surgery.created_at
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivities(activities.slice(0, 8));
  };

  const fetchOnlineUsers = async () => {
    const fiveMinutesAgo = subDays(new Date(), 1 / 288);
    
    const { data } = await supabase
      .from('profiles')
      .select('name, avatar_url, last_seen_at, status')
      .gte('last_seen_at', fiveMinutesAgo.toISOString())
      .order('last_seen_at', { ascending: false })
      .limit(10);

    setOnlineUsers(data || []);
  };

  const fetchLeadsByState = async () => {
    const { data } = await supabase
      .from('leads')
      .select('state');

    if (data) {
      const stateCount: Record<string, number> = {};
      data.forEach(lead => {
        const state = lead.state || 'N/A';
        stateCount[state] = (stateCount[state] || 0) + 1;
      });
      
      const sortedStates = Object.entries(stateCount)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setLeadsByState(sortedStates);
    }
  };

  const fetchSalesByMonth = async () => {
    const { data } = await supabase
      .from('sales')
      .select('month_year, vgv_initial');

    if (data) {
      const monthData: Record<string, { sales: number; vgv: number }> = {};
      data.forEach(sale => {
        const month = sale.month_year;
        if (!monthData[month]) {
          monthData[month] = { sales: 0, vgv: 0 };
        }
        monthData[month].sales += 1;
        monthData[month].vgv += sale.vgv_initial || 0;
      });

      const sortedMonths = Object.entries(monthData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

      setSalesByMonth(sortedMonths);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'sale': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'surgery': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'user': return <Users className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const conversionRate = stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : '0';
  const courseCompletionRate = stats.totalEnrollments > 0 ? ((stats.completedEnrollments / stats.totalEnrollments) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 pt-16 lg:pt-6 lg:p-6 max-w-7xl mx-auto overflow-x-hidden w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-sm text-muted-foreground">Visão geral do sistema e dos licenciados</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Licenciados */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Licenciados</p>
                  <p className="text-2xl font-bold">{stats.totalLicensees}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {stats.activeLicensees} ativos
                    </Badge>
                    {stats.pendingLicensees > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600">
                        {stats.pendingLicensees} pendentes
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads */}
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] text-green-600">{conversionRate}% convertidos</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendas */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    VGV: {formatCurrency(stats.totalVGV)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cirurgias */}
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cirurgias</p>
                  <p className="text-2xl font-bold">{stats.totalSurgeries}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3 text-teal-500" />
                    <span className="text-[10px] text-teal-600">{stats.upcomingSurgeries} agendadas</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.totalCourses}</p>
                <p className="text-[10px] text-muted-foreground">Cursos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{courseCompletionRate}%</p>
                <p className="text-[10px] text-muted-foreground">Conclusão cursos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.onlineUsers}</p>
                <p className="text-[10px] text-muted-foreground">Online agora</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <Eye className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.weeklyActiveUsers}</p>
                <p className="text-[10px] text-muted-foreground">Ativos (7 dias)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vendas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesByMonth}>
                    <defs>
                      <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'VGV']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vgv" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVgv)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by State */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Leads por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadsByState.map((item, index) => (
                  <div key={item.state} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-xs flex-1">{item.state}</span>
                    <span className="text-xs font-medium">{item.count}</span>
                    <Progress 
                      value={(item.count / (leadsByState[0]?.count || 1)) * 100} 
                      className="w-16 h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity and Online Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.slice(0, 6).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-1">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(activity.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma atividade recente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Online Users */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {onlineUsers.length} online
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onlineUsers.slice(0, 6).map((user, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(user.last_seen_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {onlineUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum usuário online
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
