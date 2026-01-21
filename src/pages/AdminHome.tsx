import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Send,
  FileText,
  Gift,
  LayoutDashboard
} from 'lucide-react';

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
    id: 'admin-dashboard',
    title: 'Dashboard Admin',
    description: 'Visão geral completa do sistema',
    icon: <LayoutDashboard className="h-6 w-6" />,
    path: '/admin-dashboard',
    color: 'from-primary to-primary/80',
    category: 'management'
  },
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
  // Analytics
  {
    id: 'dashboard',
    title: 'Dashboard de Indicadores',
    description: 'Visualizar métricas de todas as clínicas',
    icon: <BarChart3 className="h-6 w-6" />,
    path: '/dashboard',
    color: 'from-emerald-500 to-emerald-600',
    category: 'analytics'
  },
  {
    id: 'consolidated',
    title: 'Resultados Consolidados',
    description: 'Controle de vendas e indicadores de performance',
    icon: <BarChart3 className="h-6 w-6" />,
    path: '/consolidated-results',
    color: 'from-indigo-500 to-indigo-600',
    category: 'analytics'
  },
  {
    id: 'surgery-schedule',
    title: 'Agenda de Cirurgias',
    description: 'Gerenciar agenda e pacientes de cirurgia',
    icon: <Building2 className="h-6 w-6" />,
    path: '/surgery-schedule',
    color: 'from-teal-500 to-teal-600',
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
    title: 'Vitrine de Parceiros',
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
    id: 'estrutura-neo',
    title: 'Estrutura NEO',
    description: 'Modelo de negócio e estrutura da franquia',
    icon: <Building2 className="h-6 w-6" />,
    path: '/estrutura-neo',
    color: 'from-sky-500 to-sky-600',
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
    title: 'Financeiro Licença',
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
    title: 'Regularização da Clínica',
    description: 'Checklist de compliance e documentos',
    icon: <FileCheck className="h-6 w-6" />,
    path: '/regularization',
    color: 'from-red-500 to-red-600',
    category: 'licensee-modules'
  },
  {
    id: 'community',
    title: 'Comunidade',
    description: 'Conecte-se com outros licenciados',
    icon: <Users className="h-6 w-6" />,
    path: '/community',
    color: 'from-cyan-500 to-cyan-600',
    category: 'licensee-modules'
  },
  {
    id: 'achievements',
    title: 'Conquistas',
    description: 'Gamificação e pontos dos licenciados',
    icon: <Award className="h-6 w-6" />,
    path: '/achievements',
    color: 'from-amber-500 to-amber-600',
    category: 'licensee-modules'
  },
  {
    id: 'referral',
    title: 'Indique e Ganhe',
    description: 'Programa de indicação com comissões',
    icon: <Gift className="h-6 w-6" />,
    path: '/indique-e-ganhe',
    color: 'from-rose-500 to-rose-600',
    category: 'licensee-modules'
  },
];

export default function AdminHome() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
  }, [isAdmin]);

  const managementModules = adminModules.filter(m => m.category === 'management');
  const analyticsModules = adminModules.filter(m => m.category === 'analytics');
  const licenseeModules = adminModules.filter(m => m.category === 'licensee-modules');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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

      {/* Management Section - Compact Horizontal Buttons */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Gestão do Sistema
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[...managementModules, ...analyticsModules].map((module) => (
            <button 
              key={module.id}
              className="group flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 text-left"
              onClick={() => navigate(module.path)}
            >
              <div className={`p-1.5 rounded-md bg-gradient-to-br ${module.color} text-white shrink-0`}>
                <span className="[&>svg]:h-4 [&>svg]:w-4">{module.icon}</span>
              </div>
              <span className="text-xs font-medium text-foreground leading-tight line-clamp-2 flex-1">{module.title}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Licensee Modules Section */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Módulos dos Licenciados (Editar Conteúdo)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {licenseeModules.map((module) => (
            <Card 
              key={module.id}
              className="group cursor-pointer hover:shadow-md transition-all duration-300 overflow-hidden border-border/50"
              onClick={() => navigate(module.path)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color} text-white`}>
                      <span className="[&>svg]:h-4 [&>svg]:w-4">{module.icon}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-xs leading-tight line-clamp-2">{module.title}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{module.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
