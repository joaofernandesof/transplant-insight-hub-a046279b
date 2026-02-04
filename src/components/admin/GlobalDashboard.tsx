/**
 * GlobalDashboard - Dashboard consolidado de todos os portais do NeoHub
 * Visão executiva para administradores
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalMetrics, formatCurrency, formatNumber, formatPercentage } from '@/hooks/useGlobalMetrics';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  GraduationCap,
  Heart,
  Zap,
  Scale,
  Eye,
  Award,
  Activity,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  MessageSquare,
  Stethoscope,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PORTAL_COLORS: Record<string, string> = {
  academy: '#10b981',
  neoteam: '#3b82f6',
  neocare: '#f43f5e',
  avivar: '#8b5cf6',
  ipromed: '#6366f1',
  vision: '#ec4899',
  neolicense: '#f59e0b',
};

const PORTAL_ICONS: Record<string, React.ElementType> = {
  academy: GraduationCap,
  neoteam: Users,
  neocare: Heart,
  avivar: Zap,
  ipromed: Scale,
  vision: Eye,
  neolicense: Award,
};

const PORTAL_PATHS: Record<string, string> = {
  academy: '/academy',
  neoteam: '/neoteam',
  neocare: '/neocare',
  avivar: '/avivar',
  ipromed: '/ipromed',
  vision: '/vision',
  neolicense: '/neolicense',
};

export function GlobalDashboard() {
  const navigate = useNavigate();
  const { metrics, isLoading, lastUpdated, refresh } = useGlobalMetrics();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">Carregando métricas globais...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-300">Não foi possível carregar as métricas</p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1 text-white">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-medium text-white">
                {entry.name.includes('Receita') ? formatCurrency(entry.value) : formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare pie chart data
  const portalDistribution = metrics.portals.map(p => ({
    name: p.name,
    value: p.totalUsers,
    color: PORTAL_COLORS[p.id] || '#6b7280',
  })).filter(p => p.value > 0);

  return (
    <div className="space-y-3">
      {/* Header com refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Visão Global do Ecossistema</h2>
          <p className="text-xs text-slate-400">
            Última atualização: {lastUpdated ? format(lastUpdated, "dd/MM 'às' HH:mm", { locale: ptBR }) : '-'}
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 h-7 text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* KPIs Globais - Compacto */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              <Badge variant="secondary" className="text-[9px] bg-green-500/20 text-green-400 px-1">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                +12%
              </Badge>
            </div>
            <p className="text-xl font-bold text-white">{formatNumber(metrics.summary.totalUsers)}</p>
            <p className="text-[10px] text-slate-400">Usuários Total</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <Activity className="h-4 w-4 text-green-400" />
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            </div>
            <p className="text-xl font-bold text-white">{formatNumber(metrics.summary.activeUsers24h)}</p>
            <p className="text-[10px] text-slate-400">Ativos 24h</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <Badge variant="secondary" className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1">
                VGV
              </Badge>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(metrics.summary.totalRevenue)}</p>
            <p className="text-[10px] text-slate-400">Receita Total</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <Target className="h-4 w-4 text-purple-400" />
              <Badge variant="secondary" className="text-[9px] bg-purple-500/20 text-purple-400 px-1">
                Leads
              </Badge>
            </div>
            <p className="text-xl font-bold text-white">{formatNumber(metrics.summary.totalLeads)}</p>
            <p className="text-[10px] text-slate-400">Total Leads</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <Heart className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-xl font-bold text-white">{formatNumber(metrics.summary.totalPatients)}</p>
            <p className="text-[10px] text-slate-400">Pacientes</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-white">{formatPercentage(metrics.summary.conversionRate)}</p>
            <p className="text-[10px] text-slate-400">Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-0.5 h-8">
          <TabsTrigger value="overview" className="text-xs h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="portals" className="text-xs h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Por Portal
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Tendências
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Saúde
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          {/* Atividade por Portal - Grid de Cards */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-3 w-3 text-blue-400" />
              <span className="text-xs font-medium text-white">Atividade por Portal</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {metrics.portals.map((portal) => {
                const Icon = PORTAL_ICONS[portal.id] || Users;
                return (
                  <div
                    key={portal.id}
                    className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all"
                    onClick={() => navigate(PORTAL_PATHS[portal.id] || '/')}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: `${PORTAL_COLORS[portal.id]}20` }}
                      >
                        <Icon className="h-3 w-3" style={{ color: PORTAL_COLORS[portal.id] }} />
                      </div>
                      <span className="text-xs font-medium text-white truncate">{portal.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{formatNumber(portal.totalUsers)} usuários</span>
                      <Badge
                        variant="secondary"
                        className={`text-[8px] px-1 py-0 h-4 ${portal.trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {portal.trend > 0 ? '+' : ''}{portal.trend}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métricas Específicas */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Academy */}
            <Card className="bg-slate-800/50 border-slate-700/50 border-l-4 border-l-emerald-500">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">Academy</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Alunos</p>
                    <p className="text-white font-bold">{metrics.academy.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Cursos</p>
                    <p className="text-white font-bold">{metrics.academy.activeCourses}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Matrículas/Mês</p>
                    <p className="text-white font-bold">{metrics.academy.enrollmentsThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Taxa Aprovação</p>
                    <p className="text-white font-bold">{metrics.academy.examPassRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avivar */}
            <Card className="bg-slate-800/50 border-slate-700/50 border-l-4 border-l-purple-500">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Avivar</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Leads Total</p>
                    <p className="text-white font-bold">{formatNumber(metrics.avivar.totalLeads)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Leads/Mês</p>
                    <p className="text-white font-bold">{metrics.avivar.leadsThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Conversão</p>
                    <p className="text-white font-bold">{metrics.avivar.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Agentes IA</p>
                    <p className="text-white font-bold">{metrics.avivar.totalAgents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NeoCare */}
            <Card className="bg-slate-800/50 border-slate-700/50 border-l-4 border-l-rose-500">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-rose-400" />
                  <span className="text-sm font-medium text-white">NeoCare</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Pacientes</p>
                    <p className="text-white font-bold">{metrics.neocare.totalPatients}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Cirurgias</p>
                    <p className="text-white font-bold">{metrics.neocare.scheduledSurgeries}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Realizadas</p>
                    <p className="text-white font-bold">{metrics.neocare.completedSurgeries}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">NPS</p>
                    <p className="text-white font-bold">{metrics.neocare.satisfactionScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IPROMED */}
            <Card className="bg-slate-800/50 border-slate-700/50 border-l-4 border-l-indigo-500">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">IPROMED</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Casos Total</p>
                    <p className="text-white font-bold">{metrics.ipromed.totalCases}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Em Aberto</p>
                    <p className="text-white font-bold">{metrics.ipromed.openCases}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Encerrados</p>
                    <p className="text-white font-bold">{metrics.ipromed.closedCases}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Urgentes</p>
                    <p className="text-amber-400 font-bold">{metrics.ipromed.urgentCases}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Portals Tab */}
        <TabsContent value="portals" className="mt-3 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {metrics.portals.map((portal) => {
              const Icon = PORTAL_ICONS[portal.id] || Users;
              return (
                <Card
                  key={portal.id}
                  className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all"
                  onClick={() => navigate(PORTAL_PATHS[portal.id] || '/')}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${PORTAL_COLORS[portal.id]}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: PORTAL_COLORS[portal.id] }} />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${portal.trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {portal.trend > 0 ? '+' : ''}{portal.trend}%
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{portal.name}</h3>
                    <p className="text-3xl font-bold text-white mb-3">{formatNumber(portal.totalUsers)}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Atividade recente</span>
                      <span className="text-white font-medium">{portal.recentActivity}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (portal.recentActivity / Math.max(1, portal.totalUsers)) * 100)} 
                      className="mt-2 h-1"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-4 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Users & Leads Trend */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Usuários & Leads (14 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics.trends}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="users" name="Usuários" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Receita Diária (14 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {metrics.health.status === 'healthy' ? (
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="text-lg font-bold text-white capitalize">{metrics.health.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">Uptime</p>
                    <p className="text-lg font-bold text-white">{metrics.health.uptime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-slate-400">Tempo Resposta</p>
                    <p className="text-lg font-bold text-white">{metrics.health.avgResponseTime}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="text-sm text-slate-400">Taxa de Erro</p>
                    <p className="text-lg font-bold text-white">{metrics.health.errorRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">Conexões Ativas por Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.portals.map((portal) => {
                  const Icon = PORTAL_ICONS[portal.id] || Users;
                  const percentage = metrics.summary.activeUsers24h > 0 
                    ? ((portal.activeUsers || portal.recentActivity) / metrics.summary.activeUsers24h) * 100 
                    : 0;
                  return (
                    <div key={portal.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: PORTAL_COLORS[portal.id] }} />
                          <span className="text-slate-300">{portal.name}</span>
                        </div>
                        <span className="text-white font-medium">{portal.recentActivity} conexões</span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
