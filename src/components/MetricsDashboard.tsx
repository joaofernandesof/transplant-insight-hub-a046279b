import React, { useMemo } from 'react';
import { WeekData, generateWeeks2026 } from '@/data/metricsData';
import { cn } from '@/lib/utils';
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
  ArrowRight,
  Target,
  Zap,
  AlertTriangle,
  ThumbsUp,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetricsDashboardProps {
  weeks: WeekData[];
  currentWeekNumber: number;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  clinicName?: string;
}

// Cores do gráfico
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

// Indicadores-chave 
const keyMetrics = [
  { id: 'leads_novos', nome: 'Leads Novos', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-500' },
  { id: 'agendamentos', nome: 'Agendamentos', icon: Calendar, color: 'text-amber-600', bgColor: 'bg-amber-500' },
  { id: 'vendas_realizadas', nome: 'Vendas', icon: ShoppingCart, color: 'text-pink-600', bgColor: 'bg-pink-500' },
  { id: 'tarefas_atrasadas', nome: 'Tarefas Atrasadas', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-500' },
];

export function MetricsDashboard({
  weeks,
  currentWeekNumber,
  getWeekValues,
  clinicName
}: MetricsDashboardProps) {
  // Calcular métricas das últimas 7 semanas
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
        mensagensEnviadas: (Number(values.mensagens_enviadas_atendente) || 0) + (Number(values.mensagens_enviadas_robo) || 0),
        mensagensRecebidas: Number(values.mensagens_recebidas) || 0,
        leadsDescartados: Number(values.leads_descartados) || 0,
        tempoUso: Number(values.tempo_uso_atendente) || 0,
      });
    }
    return data;
  }, [currentWeekNumber, getWeekValues]);

  // Calcular totais e tendências
  const totals = useMemo(() => {
    const currentWeekData = weeklyData[weeklyData.length - 1] || {};
    const previousWeekData = weeklyData[weeklyData.length - 2] || {};
    
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      leads: {
        current: currentWeekData.leads || 0,
        previous: previousWeekData.leads || 0,
        trend: calcTrend(currentWeekData.leads || 0, previousWeekData.leads || 0),
        total: weeklyData.reduce((acc, d) => acc + d.leads, 0)
      },
      agendamentos: {
        current: currentWeekData.agendamentos || 0,
        previous: previousWeekData.agendamentos || 0,
        trend: calcTrend(currentWeekData.agendamentos || 0, previousWeekData.agendamentos || 0),
        total: weeklyData.reduce((acc, d) => acc + d.agendamentos, 0)
      },
      vendas: {
        current: currentWeekData.vendas || 0,
        previous: previousWeekData.vendas || 0,
        trend: calcTrend(currentWeekData.vendas || 0, previousWeekData.vendas || 0),
        total: weeklyData.reduce((acc, d) => acc + d.vendas, 0)
      },
      tarefasAtrasadas: {
        current: currentWeekData.tarefasAtrasadas || 0,
        previous: previousWeekData.tarefasAtrasadas || 0,
        trend: calcTrend(currentWeekData.tarefasAtrasadas || 0, previousWeekData.tarefasAtrasadas || 0),
        total: weeklyData.reduce((acc, d) => acc + d.tarefasAtrasadas, 0)
      }
    };
  }, [weeklyData]);

  // Calcular taxa de conversão
  const conversionRate = useMemo(() => {
    const totalLeads = totals.leads.total;
    const totalVendas = totals.vendas.total;
    if (totalLeads === 0) return 0;
    return ((totalVendas / totalLeads) * 100).toFixed(1);
  }, [totals]);

  // Dados para gráfico de pizza (distribuição de atividades)
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

  // Gerar insights automáticos
  const insights = useMemo(() => {
    const insights: { type: 'success' | 'warning' | 'danger' | 'info'; title: string; message: string; action?: string }[] = [];
    
    // Análise de leads
    if (totals.leads.trend > 20) {
      insights.push({
        type: 'success',
        title: 'Leads em Alta! 🚀',
        message: `Crescimento de ${totals.leads.trend.toFixed(0)}% em leads esta semana.`,
        action: 'Aproveite o momento e intensifique o atendimento.'
      });
    } else if (totals.leads.trend < -20) {
      insights.push({
        type: 'warning',
        title: 'Queda em Leads',
        message: `Redução de ${Math.abs(totals.leads.trend).toFixed(0)}% em leads.`,
        action: 'Revise suas campanhas de marketing e fontes de tráfego.'
      });
    }

    // Análise de vendas
    if (totals.vendas.current > 0 && totals.vendas.trend > 0) {
      insights.push({
        type: 'success',
        title: 'Vendas Crescendo',
        message: `${totals.vendas.current} vendas esta semana, ${totals.vendas.trend.toFixed(0)}% a mais.`,
        action: 'Continue o bom trabalho no fechamento!'
      });
    } else if (totals.vendas.current === 0 && totals.leads.total > 5) {
      insights.push({
        type: 'danger',
        title: 'Nenhuma Venda',
        message: 'Você tem leads mas não fechou vendas esta semana.',
        action: 'Foque no follow-up e nas objeções dos clientes.'
      });
    }

    // Análise de tarefas atrasadas
    if (totals.tarefasAtrasadas.current > 5) {
      insights.push({
        type: 'danger',
        title: 'Atenção: Tarefas Atrasadas',
        message: `${totals.tarefasAtrasadas.current} tarefas estão atrasadas.`,
        action: 'Priorize a resolução para manter o fluxo saudável.'
      });
    } else if (totals.tarefasAtrasadas.current === 0) {
      insights.push({
        type: 'success',
        title: 'Parabéns!',
        message: 'Nenhuma tarefa atrasada. Operação fluindo bem!',
      });
    }

    // Taxa de conversão
    const rate = parseFloat(conversionRate);
    if (rate > 30) {
      insights.push({
        type: 'success',
        title: 'Conversão Excelente',
        message: `Taxa de ${rate}% de leads para vendas.`,
        action: 'Documente o que está funcionando para replicar.'
      });
    } else if (rate < 10 && totals.leads.total > 10) {
      insights.push({
        type: 'warning',
        title: 'Conversão Baixa',
        message: `Apenas ${rate}% dos leads estão convertendo.`,
        action: 'Revise seu script de vendas e qualificação de leads.'
      });
    }

    // Análise de agendamentos
    if (totals.agendamentos.current > 0 && totals.vendas.current === 0) {
      insights.push({
        type: 'info',
        title: 'Agendamentos Pendentes',
        message: `${totals.agendamentos.current} agendamentos, mas sem vendas ainda.`,
        action: 'Prepare-se para converter nas próximas consultas.'
      });
    }

    return insights.slice(0, 4); // Max 4 insights
  }, [totals, conversionRate]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return ThumbsUp;
      case 'warning': return AlertTriangle;
      case 'danger': return AlertCircle;
      default: return Info;
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
      case 'warning': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      case 'danger': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
      default: return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
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
              Visão consolidada das últimas 7 semanas • Semana atual: S{currentWeekNumber}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Leads Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Total de Leads</span>
              <div className="p-1.5 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{totals.leads.total}</span>
              <span className={cn(
                "text-xs sm:text-sm font-medium flex items-center gap-0.5 mb-1",
                totals.leads.trend >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {totals.leads.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(totals.leads.trend).toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {totals.leads.current} esta semana vs {totals.leads.previous} anterior
            </p>
          </CardContent>
        </Card>

        {/* Agendamentos Card */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Agendamentos</span>
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/50 rounded-lg">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{totals.agendamentos.total}</span>
              <span className={cn(
                "text-xs sm:text-sm font-medium flex items-center gap-0.5 mb-1",
                totals.agendamentos.trend >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {totals.agendamentos.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(totals.agendamentos.trend).toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {totals.agendamentos.current} esta semana
            </p>
          </CardContent>
        </Card>

        {/* Vendas Card */}
        <Card className="border-l-4 border-l-pink-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Vendas Realizadas</span>
              <div className="p-1.5 bg-pink-100 dark:bg-pink-950/50 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-pink-600" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{totals.vendas.total}</span>
              <span className={cn(
                "text-xs sm:text-sm font-medium flex items-center gap-0.5 mb-1",
                totals.vendas.trend >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {totals.vendas.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(totals.vendas.trend).toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Taxa de conversão: {conversionRate}%
            </p>
          </CardContent>
        </Card>

        {/* Tarefas Atrasadas Card */}
        <Card className={cn(
          "border-l-4",
          totals.tarefasAtrasadas.current > 5 
            ? "border-l-red-500" 
            : totals.tarefasAtrasadas.current > 0 
              ? "border-l-amber-500" 
              : "border-l-emerald-500"
        )}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">Tarefas Atrasadas</span>
              <div className={cn(
                "p-1.5 rounded-lg",
                totals.tarefasAtrasadas.current > 5 
                  ? "bg-red-100 dark:bg-red-950/50" 
                  : totals.tarefasAtrasadas.current > 0 
                    ? "bg-amber-100 dark:bg-amber-950/50" 
                    : "bg-emerald-100 dark:bg-emerald-950/50"
              )}>
                <AlertCircle className={cn(
                  "w-4 h-4",
                  totals.tarefasAtrasadas.current > 5 
                    ? "text-red-600" 
                    : totals.tarefasAtrasadas.current > 0 
                      ? "text-amber-600" 
                      : "text-emerald-600"
                )} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className={cn(
                "text-2xl sm:text-3xl font-bold",
                totals.tarefasAtrasadas.current > 5 
                  ? "text-red-600" 
                  : totals.tarefasAtrasadas.current > 0 
                    ? "text-amber-600" 
                    : "text-emerald-600"
              )}>
                {totals.tarefasAtrasadas.current}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {totals.tarefasAtrasadas.current === 0 ? 'Parabéns! Tudo em dia' : 'Precisam de atenção imediata'}
            </p>
          </CardContent>
        </Card>
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
              Acompanhe leads, agendamentos e vendas ao longo das semanas
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
              Visão proporcional das principais métricas do período
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

      {/* Mensagens e Engajamento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Volume de Mensagens por Semana
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Mensagens enviadas (atendente + robô) vs mensagens recebidas
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
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
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="mensagensEnviadas" name="Enviadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mensagensRecebidas" name="Recebidas" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights Inteligentes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Insights Inteligentes
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Análise automática dos seus indicadores com recomendações de ação
          </p>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, idx) => {
                const Icon = getInsightIcon(insight.type);
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-3 sm:p-4 rounded-lg border",
                      getInsightColors(insight.type)
                    )}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm mb-1">{insight.title}</h4>
                        <p className="text-[10px] sm:text-xs opacity-90">{insight.message}</p>
                        {insight.action && (
                          <p className="text-[10px] sm:text-xs mt-2 font-medium flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {insight.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Preencha mais dados para receber insights personalizados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}