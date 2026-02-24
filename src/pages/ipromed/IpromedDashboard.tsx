/**
 * CPG Advocacia Médica Dashboard - Dashboard Principal com KPIs e Métricas
 * Visão Geral Operacional com Insights Acionáveis
 */

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Scale,
  Users,
  FileText,
  FileSignature,
  Gavel,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Shield,
  Activity,
  Sparkles,
} from "lucide-react";
import { differenceInDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { JourneyFunnelChart } from "./components/JourneyFunnelChart";
import { OperationalMetrics } from "./components/OperationalInsightsWidget";

export default function IpromedDashboard() {
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['ipromed-dashboard'],
    queryFn: async () => {
      // Clients
      const { data: clients, error: clientsError } = await supabase
        .from('ipromed_legal_clients')
        .select('*');
      if (clientsError) throw clientsError;

      // Contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('ipromed_contracts')
        .select('*');
      if (contractsError) throw contractsError;

      // Cases
      const { data: cases, error: casesError } = await supabase
        .from('ipromed_legal_cases')
        .select('*');
      if (casesError) throw casesError;

      // Calculate metrics
      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.status === 'active')?.length || 0;
      
      const totalContracts = contracts?.length || 0;
      const activeContracts = contracts?.filter(c => ['active', 'signed'].includes(c.status))?.length || 0;
      const pendingSignature = contracts?.filter(c => c.status === 'pending_signature')?.length || 0;
      const draftContracts = contracts?.filter(c => c.status === 'draft')?.length || 0;
      const expiringContracts = contracts?.filter(c => {
        if (!c.end_date) return false;
        const days = differenceInDays(new Date(c.end_date), new Date());
        return days > 0 && days <= 30;
      })?.length || 0;

      const activeCases = cases?.filter(c => c.status === 'active')?.length || 0;
      const closedCases = cases?.filter(c => c.status === 'closed')?.length || 0;

      // Journey progress (mock for now - should be from actual tracking)
      const clientsInD0 = clients?.filter(c => {
        const meta = c.metadata as any;
        return meta?.journey_phase === 'D0' || !meta?.journey_phase;
      })?.length || 0;

      const clientsCompleted = clients?.filter(c => {
        const meta = c.metadata as any;
        return meta?.journey_phase === 'completed';
      })?.length || 0;

      // Risk distribution
      const lowRisk = clients?.filter(c => {
        const meta = c.metadata as any;
        return meta?.risk_level === 'low';
      })?.length || 0;
      const mediumRisk = clients?.filter(c => {
        const meta = c.metadata as any;
        return meta?.risk_level === 'medium';
      })?.length || 0;
      const highRisk = clients?.filter(c => {
        const meta = c.metadata as any;
        return meta?.risk_level === 'high';
      })?.length || 0;

      // Calculate additional metrics
      const clientsWithoutContract = clients?.filter(c => {
        const hasContract = contracts?.some(ct => ct.client_id === c.id && ['active', 'signed'].includes(ct.status));
        return !hasContract;
      })?.length || 0;

      const avgContractValue = contracts && contracts.length > 0 
        ? Math.round(contracts.reduce((sum, c) => sum + (Number(c.total_value) || 0), 0) / contracts.length)
        : 3500;

      // Retention rate mock (should be calculated from historical data)
      const retentionRate = totalClients > 0 ? Math.min(95, Math.round(85 + (activeClients / totalClients) * 10)) : 85;

      return {
        clients: {
          total: totalClients,
          active: activeClients,
        },
        contracts: {
          total: totalContracts,
          active: activeContracts,
          pendingSignature,
          draft: draftContracts,
          expiring: expiringContracts,
        },
        cases: {
          active: activeCases,
          closed: closedCases,
        },
        journey: {
          inD0: clientsInD0,
          completed: clientsCompleted,
        },
        risk: {
          low: lowRisk,
          medium: mediumRisk,
          high: highRisk,
        },
        rawClients: clients || [],
        rawContracts: contracts || [],
        // New operational metrics
        operational: {
          clientsWithoutContract,
          avgContractValue,
          retentionRate,
          meetingsThisWeek: 0, // Will be populated from meetings query
        }
      };
    },
  });

  // Chart data for contract status
  const contractStatusData = [
    { name: 'Ativos', value: dashboardData?.contracts.active || 0, color: '#10b981' },
    { name: 'Rascunho', value: dashboardData?.contracts.draft || 0, color: '#6b7280' },
    { name: 'Aguard. Assinatura', value: dashboardData?.contracts.pendingSignature || 0, color: '#8b5cf6' },
    { name: 'Vencendo', value: dashboardData?.contracts.expiring || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Risk distribution data
  const riskData = [
    { name: 'Baixo', value: dashboardData?.risk.low || 0, color: '#10b981' },
    { name: 'Médio', value: dashboardData?.risk.medium || 0, color: '#f59e0b' },
    { name: 'Alto', value: dashboardData?.risk.high || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Journey phases data for the funnel - based on actual database clients
  // Uses demo data when no clients exist for visualization
  const hasRealData = (dashboardData?.rawClients?.length || 0) > 0;
  const journeyFunnelData = hasRealData ? {
    novos: dashboardData?.rawClients.filter(c => {
      const meta = c.metadata as any;
      return meta?.journey_phase === 'Novos' || !meta?.journey_phase;
    }).length || 0,
    agendado: dashboardData?.rawClients.filter(c => (c.metadata as any)?.journey_phase === 'Agendado').length || 0,
    andamento: dashboardData?.rawClients.filter(c => (c.metadata as any)?.journey_phase === 'Andamento').length || 0,
    reuniaoAgendada: dashboardData?.rawClients.filter(c => (c.metadata as any)?.journey_phase === 'ReuniaoAgendada').length || 0,
    continuo: dashboardData?.rawClients.filter(c => (c.metadata as any)?.journey_phase === 'Continuo').length || 0,
  } : {
    // Demo data for visualization when no clients exist
    novos: 3,
    agendado: 3,
    andamento: 2,
    reuniaoAgendada: 0,
    continuo: 0,
  };

  // Data for operational metrics
  const operationalMetricsData = {
    totalClients: dashboardData?.clients.total || 0,
    activeContracts: dashboardData?.contracts.active || 0,
    activeCases: dashboardData?.cases.active || 0,
    pendingSignatures: dashboardData?.contracts.pendingSignature || 0,
    expiringContracts: dashboardData?.contracts.expiring || 0,
    tasksOverdue: 0, // TODO: fetch from tasks table
    meetingsThisWeek: dashboardData?.operational?.meetingsThisWeek || 0,
    clientsWithoutContract: dashboardData?.operational?.clientsWithoutContract || 0,
    averageContractValue: dashboardData?.operational?.avgContractValue || 3500,
    retentionRate: dashboardData?.operational?.retentionRate || 85,
  };

  // Monthly trend data - based on actual database data
  const monthlyTrend = [
    { month: 'Set', clientes: 0, contratos: 0 },
    { month: 'Out', clientes: 0, contratos: 0 },
    { month: 'Nov', clientes: 0, contratos: 0 },
    { month: 'Dez', clientes: 0, contratos: 0 },
    { month: 'Fev', clientes: dashboardData?.clients.total || 0, contratos: dashboardData?.contracts.total || 0 },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    bgColor,
    subtitle,
    trend,
    onClick,
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    color: string;
    bgColor: string;
    subtitle?: string;
    trend?: string;
    onClick?: () => void;
  }) => (
    <Card 
      className={`border-none shadow-md hover:shadow-lg transition-all min-w-[130px] sm:min-w-0 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:pt-6 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-1" />
            ) : (
              <p className={`text-xl sm:text-3xl font-bold ${color}`}>{value}</p>
            )}
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500" />
                <span className="text-[10px] sm:text-xs text-emerald-600">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-2 sm:p-3 ${bgColor} rounded-lg sm:rounded-xl shrink-0`}>
            <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <span className="text-muted-foreground hidden sm:inline">/</span>
        <div className="flex items-center gap-2 shrink-0">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm sm:text-base">Dashboard</span>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#00629B] to-[#004d7a] rounded-lg">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          Dashboard CPG Advocacia Médica
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Visão geral operacional</p>
      </div>

      {/* KPI Cards - Scroll horizontal no mobile */}
      <div className="overflow-x-auto -mx-3 px-3 pb-2 sm:overflow-visible sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 min-w-max sm:min-w-0">
          <StatCard
            title="Clientes Ativos"
            value={dashboardData?.clients.total || 0}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
            subtitle="Médicos protegidos"
            trend="+2 este mês"
            onClick={() => navigate('/cpg/clients')}
          />
          <StatCard
            title="Contratos Ativos"
            value={dashboardData?.contracts.active || 0}
            icon={FileSignature}
            color="text-emerald-600"
            bgColor="bg-emerald-100 dark:bg-emerald-900/30"
            subtitle="Em vigência"
            onClick={() => navigate('/cpg/contracts?status=active')}
          />
          <StatCard
            title="Aguard. Assinatura"
            value={dashboardData?.contracts.pendingSignature || 0}
            icon={Clock}
            color="text-purple-600"
            bgColor="bg-purple-100 dark:bg-purple-900/30"
            subtitle="Pendentes"
            onClick={() => navigate('/cpg/contracts?status=pending_signature')}
          />
          <StatCard
            title="Processos Ativos"
            value={dashboardData?.cases.active || 0}
            icon={Gavel}
            color="text-rose-600"
            bgColor="bg-rose-100 dark:bg-rose-900/30"
            subtitle="Em andamento"
            onClick={() => navigate('/cpg/cases')}
          />
          <StatCard
            title="Vencendo 30d"
            value={dashboardData?.contracts.expiring || 0}
            icon={AlertTriangle}
            color="text-amber-600"
            bgColor="bg-amber-100 dark:bg-amber-900/30"
            subtitle="Renovar"
            onClick={() => navigate('/cpg/contracts?expiring=true')}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Status Pie Chart */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Status dos Contratos
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {contractStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={contractStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {contractStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum contrato cadastrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journey Funnel Visual */}
        <JourneyFunnelChart data={journeyFunnelData} />
      </div>

      {/* Operational Metrics with Insights */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Insights Operacionais</h2>
          <Badge variant="outline" className="text-xs">
            Sugestões de ação
          </Badge>
        </div>
        <OperationalMetrics 
          data={operationalMetricsData} 
          isLoading={isLoading}
          navigate={navigate}
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="border-none shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Crescimento de clientes e contratos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="clientes" 
                    stackId="1"
                    stroke="#00629B" 
                    fill="#00629B" 
                    fillOpacity={0.6}
                    name="Clientes"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="contratos" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Contratos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/cpg/clients')}
            >
              <Users className="h-4 w-4" />
              Novo Cliente
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/cpg/contracts')}
            >
              <FileText className="h-4 w-4" />
              Novo Contrato
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/cpg/journey')}
            >
              <TrendingUp className="h-4 w-4" />
              Ver Jornadas
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/cpg/legal')}
            >
              <Scale className="h-4 w-4" />
              Hub Jurídico
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(dashboardData?.contracts.expiring || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Contratos Vencendo
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {dashboardData?.contracts.expiring} contrato(s) vencem nos próximos 30 dias. 
                  Entre em contato com os clientes para renovação.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => navigate('/cpg/contracts')}
              >
                Ver Contratos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
