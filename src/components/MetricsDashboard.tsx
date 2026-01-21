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
  Target,
  AlertTriangle,
  ThumbsUp,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricsDashboardProps {
  weeks: WeekData[];
  currentWeekNumber: number;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  clinicName?: string;
}

// Indicadores-chave com diagnósticos
const metricsConfig = [
  { 
    id: 'leads_novos', 
    nome: 'Leads Novos', 
    icon: Users,
    color: 'text-blue-600',
    goodDirection: 'up', // mais é melhor
    getDiagnosis: (value: number, trend: number) => {
      if (value === 0) return { status: 'danger', text: 'Sem captação de leads. Verifique campanhas e formulários.' };
      if (trend < -30) return { status: 'warning', text: 'Queda acentuada. Revisar fontes de tráfego.' };
      if (trend > 20) return { status: 'success', text: 'Excelente crescimento na captação!' };
      return { status: 'neutral', text: 'Volume estável.' };
    }
  },
  { 
    id: 'agendamentos', 
    nome: 'Agendamentos', 
    icon: Calendar,
    color: 'text-amber-600',
    goodDirection: 'up',
    getDiagnosis: (value: number, trend: number, leads: number) => {
      if (value === 0 && leads > 0) return { status: 'danger', text: 'Leads não estão agendando. Revisar atendimento.' };
      if (value === 0) return { status: 'warning', text: 'Nenhum agendamento registrado.' };
      if (leads > 0 && (value / leads) < 0.2) return { status: 'warning', text: 'Taxa de agendamento baixa (<20%).' };
      if (trend > 20) return { status: 'success', text: 'Ótima conversão para agenda!' };
      return { status: 'neutral', text: 'Dentro do esperado.' };
    }
  },
  { 
    id: 'vendas_realizadas', 
    nome: 'Vendas', 
    icon: ShoppingCart,
    color: 'text-pink-600',
    goodDirection: 'up',
    getDiagnosis: (value: number, trend: number, leads: number) => {
      if (value === 0 && leads > 5) return { status: 'danger', text: 'Sem conversão de vendas. Revisar fechamento.' };
      if (value === 0) return { status: 'warning', text: 'Nenhuma venda registrada.' };
      if (leads > 0 && (value / leads) > 0.3) return { status: 'success', text: 'Taxa de conversão excelente (>30%)!' };
      if (leads > 0 && (value / leads) < 0.1) return { status: 'warning', text: 'Conversão baixa (<10%). Revisar script.' };
      return { status: 'neutral', text: 'Performance dentro da média.' };
    }
  },
  { 
    id: 'tarefas_realizadas', 
    nome: 'Tarefas Realizadas', 
    icon: CheckCircle2,
    color: 'text-emerald-600',
    goodDirection: 'up',
    getDiagnosis: (value: number, trend: number) => {
      if (value === 0) return { status: 'warning', text: 'Nenhuma tarefa concluída. Verificar atividade.' };
      if (trend > 20) return { status: 'success', text: 'Boa produtividade da equipe!' };
      return { status: 'neutral', text: 'Atividade normal.' };
    }
  },
  { 
    id: 'tarefas_atrasadas', 
    nome: 'Tarefas Atrasadas', 
    icon: AlertCircle,
    color: 'text-red-600',
    goodDirection: 'down', // menos é melhor
    getDiagnosis: (value: number) => {
      if (value === 0) return { status: 'success', text: 'Parabéns! Tudo em dia.' };
      if (value > 10) return { status: 'danger', text: 'Acúmulo crítico. Priorizar resolução.' };
      if (value > 5) return { status: 'warning', text: 'Atenção: muitas pendências.' };
      return { status: 'neutral', text: 'Poucas pendências.' };
    }
  },
  { 
    id: 'mensagens_enviadas_atendente', 
    nome: 'Msgs Atendente', 
    icon: MessageSquare,
    color: 'text-green-600',
    goodDirection: 'up',
    getDiagnosis: (value: number, trend: number) => {
      if (value === 0) return { status: 'danger', text: 'Sem atividade de atendimento. Time inativo?' };
      if (trend < -50) return { status: 'warning', text: 'Queda drástica na comunicação.' };
      return { status: 'neutral', text: 'Volume normal.' };
    }
  },
  { 
    id: 'mensagens_enviadas_robo', 
    nome: 'Msgs Robô', 
    icon: Bot,
    color: 'text-teal-600',
    goodDirection: 'up',
    getDiagnosis: (value: number) => {
      if (value === 0) return { status: 'warning', text: 'Automação parada. Verificar integração.' };
      return { status: 'neutral', text: 'Automação funcionando.' };
    }
  },
  { 
    id: 'leads_descartados', 
    nome: 'Leads Descartados', 
    icon: XCircle,
    color: 'text-slate-600',
    goodDirection: 'down',
    getDiagnosis: (value: number, trend: number, leads: number) => {
      if (leads > 0 && (value / leads) > 0.5) return { status: 'danger', text: 'Mais de 50% descartados. Revisar qualificação.' };
      if (value > 10) return { status: 'warning', text: 'Alto volume de descarte.' };
      return { status: 'neutral', text: 'Volume aceitável.' };
    }
  },
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
        mensagensAtendente: Number(values.mensagens_enviadas_atendente) || 0,
        mensagensRobo: Number(values.mensagens_enviadas_robo) || 0,
        leadsDescartados: Number(values.leads_descartados) || 0,
      });
    }
    return data;
  }, [currentWeekNumber, getWeekValues]);

  // Calcular totais e tendências
  const metricsData = useMemo(() => {
    const currentWeekData = weeklyData[weeklyData.length - 1] || {};
    const previousWeekData = weeklyData[weeklyData.length - 2] || {};
    
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const totalLeads = weeklyData.reduce((acc, d) => acc + d.leads, 0);

    return metricsConfig.map(metric => {
      const fieldMap: Record<string, string> = {
        leads_novos: 'leads',
        agendamentos: 'agendamentos',
        vendas_realizadas: 'vendas',
        tarefas_realizadas: 'tarefasRealizadas',
        tarefas_atrasadas: 'tarefasAtrasadas',
        mensagens_enviadas_atendente: 'mensagensAtendente',
        mensagens_enviadas_robo: 'mensagensRobo',
        leads_descartados: 'leadsDescartados',
      };
      
      const field = fieldMap[metric.id] || metric.id;
      const current = (currentWeekData as any)[field] || 0;
      const previous = (previousWeekData as any)[field] || 0;
      const total = weeklyData.reduce((acc, d) => acc + ((d as any)[field] || 0), 0);
      const trend = calcTrend(current, previous);
      const avg = total / weeklyData.length;
      
      const diagnosis = metric.getDiagnosis(current, trend, totalLeads);

      return {
        ...metric,
        current,
        previous,
        total,
        trend,
        avg,
        diagnosis,
      };
    });
  }, [weeklyData]);

  // Dados para gráfico de pizza
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

  // Calcular taxa de conversão
  const conversionRate = useMemo(() => {
    const totalLeads = metricsData.find(m => m.id === 'leads_novos')?.total || 0;
    const totalVendas = metricsData.find(m => m.id === 'vendas_realizadas')?.total || 0;
    if (totalLeads === 0) return 0;
    return ((totalVendas / totalLeads) * 100).toFixed(1);
  }, [metricsData]);

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'warning': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'danger': return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return ThumbsUp;
      case 'warning': return AlertTriangle;
      case 'danger': return AlertCircle;
      default: return Minus;
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

      {/* KPI Cards - Top 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metricsData.slice(0, 4).map(metric => {
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
                  Total: {metric.total} | Média: {metric.avg.toFixed(1)}
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

      {/* Tabela de Indicadores com Diagnóstico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Indicadores da Semana com Diagnóstico
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Valores atuais, tendência e análise automática de cada métrica
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-foreground">Indicador</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-foreground min-w-[60px]">Atual</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-foreground min-w-[60px]">Anterior</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-foreground min-w-[70px]">Tendência</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-foreground min-w-[60px]">Total</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-foreground min-w-[200px]">Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {metricsData.map((metric, idx) => {
                  const Icon = metric.icon;
                  const StatusIcon = getStatusIcon(metric.diagnosis.status);
                  const trendPositive = metric.goodDirection === 'up' ? metric.trend >= 0 : metric.trend <= 0;
                  
                  return (
                    <tr 
                      key={metric.id}
                      className={cn(
                        'border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors',
                        idx % 2 === 0 && 'bg-muted/10'
                      )}
                    >
                      <td className="px-3 sm:px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4 flex-shrink-0", metric.color)} />
                          <span className="font-medium text-foreground text-xs sm:text-sm">{metric.nome}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className="font-bold text-foreground">{metric.current}</span>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className="text-muted-foreground">{metric.previous}</span>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-medium",
                          trendPositive ? "text-emerald-600" : "text-red-600"
                        )}>
                          {metric.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(metric.trend).toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-center px-2 py-2.5">
                        <span className="text-muted-foreground">{metric.total}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs border",
                          getStatusColors(metric.diagnosis.status)
                        )}>
                          <StatusIcon className="w-3 h-3 flex-shrink-0" />
                          <span>{metric.diagnosis.text}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Global */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Resumo Global e Orientações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 sm:p-5 border border-border">
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              {(() => {
                const leadsData = metricsData.find(m => m.id === 'leads_novos');
                const vendasData = metricsData.find(m => m.id === 'vendas_realizadas');
                const agendamentosData = metricsData.find(m => m.id === 'agendamentos');
                const atrasadasData = metricsData.find(m => m.id === 'tarefas_atrasadas');
                
                const hasLeads = (leadsData?.current || 0) > 0;
                const hasVendas = (vendasData?.current || 0) > 0;
                const hasAgendamentos = (agendamentosData?.current || 0) > 0;
                const hasManyAtrasadas = (atrasadasData?.current || 0) > 5;
                
                const problemsCount = [
                  leadsData?.diagnosis.status === 'danger',
                  vendasData?.diagnosis.status === 'danger',
                  agendamentosData?.diagnosis.status === 'danger',
                  atrasadasData?.diagnosis.status === 'danger'
                ].filter(Boolean).length;

                const successCount = [
                  leadsData?.diagnosis.status === 'success',
                  vendasData?.diagnosis.status === 'success',
                  agendamentosData?.diagnosis.status === 'success',
                  atrasadasData?.diagnosis.status === 'success'
                ].filter(Boolean).length;

                let summary = `Na semana S${currentWeekNumber}, `;
                
                if (problemsCount >= 2) {
                  summary += `identificamos ${problemsCount} pontos críticos que necessitam atenção imediata. `;
                } else if (successCount >= 2) {
                  summary += `a performance está acima do esperado com ${successCount} indicadores positivos. `;
                } else {
                  summary += `os indicadores estão dentro da normalidade. `;
                }

                summary += hasLeads 
                  ? `Foram captados ${leadsData?.current} leads novos (${leadsData?.trend >= 0 ? 'alta' : 'queda'} de ${Math.abs(leadsData?.trend || 0).toFixed(0)}%). ` 
                  : 'Não houve captação de leads esta semana - revisar campanhas. ';

                summary += hasAgendamentos
                  ? `Realizados ${agendamentosData?.current} agendamentos. `
                  : '';

                summary += hasVendas
                  ? `Convertidas ${vendasData?.current} vendas. `
                  : 'Nenhuma venda registrada - oportunidade de melhoria no fechamento. ';

                if (hasManyAtrasadas) {
                  summary += `ATENÇÃO: Há ${atrasadasData?.current} tarefas atrasadas acumuladas que precisam ser priorizadas. `;
                }

                summary += `\n\n📌 Recomendação principal: `;
                
                if (!hasLeads) {
                  summary += 'Focar na captação de leads através de campanhas e revisão de formulários de contato.';
                } else if (!hasVendas && hasLeads) {
                  summary += 'Investir no processo de fechamento e follow-up dos leads já captados.';
                } else if (hasManyAtrasadas) {
                  summary += 'Resolver tarefas atrasadas para manter o fluxo operacional saudável.';
                } else if (successCount >= 2) {
                  summary += 'Manter a estratégia atual e buscar escalar os resultados positivos.';
                } else {
                  summary += 'Acompanhar diariamente os indicadores e agir proativamente nos pontos de atenção.';
                }

                return summary;
              })()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}