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
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
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
  ChevronDown,
  Settings,
  BarChart3,
  Flame,
  GraduationCap,
  Building2,
  FileText,
  GitCompare,
  Calendar,
  Clock,
  Heart,
  Stethoscope,
  Megaphone,
  TrendingUp,
  Bot,
  Scale,
  CreditCard,
  Target,
} from 'lucide-react';
import { VisionIcon } from '@/components/icons/VisionIcon';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SystemAlertsWidget } from '@/components/admin/SystemAlertsWidget';
import { AdminTrendCharts } from '@/components/admin/AdminTrendCharts';
import { PortalBanner } from '@/components/shared/PortalBanner';

// Hierarchical module structure with individual colors per module
const moduleCategories = [
  {
    id: 'admin',
    title: 'Administração',
    description: 'Gestão de usuários, permissões e configurações globais',
    color: 'bg-blue-600',
    icon: Shield,
    modules: [
      { id: 'licensees', title: 'Alunos IBRAMEC', description: 'Gerenciar alunos', icon: Users, path: '/alunos', color: 'bg-blue-500' },
      { id: 'licensee-onboarding', title: 'Onboarding Licenciados', description: 'Integração de novos licenciados', icon: Award, path: '/admin/licensee-onboarding', color: 'bg-amber-500' },
      { id: 'monitoring', title: 'Monitoramento', description: 'Atividade de usuários', icon: Eye, path: '/monitoring', color: 'bg-teal-500' },
      { id: 'event-logs', title: 'Log de Eventos', description: 'Histórico do sistema', icon: Activity, path: '/admin/event-logs', color: 'bg-cyan-500' },
      { id: 'code-assistant', title: 'Assistente de Código', description: 'IA para análise técnica', icon: Bot, path: '/admin/code-assistant', color: 'bg-indigo-500' },
      { id: 'announcements', title: 'Anúncios', description: 'Banners e novidades', icon: Megaphone, path: '/admin/announcements', color: 'bg-rose-500' },
      { id: 'permissions', title: 'Permissões', description: 'Matriz de acessos', icon: Shield, path: '/admin', color: 'bg-violet-500' },
      { id: 'settings', title: 'Configurações', description: 'Parâmetros do sistema', icon: Settings, path: '/admin', color: 'bg-purple-500' },
    ]
  },
  {
    id: 'operations',
    title: 'Operação Clínica',
    description: 'Agenda, cirurgias e gestão do dia-a-dia',
    color: 'bg-teal-600',
    icon: Building2,
    modules: [
      { id: 'surgery', title: 'Agenda de Cirurgias', description: 'Calendário cirúrgico', icon: Calendar, path: '/admin/surgery-schedule', color: 'bg-rose-500' },
      { id: 'neoteam', title: 'NeoTeam', description: 'Painel colaboradores', icon: Users, path: '/neoteam', color: 'bg-cyan-500' },
      { id: 'waiting', title: 'Sala de Espera', description: 'Fila de atendimento', icon: Clock, path: '/neoteam/waiting-room', color: 'bg-amber-500' },
    ]
  },
  {
    id: 'commercial',
    title: 'Comercial & Vendas',
    description: 'CRM, leads e funil de vendas',
    color: 'bg-green-600',
    icon: DollarSign,
    modules: [
      { id: 'crm', title: 'CRM Vendas', description: 'Gestão comercial', icon: DollarSign, path: '/crm', color: 'bg-emerald-500' },
      { id: 'hotleads', title: 'HotLeads', description: 'Leads quentes', icon: Flame, path: '/hotleads', color: 'bg-orange-500' },
      { id: 'referrals', title: 'Indicações', description: 'Programa de indicação', icon: Users, path: '/admin/referrals', color: 'bg-green-500' },
      { id: 'consolidated', title: 'Resultados', description: 'VGV e métricas', icon: BarChart3, path: '/consolidated-results', color: 'bg-indigo-500' },
    ]
  },
  {
    id: 'analytics',
    title: 'Análises & Relatórios',
    description: 'Dashboards, indicadores e exportações',
    color: 'bg-purple-600',
    icon: BarChart3,
    modules: [
      { id: 'dashboard', title: 'Indicadores', description: 'Métricas diárias', icon: BarChart3, path: '/dashboard', color: 'bg-sky-500' },
      { id: 'comparison', title: 'Comparar Clínicas', description: 'Benchmark unidades', icon: GitCompare, path: '/comparison', color: 'bg-pink-500' },
      { id: 'reports', title: 'Relatórios Semanais', description: 'PDF por licenciado', icon: FileText, path: '/weekly-reports', color: 'bg-lime-500' },
    ]
  },
  {
    id: 'education',
    title: 'Educação & Conteúdo',
    description: 'Cursos, materiais e certificações',
    color: 'bg-indigo-600',
    icon: GraduationCap,
    modules: [
      { id: 'university', title: 'Universidade', description: 'Cursos e aulas', icon: GraduationCap, path: '/university', color: 'bg-fuchsia-500' },
      { id: 'materials', title: 'Central de Materiais', description: 'POPs e scripts', icon: FileText, path: '/materials', color: 'bg-teal-500' },
      { id: 'exams', title: 'Provas', description: 'Avaliações alunos', icon: BookOpen, path: '/exams', color: 'bg-blue-500' },
      { id: 'surveys', title: 'Pesquisas', description: 'Satisfação turmas', icon: FileText, path: '/academy/admin/surveys', color: 'bg-emerald-500' },
    ]
  },
  {
    id: 'infrastructure',
    title: 'Infraestrutura',
    description: 'Monitoramento técnico e integrações',
    color: 'bg-slate-600',
    icon: Server,
    modules: [
      { id: 'sentinel', title: 'System Sentinel', description: 'Uptime e alertas', icon: Activity, path: '/admin/sentinel', color: 'bg-gray-500' },
      { id: 'api', title: 'API Docs', description: 'Documentação', icon: Zap, path: '/api-docs', color: 'bg-yellow-500' },
    ]
  },
];
// Profile quick access for admin to view system as different profiles
const profileAccess = [
  { profile: 'licenciado', title: 'Licenciado', description: 'Dono de clínica', icon: Award, path: '/neolicense', color: 'bg-amber-500' },
  { profile: 'colaborador', title: 'Colaborador', description: 'Equipe clínica', icon: Users, path: '/neoteam', color: 'bg-blue-500' },
  { profile: 'medico', title: 'Médico', description: 'Visão clínica', icon: Stethoscope, path: '/neoteam/doctor-view', color: 'bg-cyan-500' },
  { profile: 'aluno', title: 'Aluno', description: 'IBRAMEC', icon: GraduationCap, path: '/academy', color: 'bg-indigo-500' },
  { profile: 'paciente', title: 'Paciente', description: 'NeoCare', icon: Heart, path: '/neocare', color: 'bg-emerald-500' },
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 overflow-x-hidden w-full space-y-6">
        {/* Breadcrumb */}
        <GlobalBreadcrumb />
        
        {/* Portal Banner */}
        <PortalBanner
          portal="admin"
          userName={user?.name}
          icon={<Shield className="h-6 w-6 text-white" />}
          rightContent={
            <Button
              onClick={() => setIsNotificationDialogOpen(true)}
              variant="secondary"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
          }
        />

        <NotificationDialog
          open={isNotificationDialogOpen}
          onOpenChange={setIsNotificationDialogOpen}
        />

        {/* Portals Quick Access Widget */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Portais do NeoHub
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {[
                { id: 'academy', title: 'Aluno', icon: GraduationCap, gradient: 'from-emerald-500 to-green-600', path: '/academy' },
                { id: 'license', title: 'Licenciado', icon: Award, gradient: 'from-amber-400 to-yellow-500', path: '/neolicense' },
                { id: 'patient', title: 'Paciente', icon: Heart, gradient: 'from-rose-500 to-pink-600', path: '/neocare' },
                { id: 'staff', title: 'Colaborador', icon: Users, gradient: 'from-blue-500 to-cyan-600', path: '/neoteam' },
                { id: 'doctor', title: 'Médico', icon: Stethoscope, gradient: 'from-teal-500 to-cyan-600', path: '/neoteam/doctor-view' },
                { id: 'avivar', title: 'Avivar', icon: TrendingUp, gradient: 'from-purple-500 to-violet-600', path: '/avivar' },
                { id: 'ipromed', title: 'IPROMED', icon: Scale, gradient: 'from-blue-600 to-indigo-700', path: '/ipromed' },
                { id: 'vision', title: 'Vision', icon: VisionIcon, gradient: 'from-pink-500 via-rose-500 to-orange-500', path: '/vision' },
                { id: 'neopay', title: 'NeoPay', icon: CreditCard, gradient: 'from-green-500 to-emerald-600', path: '/neopay' },
                { id: 'neocrm', title: 'NeoCRM', icon: Target, gradient: 'from-orange-500 to-red-500', path: '/neocrm' },
              ].map((portal) => (
                <button
                  key={portal.id}
                  onClick={() => navigate(portal.path)}
                  className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-background/50 transition-all"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${portal.gradient} text-white shadow-lg`}>
                    <portal.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight group-hover:text-primary">{portal.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Grid - All modules as buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {moduleCategories.flatMap((cat) => 
                cat.modules.map((mod) => (
                  <button
                    key={`${cat.id}-${mod.id}`}
                    onClick={() => navigate(mod.path)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all bg-muted/30"
                  >
                    <div className={`p-3.5 rounded-xl ${mod.color} text-white shadow-md`}>
                      <mod.icon className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight group-hover:text-primary">{mod.title}</span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>


        {/* Stats Row */}
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
  );
}
