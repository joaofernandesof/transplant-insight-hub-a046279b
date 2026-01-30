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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4 lg:p-6 overflow-x-hidden w-full space-y-6">
      {/* Breadcrumb */}
      <GlobalBreadcrumb />
      
      {/* Portal Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800/80 to-blue-900/30 border border-slate-700/50 p-6">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Portal Administrativo</h1>
              <p className="text-slate-400">Bem-vindo, {user?.name?.split(' ')[0] || 'Administrador'}</p>
            </div>
          </div>
          <Button
            onClick={() => setIsNotificationDialogOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Notificação
          </Button>
        </div>
      </div>

      <NotificationDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
      />

      {/* Portais do NeoHub */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Portais do NeoHub</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
          {portals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => navigate(portal.path)}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-700/30 transition-all"
            >
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${portal.gradient} text-white shadow-lg`}>
                <portal.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-center leading-tight text-slate-300 group-hover:text-white">{portal.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Usuários</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 mt-1 inline-block">
                {stats.activeUsers} ativos
              </span>
            </div>
            <Users className="h-8 w-8 text-blue-400 opacity-80" />
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-l-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Online Agora</p>
              <p className="text-2xl font-bold text-white">{stats.onlineUsers}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 mt-1 inline-flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Ativos
              </span>
            </div>
            <Activity className="h-8 w-8 text-green-400 opacity-80" />
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Licenciados</p>
              <p className="text-2xl font-bold text-white">{stats.totalLicensees}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 mt-1 inline-block">
                Ativos
              </span>
            </div>
            <Award className="h-8 w-8 text-amber-400 opacity-80" />
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-l-xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Alunos</p>
              <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 mt-1 inline-block">
                Matriculados
              </span>
            </div>
            <GraduationCap className="h-8 w-8 text-indigo-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Acesso Rápido</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => navigate(mod.path)}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-700/30 transition-all bg-slate-800/30"
            >
              <div className={`p-3 rounded-xl ${mod.color} text-white shadow-md`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-center leading-tight text-slate-300 group-hover:text-white">{mod.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Usuários Online + Alertas */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Online Users */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Usuários Online</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
              {onlineUsers.length}
            </span>
          </div>
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Nenhum usuário online no momento
            </p>
          ) : (
            <div className="space-y-2">
              {onlineUsers.slice(0, 5).map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-slate-600">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-slate-700 text-slate-300">{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">
                      Visto há {format(new Date(u.last_seen_at), 'mm', { locale: ptBR })} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Alerts */}
        <SystemAlertsWidget />
      </div>

      {/* Trend Charts */}
      <AdminTrendCharts />
    </div>
  );
}
