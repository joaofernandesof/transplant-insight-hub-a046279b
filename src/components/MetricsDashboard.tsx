import React, { useMemo } from 'react';
import { WeekData, generateWeeks2026 } from '@/data/metricsData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShoppingCart,
  XCircle,
  Activity,
  Bot,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  ThumbsUp,
  Minus,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDailyMetrics, DailyMetric } from '@/hooks/useDailyMetrics';

interface MetricsDashboardProps {
  weeks: WeekData[];
  currentWeekNumber: number;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  clinicName?: string;
  clinicId?: string;
}

// Indicadores-chave com diagnósticos
// Benchmarks de mercado para cada métrica (valores diários)
interface MarketBenchmark {
  ruim: string;
  medio: string;
  bom: string;
  otimo: string;
}

interface MetricConfig {
  id: string;
  nome: string;
  icon: typeof Users;
  color: string;
  goodDirection: 'up' | 'down';
  benchmark: MarketBenchmark;
  getDiagnosisFromAvg: (avg: number) => { status: 'danger' | 'warning' | 'neutral' | 'success'; text: string };
  getOrientation: (status: string) => string;
}

const metricsConfig: MetricConfig[] = [
  { 
    id: 'leads_novos', 
    nome: 'Leads Novos', 
    icon: Users,
    color: 'text-blue-600',
    goodDirection: 'up',
    benchmark: { ruim: '<30%', medio: '30–49%', bom: '50–69%', otimo: '≥70%' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg < 2) return { status: 'danger', text: 'Captação muito baixa.' };
      if (avg < 5) return { status: 'warning', text: 'Captação moderada.' };
      if (avg < 10) return { status: 'neutral', text: 'Volume aceitável.' };
      return { status: 'success', text: 'Excelente captação!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Revisar campanhas de marketing e formulários de captação.';
      if (status === 'warning') return 'Analisar fontes de tráfego e considerar aumentar investimento.';
      if (status === 'success') return 'Manter estratégia atual e escalar canais de melhor performance.';
      return 'Monitorar diariamente e garantir campanhas ativas.';
    }
  },
  { 
    id: 'agendamentos', 
    nome: 'Agendamentos', 
    icon: Calendar,
    color: 'text-amber-600',
    goodDirection: 'up',
    benchmark: { ruim: '≤2', medio: '3–5', bom: '6–10', otimo: '≥11' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg <= 0.5) return { status: 'danger', text: 'Sem agendamentos.' };
      if (avg <= 2) return { status: 'warning', text: 'Poucos agendamentos.' };
      if (avg < 5) return { status: 'neutral', text: 'Dentro do esperado.' };
      return { status: 'success', text: 'Ótima conversão!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Treinar equipe em técnicas de agendamento.';
      if (status === 'warning') return 'Aumentar follow-up com leads.';
      if (status === 'success') return 'Replicar abordagem bem-sucedida para toda a equipe.';
      return 'Continuar com rotina de follow-up.';
    }
  },
  { 
    id: 'vendas_realizadas', 
    nome: 'Vendas', 
    icon: ShoppingCart,
    color: 'text-pink-600',
    goodDirection: 'up',
    benchmark: { ruim: 'Queda', medio: 'Oscila', bom: 'Estável', otimo: 'Cresce' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg < 0.2) return { status: 'danger', text: 'Sem vendas.' };
      if (avg < 0.5) return { status: 'warning', text: 'Vendas baixas.' };
      if (avg < 1) return { status: 'neutral', text: 'Performance normal.' };
      return { status: 'success', text: 'Conversão excelente!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Revisar processo de fechamento e treinar objeções.';
      if (status === 'warning') return 'Acompanhar atendimentos e fazer coaching.';
      if (status === 'success') return 'Documentar técnicas e compartilhar com equipe.';
      return 'Manter acompanhamento dos leads em negociação.';
    }
  },
  { 
    id: 'tarefas_realizadas', 
    nome: 'Tarefas Realizadas', 
    icon: CheckCircle2,
    color: 'text-emerald-600',
    goodDirection: 'up',
    benchmark: { ruim: 'Baixo', medio: 'Médio', bom: 'Bom', otimo: 'Alto' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg < 2) return { status: 'danger', text: 'Poucas tarefas.' };
      if (avg < 5) return { status: 'warning', text: 'Produtividade moderada.' };
      if (avg < 10) return { status: 'neutral', text: 'Atividade normal.' };
      return { status: 'success', text: 'Alta produtividade!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Definir prioridades claras e metas diárias.';
      if (status === 'warning') return 'Aumentar foco nas atividades prioritárias.';
      if (status === 'success') return 'Reconhecer equipe produtiva.';
      return 'Manter rotina organizada com foco nas prioridades.';
    }
  },
  { 
    id: 'tarefas_atrasadas', 
    nome: 'Tarefas Atrasadas', 
    icon: AlertCircle,
    color: 'text-red-600',
    goodDirection: 'down',
    benchmark: { ruim: '>6', medio: '4–6', bom: '2–3,9', otimo: '1–1,9' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg > 6) return { status: 'danger', text: 'Acúmulo crítico.' };
      if (avg > 3) return { status: 'warning', text: 'Muitas pendências.' };
      if (avg > 1) return { status: 'neutral', text: 'Poucas pendências.' };
      return { status: 'success', text: 'Tudo em dia!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Priorizar resolução IMEDIATA. Delegar se necessário.';
      if (status === 'warning') return 'Identificar gargalos e redistribuir tarefas.';
      if (status === 'success') return 'Manter organização e controle de prazos.';
      return 'Resolver pendências antes de acumular.';
    }
  },
  { 
    id: 'mensagens_enviadas_atendente', 
    nome: 'Msgs Atendente', 
    icon: MessageSquare,
    color: 'text-green-600',
    goodDirection: 'up',
    benchmark: { ruim: '>15', medio: '10–15', bom: '7–9', otimo: '<7' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg < 5) return { status: 'danger', text: 'Pouca atividade.' };
      if (avg < 15) return { status: 'warning', text: 'Volume moderado.' };
      if (avg < 30) return { status: 'neutral', text: 'Volume normal.' };
      return { status: 'success', text: 'Alta atividade!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Verificar se equipe está ativa.';
      if (status === 'warning') return 'Aumentar volume de contatos.';
      return 'Manter ritmo de atendimento.';
    }
  },
  { 
    id: 'mensagens_enviadas_robo', 
    nome: 'Msgs Robô', 
    icon: Bot,
    color: 'text-teal-600',
    goodDirection: 'up',
    benchmark: { ruim: '<1%', medio: '1–1,59%', bom: '1,6–2,32%', otimo: '≥2,33%' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg < 10) return { status: 'warning', text: 'Automação baixa.' };
      if (avg < 50) return { status: 'neutral', text: 'Automação funcionando.' };
      return { status: 'success', text: 'Automação otimizada!' };
    },
    getOrientation: (status: string) => {
      if (status === 'warning') return 'Verificar integração do robô.';
      if (status === 'success') return 'Manter monitoramento.';
      return 'Monitorar automações e ajustar mensagens.';
    }
  },
  { 
    id: 'leads_descartados', 
    nome: 'Leads Descartados', 
    icon: XCircle,
    color: 'text-slate-600',
    goodDirection: 'down',
    benchmark: { ruim: '>8', medio: '5–8', bom: '3–4,9', otimo: '<3' },
    getDiagnosisFromAvg: (avg: number) => {
      if (avg > 8) return { status: 'danger', text: 'Descarte excessivo.' };
      if (avg > 5) return { status: 'warning', text: 'Alto descarte.' };
      if (avg > 2) return { status: 'neutral', text: 'Volume aceitável.' };
      return { status: 'success', text: 'Baixo descarte!' };
    },
    getOrientation: (status: string) => {
      if (status === 'danger') return 'Revisar qualificação de leads.';
      if (status === 'warning') return 'Analisar motivos de descarte.';
      return 'Manter registro dos motivos.';
    }
  },
];

export function MetricsDashboard({
  weeks,
  currentWeekNumber,
  getWeekValues,
  clinicName,
  clinicId
}: MetricsDashboardProps) {
  // Fetch daily metrics for the last 30 days to get 5 filled days
  const { dailyMetrics } = useDailyMetrics(clinicId);

  // Get last 5 days with data
  const last5DaysData = useMemo(() => {
    if (!dailyMetrics || dailyMetrics.length === 0) return [];
    
    // Sort by date descending and take first 5
    const sorted = [...dailyMetrics].sort((a, b) => 
      new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
    );
    
    // Take first 5 and reverse for chronological order (oldest first)
    return sorted.slice(0, 5).reverse();
  }, [dailyMetrics]);

  // Calculate metrics data from last 5 days
  const dailyMetricsData = useMemo(() => {
    if (last5DaysData.length === 0) return [];

    return metricsConfig.map(metric => {
      const values = last5DaysData.map(day => {
        const val = day[metric.id as keyof DailyMetric];
        return typeof val === 'number' ? val : 0;
      });
      
      const total = values.reduce((sum, v) => sum + v, 0);
      const avg = values.length > 0 ? total / values.length : 0;
      const current = values[values.length - 1] || 0;
      const previous = values[values.length - 2] || 0;
      const trend = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
      
      // Use average-based diagnosis
      const diagnosis = metric.getDiagnosisFromAvg(avg);
      const orientation = metric.getOrientation(diagnosis.status);

      return {
        ...metric,
        values,
        total,
        avg,
        current,
        previous,
        trend,
        diagnosis,
        orientation,
      };
    });
  }, [last5DaysData]);

  // Weekly data for charts
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = Math.max(1, currentWeekNumber - 6); i <= currentWeekNumber; i++) {
      const values = getWeekValues(i);
      data.push({
        week: `S${i}`,
        weekNumber: i,
        leads: Number(values.leads_novos) || 0,
        agendamentos: Number(values.agendamentos) || 0,
        vendas: Number(values.vendas_realizadas) || 0,
        tarefasAtrasadas: Number(values.tarefas_atrasadas) || 0,
        tarefasRealizadas: Number(values.tarefas_realizadas) || 0,
        mensagensAtendente: Number(values.mensagens_enviadas_atendente) || 0,
        mensagensRobo: Number(values.mensagens_enviadas_robo) || 0,
        leadsDescartados: Number(values.leads_descartados) || 0,
      });
    }
    return data;
  }, [currentWeekNumber, getWeekValues]);

  // Activity distribution for pie chart
  const activityDistribution = useMemo(() => {
    const total = weeklyData.reduce((acc, d) => ({
      tarefasRealizadas: acc.tarefasRealizadas + d.tarefasRealizadas,
      agendamentos: acc.agendamentos + d.agendamentos,
      vendas: acc.vendas + d.vendas,
      leads: acc.leads + d.leads,
    }), { tarefasRealizadas: 0, agendamentos: 0, vendas: 0, leads: 0 });

    return [
      { name: 'Leads', value: total.leads, color: '#3b82f6' },
      { name: 'Agendamentos', value: total.agendamentos, color: '#f59e0b' },
      { name: 'Vendas', value: total.vendas, color: '#ec4899' },
      { name: 'Tarefas', value: total.tarefasRealizadas, color: '#10b981' },
    ].filter(item => item.value > 0);
  }, [weeklyData]);

  // Conversion rate
  const conversionRate = useMemo(() => {
    const totalLeads = dailyMetricsData.find(m => m.id === 'leads_novos')?.total || 0;
    const totalVendas = dailyMetricsData.find(m => m.id === 'vendas_realizadas')?.total || 0;
    if (totalLeads === 0) return 0;
    return ((totalVendas / totalLeads) * 100).toFixed(1);
  }, [dailyMetricsData]);

  // Format date for display
  const formatDayDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const formatDayLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'EEE', { locale: ptBR });
  };

  const getDiagnosisBadge = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'; // Bom - Verde
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'; // Médio - Amarelo
      case 'danger': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'; // Ruim - Vermelho
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'; // Neutro - Cinza
    }
  };

  const getBenchmarkBadge = (type: 'ruim' | 'medio' | 'bom' | 'otimo') => {
    switch (type) {
      case 'ruim': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'medio': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'bom': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'otimo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-xl border border-border p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 sm:p-3 bg-primary/20 rounded-xl">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Dashboard de Performance</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Visão consolidada dos últimos 5 dias preenchidos • Semana atual: S{currentWeekNumber}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards - Top 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {dailyMetricsData.slice(0, 4).map(metric => {
          const Icon = metric.icon;
          const trendPositive = metric.goodDirection === 'up' ? metric.trend >= 0 : metric.trend <= 0;
          
          return (
            <Card key={metric.id} className={cn("border-l-4", metric.diagnosis.status === 'danger' ? 'border-l-red-500' : metric.diagnosis.status === 'warning' ? 'border-l-amber-500' : metric.diagnosis.status === 'success' ? 'border-l-emerald-500' : 'border-l-blue-500')}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">{metric.nome}</span>
                  <div className={cn("p-1.5 rounded-lg", metric.diagnosis.status === 'danger' ? 'bg-red-100 dark:bg-red-950/50' : metric.diagnosis.status === 'warning' ? 'bg-amber-100 dark:bg-amber-950/50' : metric.diagnosis.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-blue-100 dark:bg-blue-950/50')}>
                    <Icon className={cn("w-4 h-4", metric.color)} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{metric.current}</span>
                  <span className={cn(
                    "text-xs sm:text-sm font-medium flex items-center gap-0.5 mb-1",
                    trendPositive ? "text-emerald-600" : "text-red-600"
                  )}>
                    {metric.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(metric.trend).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Total 5 dias: {metric.total}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Evolução Semanal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução Semanal
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Leads, agendamentos e vendas ao longo das semanas
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                  <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#ec4899" fillOpacity={1} fill="url(#colorVendas)" strokeWidth={2} />
                  <Line type="monotone" dataKey="agendamentos" name="Agendamentos" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Atividades */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Distribuição de Atividades
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Proporção das métricas do período • Conversão: {conversionRate}%
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
              {activityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    >
                      {activityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sem dados suficientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Indicadores dos últimos 5 dias */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Indicadores dos Últimos 5 Dias
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Valores diários, diagnóstico e orientações para cada métrica
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-foreground sticky left-0 bg-muted z-10">Indicador</th>
                  {/* Day columns */}
                  {last5DaysData.map((day, idx) => {
                    const isLast = idx === last5DaysData.length - 1;
                    return (
                      <th 
                        key={day.metric_date}
                        className={cn(
                          "text-center px-2 py-2.5 font-semibold min-w-[65px]",
                          isLast ? "bg-primary/10" : ""
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-[10px] sm:text-xs", isLast ? "font-bold text-primary" : "text-foreground")}>
                            {formatDayDate(day.metric_date)}
                          </span>
                          <span className={cn("text-[8px] sm:text-[10px] capitalize", isLast ? "text-primary font-semibold" : "text-muted-foreground")}>
                            {isLast ? '(Atual)' : formatDayLabel(day.metric_date)}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center px-2 py-2.5 font-semibold text-foreground min-w-[220px]">
                    <div className="flex flex-col">
                      <span>Referência Mercado</span>
                      <div className="flex justify-center gap-1 mt-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">Ruim</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">Médio</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Bom</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Ótimo</span>
                      </div>
                    </div>
                  </th>
                  <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-foreground min-w-[140px]">Diagnóstico</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-foreground min-w-[180px]">Orientações</th>
                </tr>
              </thead>
              <tbody>
                {dailyMetricsData.length === 0 ? (
                  <tr>
                    <td colSpan={last5DaysData.length + 4} className="text-center py-8 text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhum dado diário registrado ainda.</p>
                    </td>
                  </tr>
                ) : (
                  dailyMetricsData.map((metric, idx) => {
                    const Icon = metric.icon;
                    
                    return (
                      <tr 
                        key={metric.id}
                        className={cn(
                          'border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors',
                          idx % 2 === 0 && 'bg-muted/10'
                        )}
                      >
                        <td className="px-3 sm:px-4 py-2.5 sticky left-0 bg-card z-10 border-r border-border">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4 flex-shrink-0", metric.color)} />
                            <span className="font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">{metric.nome}</span>
                          </div>
                        </td>
                        {/* Day values */}
                        {metric.values.map((value, dayIdx) => {
                          const isLast = dayIdx === metric.values.length - 1;
                          return (
                            <td 
                              key={dayIdx}
                              className={cn(
                                "text-center px-2 py-2.5",
                                isLast ? "bg-primary/5 font-bold" : ""
                              )}
                            >
                              <span className={cn(
                                "text-xs sm:text-sm",
                                isLast ? "font-bold text-foreground" : "text-foreground"
                              )}>
                                {value}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center px-2 py-2.5">
                          <div className="flex justify-center gap-1 flex-wrap">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", getBenchmarkBadge('ruim'))}>
                              {metric.benchmark.ruim}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", getBenchmarkBadge('medio'))}>
                              {metric.benchmark.medio}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", getBenchmarkBadge('bom'))}>
                              {metric.benchmark.bom}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", getBenchmarkBadge('otimo'))}>
                              {metric.benchmark.otimo}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-3 sm:px-4 py-2.5">
                          <span className={cn(
                            "inline-block px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap",
                            getDiagnosisBadge(metric.diagnosis.status)
                          )}>
                            {metric.diagnosis.text}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {metric.orientation}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}