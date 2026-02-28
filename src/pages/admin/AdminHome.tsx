/**
 * AdminHome - Dashboard simplificado do Portal Administrativo
 * Botões de portais em cima + widgets de métricas por portal embaixo
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NotificationDialog from '@/components/NotificationDialog';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { useGlobalMetrics, formatNumber, formatCurrency, formatPercentage } from '@/hooks/useGlobalMetrics';
import {
  Users,
  Loader2,
  Shield,
  Send,
  GraduationCap,
  Heart,
  Zap,
  Scale,
  Eye,
  CreditCard,
  Flame,
  Building2,
  RefreshCw,
  Stethoscope,
  ChevronDown,
  ExternalLink,
  BarChart3,
  UserCog,
} from 'lucide-react';

// Portais do ecossistema
const portals = [
  { id: 'admin', title: 'Administrador', icon: Shield, gradient: 'from-slate-500 to-slate-700', path: '/admin-portal' },
  { id: 'academy', title: 'Academy', icon: GraduationCap, gradient: 'from-emerald-500 to-green-600', path: '/academy' },
  { id: 'neolicense', title: 'NeoLicense', icon: Building2, gradient: 'from-amber-400 to-yellow-500', path: '/neolicense' },
  { id: 'neocare', title: 'NeoCare', icon: Heart, gradient: 'from-rose-500 to-pink-600', path: '/neocare' },
  { id: 'neoteam', title: 'NeoTeam', icon: Users, gradient: 'from-blue-500 to-cyan-600', path: '/neoteam' },
  { id: 'doctor', title: 'Médico', icon: Stethoscope, gradient: 'from-teal-500 to-cyan-600', path: '/neoteam/doctor-view' },
  { id: 'avivar', title: 'Avivar', icon: Zap, gradient: 'from-purple-500 to-violet-600', path: '/avivar' },
  { id: 'ipromed', title: 'CPG Advocacia', icon: Scale, gradient: 'from-blue-600 to-indigo-700', path: '/cpg' },
  { id: 'vision', title: 'Vision', icon: Eye, gradient: 'from-pink-500 to-rose-500', path: '/vision' },
  { id: 'neopay', title: 'NeoPay', icon: CreditCard, gradient: 'from-green-500 to-emerald-600', path: '/neopay' },
  { id: 'hotleads', title: 'HotLeads', icon: Flame, gradient: 'from-orange-500 to-red-600', path: '/hotleads' },
  { id: 'neorh', title: 'NeoRH', icon: UserCog, gradient: 'from-indigo-500 to-blue-600', path: '/neorh' },
];

// Cores dos portais para widgets
const PORTAL_BORDER_COLORS: Record<string, string> = {
  admin: 'border-l-slate-500',
  neocare: 'border-l-rose-500',
  neoteam: 'border-l-blue-500',
  doctor: 'border-l-teal-500',
  academy: 'border-l-emerald-500',
  neolicense: 'border-l-amber-500',
  hotleads: 'border-l-orange-500',
  avivar: 'border-l-purple-500',
  ipromed: 'border-l-indigo-500',
  vision: 'border-l-pink-500',
  neopay: 'border-l-green-500',
  neorh: 'border-l-indigo-500',
};

const PORTAL_ICON_COLORS: Record<string, string> = {
  admin: 'text-slate-400',
  neocare: 'text-rose-400',
  neoteam: 'text-blue-400',
  doctor: 'text-teal-400',
  academy: 'text-emerald-400',
  neolicense: 'text-amber-400',
  hotleads: 'text-orange-400',
  avivar: 'text-purple-400',
  ipromed: 'text-indigo-400',
  vision: 'text-pink-400',
  neopay: 'text-green-400',
  neorh: 'text-indigo-400',
};

const PORTAL_ICONS: Record<string, React.ElementType> = {
  admin: Shield,
  neocare: Heart,
  neoteam: Users,
  doctor: Stethoscope,
  academy: GraduationCap,
  neolicense: Building2,
  hotleads: Flame,
  avivar: Zap,
  ipromed: Scale,
  vision: Eye,
  neopay: CreditCard,
  neorh: UserCog,
};

export default function AdminHome() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const { metrics, isLoading, refresh } = useGlobalMetrics();

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-3 lg:p-4 overflow-x-hidden w-full space-y-4">
      <GlobalBreadcrumb />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 via-slate-800/80 to-blue-900/30 border border-slate-700/50 p-4">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Portal Administrativo</h1>
              <p className="text-sm text-slate-400">Bem-vindo, {user?.name?.split(' ')[0] || 'Administrador'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
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
      </div>

      <NotificationDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
      />

      {/* ====== PORTAIS ====== */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Portais do NeoHub</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {portals.map((portal) => (
            <button
              key={portal.id}
              onClick={() => navigate(portal.path)}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-700/30 transition-all"
            >
              <div className={`p-3.5 rounded-xl bg-gradient-to-br ${portal.gradient} text-white shadow-lg`}>
                <portal.icon className="h-7 w-7" />
              </div>
              <span className="text-xs font-medium text-center leading-tight text-slate-300 group-hover:text-white">{portal.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ====== WIDGETS DE MÉTRICAS POR PORTAL ====== */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Academy */}
          <PortalWidget
            id="academy"
            title="Academy IBRAMEC"
            onClick={() => navigate('/academy')}
            metrics={[
              { label: 'Alunos', value: formatNumber(metrics.academy.totalStudents) },
              { label: 'Cursos Ativos', value: formatNumber(metrics.academy.activeCourses) },
              { label: 'Matrículas/Mês', value: formatNumber(metrics.academy.enrollmentsThisMonth) },
              { label: 'Taxa Aprovação', value: `${metrics.academy.examPassRate}%` },
            ]}
          />

          {/* Avivar */}
          <PortalWidget
            id="avivar"
            title="Avivar CRM"
            onClick={() => navigate('/avivar')}
            metrics={[
              { label: 'Leads Total', value: formatNumber(metrics.avivar.totalLeads) },
              { label: 'Leads/Mês', value: formatNumber(metrics.avivar.leadsThisMonth) },
              { label: 'Conversão', value: `${metrics.avivar.conversionRate}%` },
              { label: 'Agentes IA', value: formatNumber(metrics.avivar.totalAgents) },
            ]}
          />

          {/* NeoCare */}
          <PortalWidget
            id="neocare"
            title="NeoCare"
            onClick={() => navigate('/neocare')}
            metrics={[
              { label: 'Pacientes', value: formatNumber(metrics.neocare.totalPatients) },
              { label: 'Cirurgias Agendadas', value: formatNumber(metrics.neocare.scheduledSurgeries) },
              { label: 'Realizadas', value: formatNumber(metrics.neocare.completedSurgeries) },
              { label: 'NPS', value: String(metrics.neocare.satisfactionScore) },
            ]}
          />

          {/* IPROMED / CPG */}
          <PortalWidget
            id="ipromed"
            title="CPG Advocacia"
            onClick={() => navigate('/cpg')}
            metrics={[
              { label: 'Casos Total', value: formatNumber(metrics.ipromed.totalCases) },
              { label: 'Em Aberto', value: formatNumber(metrics.ipromed.openCases) },
              { label: 'Encerrados', value: formatNumber(metrics.ipromed.closedCases) },
              { label: 'Urgentes', value: formatNumber(metrics.ipromed.urgentCases), highlight: true },
            ]}
          />

          {/* NeoTeam */}
          <PortalWidget
            id="neoteam"
            title="NeoTeam"
            onClick={() => navigate('/neoteam')}
            metrics={[
              { label: 'Colaboradores', value: formatNumber(metrics.neoteam.totalCollaborators) },
              { label: 'Agendamentos', value: formatNumber(metrics.neoteam.scheduledAppointments) },
              { label: 'Procedimentos', value: formatNumber(metrics.neoteam.completedProcedures) },
              { label: 'Tarefas Pendentes', value: formatNumber(metrics.neoteam.pendingTasks) },
            ]}
          />

          {/* HotLeads */}
          <PortalWidget
            id="hotleads"
            title="HotLeads"
            onClick={() => navigate('/hotleads')}
            metrics={[
              { label: 'Leads Total', value: formatNumber(metrics.summary.totalLeads) },
              { label: 'Conversão', value: formatPercentage(metrics.summary.conversionRate) },
              { label: 'Receita Total', value: formatCurrency(metrics.summary.totalRevenue) },
              { label: 'Pacientes', value: formatNumber(metrics.summary.totalPatients) },
            ]}
          />

          {/* NeoLicense */}
          <PortalWidget
            id="neolicense"
            title="NeoLicense"
            onClick={() => navigate('/neolicense')}
            metrics={[
              { label: 'Licenciados', value: formatNumber(metrics.portals.find(p => p.id === 'neolicense')?.totalUsers || 0) },
              { label: 'Ativos', value: formatNumber(metrics.portals.find(p => p.id === 'neolicense')?.activeUsers || 0) },
              { label: 'Trend', value: `${metrics.portals.find(p => p.id === 'neolicense')?.trend || 0}%` },
              { label: 'Atividade', value: formatNumber(metrics.portals.find(p => p.id === 'neolicense')?.recentActivity || 0) },
            ]}
          />

          {/* Vision */}
          <PortalWidget
            id="vision"
            title="Vision"
            onClick={() => navigate('/vision')}
            metrics={[
              { label: 'Usuários', value: formatNumber(metrics.portals.find(p => p.id === 'vision')?.totalUsers || 0) },
              { label: 'Ativos', value: formatNumber(metrics.portals.find(p => p.id === 'vision')?.activeUsers || 0) },
              { label: 'Trend', value: `${metrics.portals.find(p => p.id === 'vision')?.trend || 0}%` },
              { label: 'Atividade', value: formatNumber(metrics.portals.find(p => p.id === 'vision')?.recentActivity || 0) },
            ]}
          />

          {/* NeoPay */}
          <PortalWidget
            id="neopay"
            title="NeoPay"
            onClick={() => navigate('/neopay')}
            metrics={[
              { label: 'Usuários', value: formatNumber(metrics.portals.find(p => p.id === 'neopay')?.totalUsers || 0) },
              { label: 'Ativos', value: formatNumber(metrics.portals.find(p => p.id === 'neopay')?.activeUsers || 0) },
              { label: 'Trend', value: `${metrics.portals.find(p => p.id === 'neopay')?.trend || 0}%` },
              { label: 'Atividade', value: formatNumber(metrics.portals.find(p => p.id === 'neopay')?.recentActivity || 0) },
            ]}
          />

          {/* NeoRH */}
          <PortalWidget
            id="neorh"
            title="NeoRH"
            onClick={() => navigate('/neorh')}
            metrics={[
              { label: 'Colaboradores', value: formatNumber(metrics.portals.find(p => p.id === 'neorh')?.totalUsers || 0) },
              { label: 'Ativos', value: formatNumber(metrics.portals.find(p => p.id === 'neorh')?.activeUsers || 0) },
              { label: 'Trend', value: `${metrics.portals.find(p => p.id === 'neorh')?.trend || 0}%` },
              { label: 'Atividade', value: formatNumber(metrics.portals.find(p => p.id === 'neorh')?.recentActivity || 0) },
            ]}
          />
        </div>
      )}
    </div>
  );
}

// ====================================
// PortalWidget - Widget de métricas por portal
// ====================================
interface PortalWidgetProps {
  id: string;
  title: string;
  onClick: () => void;
  metrics: Array<{ label: string; value: string; highlight?: boolean }>;
}

function PortalWidget({ id, title, onClick, metrics }: PortalWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = PORTAL_ICONS[id] || Users;
  const iconColor = PORTAL_ICON_COLORS[id] || 'text-slate-400';
  const borderColor = PORTAL_BORDER_COLORS[id] || 'border-l-slate-500';

  return (
    <Card
      className={`bg-slate-800/50 border-slate-700/50 border-l-4 ${borderColor} hover:border-slate-600 cursor-pointer transition-all group`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">{title}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {metrics.map((m, i) => (
            <div key={i}>
              <p className="text-slate-400">{m.label}</p>
              <p className={`font-bold ${m.highlight ? 'text-amber-400' : 'text-white'}`}>{m.value}</p>
            </div>
          ))}
        </div>
        {expanded && (
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 text-xs"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Abrir Portal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 text-xs"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              <BarChart3 className="h-3.5 w-3.5 mr-2" />
              Ver Métricas Detalhadas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
