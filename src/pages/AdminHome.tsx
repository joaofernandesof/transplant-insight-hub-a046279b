import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NotificationDialog from '@/components/NotificationDialog';
import {
  Users,
  Building2,
  GraduationCap,
  Award,
  Handshake,
  CreditCard,
  BarChart3,
  Settings,
  Eye,
  GitCompare,
  Flame,
  BookOpen,
  Megaphone,
  ShoppingBag,
  DollarSign,
  MessageCircle,
  Wrench,
  Briefcase,
  FileCheck,
  ChevronRight,
  Loader2,
  Activity,
  Bell,
  Send,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalLicensees: number;
  activeLicensees: number;
  pendingLicensees: number;
  totalLeads: number;
}

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  category: 'management' | 'licensee-modules' | 'analytics';
}

const adminModules: ModuleCard[] = [
  // Management
  {
    id: 'licensees',
    title: 'Gerenciar Licenciados',
    description: 'Cadastro, edição e controle de todos os licenciados',
    icon: <Users className="h-6 w-6" />,
    path: '/licensees',
    color: 'from-blue-500 to-blue-600',
    category: 'management'
  },
  {
    id: 'monitoring',
    title: 'Monitoramento de Usuários',
    description: 'Presença online e ranking de uso',
    icon: <Eye className="h-6 w-6" />,
    path: '/monitoring',
    color: 'from-cyan-500 to-cyan-600',
    category: 'management'
  },
  {
    id: 'admin-panel',
    title: 'Configurações do Sistema',
    description: 'Visibilidade de páginas, usuários e permissões',
    icon: <Settings className="h-6 w-6" />,
    path: '/admin',
    color: 'from-slate-500 to-slate-600',
    category: 'management'
  },
  {
    id: 'comparison',
    title: 'Comparar Clínicas',
    description: 'Ranking e benchmark entre todas as clínicas',
    icon: <GitCompare className="h-6 w-6" />,
    path: '/comparison',
    color: 'from-purple-500 to-purple-600',
    category: 'management'
  },
  {
    id: 'weekly-reports',
    title: 'Relatórios Semanais',
    description: 'Gerar e baixar relatórios em PDF',
    icon: <FileText className="h-6 w-6" />,
    path: '/weekly-reports',
    color: 'from-rose-500 to-rose-600',
    category: 'management'
  },
  {
    id: 'dashboard',
    title: 'Dashboard de Indicadores',
    description: 'Visualizar métricas de todas as clínicas',
    icon: <BarChart3 className="h-6 w-6" />,
    path: '/dashboard',
    color: 'from-emerald-500 to-emerald-600',
    category: 'analytics'
  },
  // Licensee Modules (Admin can edit)
  {
    id: 'hotleads',
    title: 'HotLeads',
    description: 'Gerenciar leads quentes de todas as clínicas',
    icon: <Flame className="h-6 w-6" />,
    path: '/hotleads',
    color: 'from-orange-500 to-red-500',
    category: 'licensee-modules'
  },
  {
    id: 'university',
    title: 'Universidade ByNeofolic',
    description: 'Gerenciar cursos e conteúdos de treinamento',
    icon: <GraduationCap className="h-6 w-6" />,
    path: '/university',
    color: 'from-indigo-500 to-indigo-600',
    category: 'licensee-modules'
  },
  {
    id: 'certificates',
    title: 'Certificados',
    description: 'Emitir e gerenciar certificações',
    icon: <Award className="h-6 w-6" />,
    path: '/certificates',
    color: 'from-amber-500 to-amber-600',
    category: 'licensee-modules'
  },
  {
    id: 'partners',
    title: 'Parceiros',
    description: 'Gerenciar rede de parceiros e fornecedores',
    icon: <Handshake className="h-6 w-6" />,
    path: '/partners',
    color: 'from-teal-500 to-teal-600',
    category: 'licensee-modules'
  },
  {
    id: 'materials',
    title: 'Central de Materiais',
    description: 'POPs, scripts e documentos',
    icon: <BookOpen className="h-6 w-6" />,
    path: '/materials',
    color: 'from-cyan-500 to-cyan-600',
    category: 'licensee-modules'
  },
  {
    id: 'marketing',
    title: 'Central de Marketing',
    description: 'Templates, campanhas e materiais promocionais',
    icon: <Megaphone className="h-6 w-6" />,
    path: '/marketing',
    color: 'from-pink-500 to-pink-600',
    category: 'licensee-modules'
  },
  {
    id: 'store',
    title: 'Loja Neo-Spa',
    description: 'Catálogo de produtos e pedidos',
    icon: <ShoppingBag className="h-6 w-6" />,
    path: '/store',
    color: 'from-violet-500 to-violet-600',
    category: 'licensee-modules'
  },
  {
    id: 'financial',
    title: 'Gestão Financeira',
    description: 'Relatórios financeiros dos licenciados',
    icon: <DollarSign className="h-6 w-6" />,
    path: '/financial',
    color: 'from-green-500 to-green-600',
    category: 'licensee-modules'
  },
  {
    id: 'license-payments',
    title: 'Pagamentos de Licença',
    description: 'Controle de taxas e mensalidades',
    icon: <CreditCard className="h-6 w-6" />,
    path: '/license-payments',
    color: 'from-rose-500 to-rose-600',
    category: 'licensee-modules'
  },
  {
    id: 'mentorship',
    title: 'Mentoria & Suporte',
    description: 'Agenda de mentorias e suporte',
    icon: <MessageCircle className="h-6 w-6" />,
    path: '/mentorship',
    color: 'from-sky-500 to-sky-600',
    category: 'licensee-modules'
  },
  {
    id: 'systems',
    title: 'Sistemas & Ferramentas',
    description: 'Acessos e integrações',
    icon: <Wrench className="h-6 w-6" />,
    path: '/systems',
    color: 'from-gray-500 to-gray-600',
    category: 'licensee-modules'
  },
  {
    id: 'career',
    title: 'Plano de Carreira',
    description: 'Trilhas e progressão dos licenciados',
    icon: <Briefcase className="h-6 w-6" />,
    path: '/career',
    color: 'from-lime-500 to-lime-600',
    category: 'licensee-modules'
  },
  {
    id: 'regularization',
    title: 'Regularização',
    description: 'Checklist de compliance e documentos',
    icon: <FileCheck className="h-6 w-6" />,
    path: '/regularization',
    color: 'from-red-500 to-red-600',
    category: 'licensee-modules'
  },
];

export default function AdminHome() {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLicensees: 0,
    activeLicensees: 0,
    pendingLicensees: 0,
    totalLeads: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [profilesRes, leadsRes] = await Promise.all([
        supabase.from('profiles').select('status'),
        supabase.from('leads').select('id', { count: 'exact', head: true })
      ]);

      const profiles = profilesRes.data || [];
      const active = profiles.filter(p => p.status === 'active').length;
      const pending = profiles.filter(p => p.status === 'pending').length;

      setStats({
        totalLicensees: profiles.length,
        activeLicensees: active,
        pendingLicensees: pending,
        totalLeads: leadsRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const managementModules = adminModules.filter(m => m.category === 'management');
  const analyticsModules = adminModules.filter(m => m.category === 'analytics');
  const licenseeModules = adminModules.filter(m => m.category === 'licensee-modules');

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
      <div className="p-6 pt-16 lg:pt-8 lg:p-8 max-w-7xl mx-auto overflow-x-hidden w-full">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground">
              Gerencie todos os aspectos do sistema ByNeofolic a partir deste painel.
            </p>
          </div>
          <Button
            onClick={() => setIsNotificationDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar Notificação
          </Button>
        </div>

        <NotificationDialog
          open={isNotificationDialogOpen}
          onOpenChange={setIsNotificationDialogOpen}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalLicensees}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Total Licenciados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.activeLicensees}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingLicensees}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500 text-white">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.totalLeads}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Leads Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Gestão do Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {managementModules.map((module) => (
              <Card 
                key={module.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                onClick={() => navigate(module.path)}
              >
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white`}>
                        {module.icon}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {analyticsModules.map((module) => (
              <Card 
                key={module.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                onClick={() => navigate(module.path)}
              >
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white`}>
                        {module.icon}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Licensee Modules Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Módulos dos Licenciados (Editar Conteúdo)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {licenseeModules.map((module) => (
              <Card 
                key={module.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border-border/50"
                onClick={() => navigate(module.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${module.color} text-white shrink-0`}>
                      {module.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground text-sm truncate">{module.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
