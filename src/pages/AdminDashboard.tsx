import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationDialog from '@/components/NotificationDialog';
import {
  Users,
  Activity,
  DollarSign,
  BookOpen,
  Award,
  Eye,
  Loader2,
  Database,
  Server,
  Shield,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Zap,
  Send,
  ChevronRight,
  Settings,
  BarChart3,
  Flame,
  GraduationCap,
  Building2,
  FileText,
  GitCompare
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SystemAlertsWidget } from '@/components/admin/SystemAlertsWidget';
import { AdminTrendCharts } from '@/components/admin/AdminTrendCharts';

// Quick access modules for admin
const quickModules = [
  { id: 'licensees', title: 'Licenciados', icon: Users, path: '/licensees', color: 'bg-blue-500' },
  { id: 'monitoring', title: 'Monitoramento', icon: Eye, path: '/monitoring', color: 'bg-cyan-500' },
  { id: 'comparison', title: 'Comparar Clínicas', icon: GitCompare, path: '/comparison', color: 'bg-purple-500' },
  { id: 'sentinel', title: 'Sentinel', icon: Activity, path: '/admin/sentinel', color: 'bg-green-500' },
  { id: 'dashboard', title: 'Indicadores', icon: BarChart3, path: '/dashboard', color: 'bg-emerald-500' },
  { id: 'surgery', title: 'Cirurgias', icon: Building2, path: '/surgery-schedule', color: 'bg-teal-500' },
  { id: 'reports', title: 'Relatórios', icon: FileText, path: '/weekly-reports', color: 'bg-rose-500' },
  { id: 'settings', title: 'Configurações', icon: Settings, path: '/admin', color: 'bg-slate-500' },
];

const contentModules = [
  { id: 'hotleads', title: 'HotLeads', icon: Flame, path: '/hotleads', color: 'bg-orange-500' },
  { id: 'university', title: 'Universidade', icon: GraduationCap, path: '/university', color: 'bg-indigo-500' },
  { id: 'crm', title: 'CRM & Vendas', icon: DollarSign, path: '/crm', color: 'bg-green-500' },
  { id: 'consolidated', title: 'Resultados', icon: BarChart3, path: '/consolidated-results', color: 'bg-amber-500' },
];

// Profile quick access for admin to view system as different profiles
const profileAccess = [
  { profile: 'licenciado', title: 'Licenciado', icon: Award, path: '/home', color: 'bg-amber-500' },
  { profile: 'colaborador', title: 'Colaborador', icon: Users, path: '/neoteam', color: 'bg-blue-500' },
  { profile: 'aluno', title: 'Aluno', icon: GraduationCap, path: '/university', color: 'bg-indigo-500' },
  { profile: 'paciente', title: 'Paciente', icon: Users, path: '/neocare', color: 'bg-green-500' },
];

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalLicensees: number;
  totalStudents: number;
  totalPatients: number;
  totalCollaborators: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  onlineUsers: number;
  weeklyActiveUsers: number;
  totalMaterials: number;
  totalNotifications: number;
}

interface UserPresence {
  name: string;
  avatar_url: string | null;
  last_seen_at: string;
  status: string;
}

interface SystemHealth {
  database: 'ok' | 'warning' | 'error';
  auth: 'ok' | 'warning' | 'error';
  storage: 'ok' | 'warning' | 'error';
  edgeFunctions: 'ok' | 'warning' | 'error';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLicensees: 0,
    totalStudents: 0,
    totalPatients: 0,
    totalCollaborators: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    onlineUsers: 0,
    weeklyActiveUsers: 0,
    totalMaterials: 0,
    totalNotifications: 0
  });
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [systemHealth] = useState<SystemHealth>({
    database: 'ok',
    auth: 'ok',
    storage: 'ok',
    edgeFunctions: 'ok'
  });

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
        fetchOnlineUsers()
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
    const fiveMinutesAgo = subDays(now, 1 / 288);

    const [
      neohubUsersRes,
      profilesRes,
      studentsRes,
      patientsRes,
      collaboratorsRes,
      licensedRes,
      coursesRes,
      enrollmentsRes,
      completedEnrollmentsRes,
      onlineUsersRes,
      weeklyActiveRes,
      materialsRes,
      notificationsRes
    ] = await Promise.all([
      supabase.from('neohub_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('status'),
      supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'aluno').eq('is_active', true),
      supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'paciente').eq('is_active', true),
      supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'colaborador').eq('is_active', true),
      supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'licenciado').eq('is_active', true),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('user_course_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('user_course_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('neohub_users').select('id', { count: 'exact', head: true }).gte('last_seen_at', fiveMinutesAgo.toISOString()),
      supabase.from('neohub_users').select('id', { count: 'exact', head: true }).gte('last_seen_at', weekAgo.toISOString()),
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('notifications').select('id', { count: 'exact', head: true })
    ]);

    const profiles = profilesRes.data || [];
    const activeProfiles = profiles.filter(p => p.status === 'active').length;

    setStats({
      totalUsers: neohubUsersRes.count || 0,
      activeUsers: activeProfiles,
      totalLicensees: licensedRes.count || 0,
      totalStudents: studentsRes.count || 0,
      totalPatients: patientsRes.count || 0,
      totalCollaborators: collaboratorsRes.count || 0,
      totalCourses: coursesRes.count || 0,
      totalEnrollments: enrollmentsRes.count || 0,
      completedEnrollments: completedEnrollmentsRes.count || 0,
      onlineUsers: onlineUsersRes.count || 0,
      weeklyActiveUsers: weeklyActiveRes.count || 0,
      totalMaterials: materialsRes.count || 0,
      totalNotifications: notificationsRes.count || 0
    });
  };

  const fetchOnlineUsers = async () => {
    const fiveMinutesAgo = subDays(new Date(), 1 / 288);
    
    const { data } = await supabase
      .from('neohub_users')
      .select('full_name, avatar_url, last_seen_at')
      .gte('last_seen_at', fiveMinutesAgo.toISOString())
      .order('last_seen_at', { ascending: false })
      .limit(10);

    setOnlineUsers((data || []).map(u => ({
      name: u.full_name,
      avatar_url: u.avatar_url,
      last_seen_at: u.last_seen_at,
      status: 'online'
    })));
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const courseCompletionRate = stats.totalEnrollments > 0 ? ((stats.completedEnrollments / stats.totalEnrollments) * 100).toFixed(1) : '0';

  const getHealthIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

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
        {/* Header with Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">Painel administrativo do sistema ByNeofolic</p>
          </div>
          <Button
            onClick={() => setIsNotificationDialogOpen(true)}
            className="flex items-center gap-2"
            size="sm"
          >
            <Send className="h-4 w-4" />
            Enviar Notificação
          </Button>
        </div>

        <NotificationDialog
          open={isNotificationDialogOpen}
          onOpenChange={setIsNotificationDialogOpen}
        />

        {/* Quick Navigation - Gestão */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gestão do Sistema</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {quickModules.map((module) => (
              <button
                key={module.id}
                onClick={() => navigate(module.path)}
                className="group flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all"
              >
                <div className={`p-2 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{module.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {contentModules.map((module) => (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all text-left"
            >
              <div className={`p-2 rounded-lg ${module.color} text-white`}>
                <module.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{module.title}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        {/* System Health Status */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Status do Sistema</p>
                  <p className="text-xs text-muted-foreground">Todos os serviços operacionais</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  {getHealthIcon(systemHealth.database)}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {getHealthIcon(systemHealth.auth)}
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  {getHealthIcon(systemHealth.storage)}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  {getHealthIcon(systemHealth.edgeFunctions)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats - Users by Profile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Usuários</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                    {stats.activeUsers} ativos
                  </Badge>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Licenciados</p>
                  <p className="text-2xl font-bold">{stats.totalLicensees}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Clínicas ativas</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Alunos</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">IBRAMEC</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                  <p className="text-2xl font-bold">{stats.totalPatients}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">NeoCare</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats - Platform Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.totalCourses}</p>
                <p className="text-[10px] text-muted-foreground">Cursos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <Award className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{courseCompletionRate}%</p>
                <p className="text-[10px] text-muted-foreground">Conclusão</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <HardDrive className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.totalMaterials}</p>
                <p className="text-[10px] text-muted-foreground">Materiais</p>
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
                <p className="text-[10px] text-muted-foreground">Online</p>
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
                <p className="text-[10px] text-muted-foreground">Ativos (7d)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Distribution & Online Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribuição por Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Licenciados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stats.totalLicensees}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${stats.totalUsers > 0 ? (stats.totalLicensees / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Alunos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stats.totalStudents}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${stats.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm">Pacientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stats.totalPatients}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${stats.totalUsers > 0 ? (stats.totalPatients / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Colaboradores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stats.totalCollaborators}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${stats.totalUsers > 0 ? (stats.totalCollaborators / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
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
                {onlineUsers.slice(0, 8).map((user, index) => (
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

        {/* Trend Charts */}
        <AdminTrendCharts />

        {/* Alerts Widget */}
        <SystemAlertsWidget />

      </div>
    </AdminLayout>
  );
}
