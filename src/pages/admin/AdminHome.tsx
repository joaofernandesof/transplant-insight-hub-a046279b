/**
 * AdminHome - Dashboard principal do Portal Administrativo
 * Visão consolidada de métricas e acesso aos portais do ecossistema
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationDialog from '@/components/NotificationDialog';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { GlobalDashboard } from '@/components/admin/GlobalDashboard';
import {
  Users,
  Activity,
  Loader2,
  Shield,
  Send,
  GraduationCap,
  Heart,
  Stethoscope,
  Zap,
  Scale,
  CreditCard,
  Eye,
  Award,
  LayoutDashboard,
  BarChart3,
} from 'lucide-react';
import { subDays } from 'date-fns';
import { AdminTrendCharts } from '@/components/admin/AdminTrendCharts';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalLicensees: number;
  totalStudents: number;
  totalPatients: number;
  totalCollaborators: number;
  onlineUsers: number;
  weeklyActiveUsers: number;
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

export default function AdminHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
    onlineUsers: 0,
    weeklyActiveUsers: 0,
  });

  // Tab state from URL
  const activeTab = searchParams.get('tab') || 'global';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
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
        onlineUsersRes,
        weeklyActiveRes,
      ] = await Promise.all([
        supabase.from('neohub_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('status'),
        supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'aluno').eq('is_active', true),
        supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'paciente').eq('is_active', true),
        supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'colaborador').eq('is_active', true),
        supabase.from('neohub_user_profiles').select('id', { count: 'exact', head: true }).eq('profile', 'licenciado').eq('is_active', true),
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
        onlineUsers: onlineUsersRes.count || 0,
        weeklyActiveUsers: weeklyActiveRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
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

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 w-full justify-start">
          <TabsTrigger 
            value="global" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard Global
          </TabsTrigger>
          <TabsTrigger 
            value="portals" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Portais & Acesso Rápido
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard Global */}
        <TabsContent value="global" className="mt-6">
          <GlobalDashboard />
        </TabsContent>

        {/* Tab: Portais e Acesso Rápido (conteúdo original) */}
        <TabsContent value="portals" className="mt-6 space-y-6">
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

          {/* Stats Row - Métricas do Sistema */}
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

          {/* Gráficos de Tendência */}
          <AdminTrendCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
