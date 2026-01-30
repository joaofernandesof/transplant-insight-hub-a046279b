/**
 * AdminHome - Dashboard principal do Portal Administrativo
 * Visão consolidada de todos os portais do ecossistema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Shield,
  CheckCircle,
  Send,
  ChevronRight,
  Settings,
  BarChart3,
  GraduationCap,
  Heart,
  Stethoscope,
  TrendingUp,
  Zap,
  Scale,
  CreditCard,
  Calendar,
  Flame,
} from 'lucide-react';
import { VisionIcon } from '@/components/icons/VisionIcon';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SystemAlertsWidget } from '@/components/admin/SystemAlertsWidget';
import { AdminTrendCharts } from '@/components/admin/AdminTrendCharts';
import { PortalBanner } from '@/components/shared/PortalBanner';

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
}

interface UserPresence {
  name: string;
  avatar_url: string | null;
  last_seen_at: string;
  status: string;
}

// Portais do ecossistema
const portals = [
  { id: 'academy', title: 'Aluno', icon: GraduationCap, gradient: 'from-emerald-500 to-green-600', path: '/academy', description: 'Portal educacional' },
  { id: 'license', title: 'Licenciado', icon: Award, gradient: 'from-amber-400 to-yellow-500', path: '/neolicense', description: 'Gestão de licenças' },
  { id: 'patient', title: 'Paciente', icon: Heart, gradient: 'from-rose-500 to-pink-600', path: '/neocare', description: 'Portal do paciente' },
  { id: 'staff', title: 'Colaborador', icon: Users, gradient: 'from-blue-500 to-cyan-600', path: '/neoteam', description: 'Equipe clínica' },
  { id: 'doctor', title: 'Médico', icon: Stethoscope, gradient: 'from-teal-500 to-cyan-600', path: '/neoteam/doctor-view', description: 'Visão clínica' },
  { id: 'avivar', title: 'Avivar', icon: Zap, gradient: 'from-purple-500 to-violet-600', path: '/avivar', description: 'CRM & Marketing IA' },
  { id: 'ipromed', title: 'IPROMED', icon: Scale, gradient: 'from-blue-600 to-indigo-700', path: '/ipromed', description: 'Portal jurídico' },
  { id: 'vision', title: 'Vision', icon: Eye, gradient: 'from-pink-500 to-rose-500', path: '/vision', description: 'Análise capilar' },
  { id: 'neopay', title: 'NeoPay', icon: CreditCard, gradient: 'from-green-500 to-emerald-600', path: '/neopay', description: 'Gateway pagamentos' },
];

// Módulos rápidos
const quickModules = [
  { id: 'surgery', title: 'Agenda Cirurgias', icon: Calendar, path: '/admin/surgery-schedule', color: 'bg-rose-500' },
  { id: 'hotleads', title: 'HotLeads', icon: Flame, path: '/avivar/hotleads', color: 'bg-orange-500' },
  { id: 'results', title: 'Resultados', icon: BarChart3, path: '/consolidated-results', color: 'bg-indigo-500' },
  { id: 'users', title: 'Usuários', icon: Users, path: '/admin', color: 'bg-blue-500' },
  { id: 'exams', title: 'Provas', icon: BookOpen, path: '/academy/exams', color: 'bg-purple-500' },
  { id: 'materials', title: 'Materiais', icon: BookOpen, path: '/neolicense/materials', color: 'bg-teal-500' },
];

export default function AdminHome() {
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
  });
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

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

      {/* Portais do NeoHub */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Portais do NeoHub
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
            {portals.map((portal) => (
              <button
                key={portal.id}
                onClick={() => navigate(portal.path)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-background/50 transition-all"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${portal.gradient} text-white shadow-lg`}>
                  <portal.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight group-hover:text-primary">{portal.title}</span>
              </button>
            ))}
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
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Online Agora</p>
                <p className="text-2xl font-bold">{stats.onlineUsers}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1 bg-green-100 text-green-700">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Ativos
                </Badge>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Licenciados</p>
                <p className="text-2xl font-bold">{stats.totalLicensees}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                  Ativos
                </Badge>
              </div>
              <Award className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Alunos</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                  Matriculados
                </Badge>
              </div>
              <GraduationCap className="h-8 w-8 text-indigo-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {quickModules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => navigate(mod.path)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all bg-muted/30"
              >
                <div className={`p-3 rounded-xl ${mod.color} text-white shadow-md`}>
                  <mod.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-center leading-tight group-hover:text-primary">{mod.title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuários Online + Alertas */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Online Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Usuários Online
              <Badge variant="secondary" className="ml-auto">{onlineUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {onlineUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário online no momento
              </p>
            ) : (
              <div className="space-y-2">
                {onlineUsers.slice(0, 5).map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Visto há {format(new Date(u.last_seen_at), 'mm', { locale: ptBR })} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <SystemAlertsWidget />
      </div>

      {/* Trend Charts */}
      <AdminTrendCharts />
    </div>
  );
}
