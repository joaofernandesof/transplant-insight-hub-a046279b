import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Users,
  TrendingUp,
  Award,
  MessageSquare,
  Star,
  CheckCircle2,
  Flame,
  Thermometer,
  Snowflake,
  Trophy,
  Lightbulb,
  Calendar,
  Target,
  GraduationCap,
  Heart,
} from 'lucide-react';
import { useGlobalSurveyAnalytics, type GlobalInstructorData } from '@/academy/hooks/useGlobalSurveyAnalytics';
import { ChartExecutiveSummary } from '@/components/surveys/ChartExecutiveSummary';
import { BarChart3, Briefcase, Scale } from 'lucide-react';

interface GlobalSurveyDashboardProps {
  classId?: string | null;
}

const DAY_COLORS = {
  day1: { bg: 'bg-blue-500', text: 'text-blue-600', fill: '#3b82f6' },
  day2: { bg: 'bg-violet-500', text: 'text-violet-600', fill: '#8b5cf6' },
  day3: { bg: 'bg-emerald-500', text: 'text-emerald-600', fill: '#10b981' },
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 6) return 'text-amber-600';
  return 'text-red-600';
};

const getScoreBg = (score: number): string => {
  if (score >= 8) return 'bg-emerald-50 border-emerald-200';
  if (score >= 6) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
};

export function GlobalSurveyDashboard({ classId }: GlobalSurveyDashboardProps) {
  const { data: analytics, isLoading, error } = useGlobalSurveyAnalytics(classId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error || !analytics) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">Nenhuma resposta ainda</h3>
          <p className="text-sm">Os dados consolidados das pesquisas aparecerão aqui.</p>
        </div>
      </Card>
    );
  }
  
  // Prepare chart data
  const satisfactionByDay = [
    { name: 'Dia 1', value: analytics.satisfaction.day1.avg, fill: DAY_COLORS.day1.fill, responses: analytics.satisfaction.day1.count },
    { name: 'Dia 2', value: analytics.satisfaction.day2.avg, fill: DAY_COLORS.day2.fill, responses: analytics.satisfaction.day2.count },
    { name: 'Dia 3', value: analytics.satisfaction.day3.avg, fill: DAY_COLORS.day3.fill, responses: analytics.satisfaction.day3.count },
  ].filter(d => d.responses > 0);
  
  const completionData = [
    { name: 'Dia 1', value: analytics.completionRates.day1, fill: DAY_COLORS.day1.fill },
    { name: 'Dia 2', value: analytics.completionRates.day2, fill: DAY_COLORS.day2.fill },
    { name: 'Dia 3', value: analytics.completionRates.day3, fill: DAY_COLORS.day3.fill },
  ];
  
  const leadsData = [
    { name: 'Quentes', value: analytics.leads.hot, fill: '#ef4444' },
    { name: 'Mornos', value: analytics.leads.warm, fill: '#f59e0b' },
    { name: 'Frios', value: analytics.leads.cold, fill: '#3b82f6' },
  ].filter(d => d.value > 0);
  
  // Prepare instructor radar data
  const instructorRadarData = [
    {
      metric: 'Expectativas',
      ...Object.fromEntries(analytics.instructors.map(i => [i.name, i.avgExpectations])),
    },
    {
      metric: 'Clareza',
      ...Object.fromEntries(analytics.instructors.map(i => [i.name, i.avgClarity])),
    },
    {
      metric: 'Tempo',
      ...Object.fromEntries(analytics.instructors.map(i => [i.name, i.avgTime])),
    },
  ];
  
  const instructorColors: Record<string, string> = {
    'Dr. Hygor': '#3b82f6',
    'Dr. Patrick': '#10b981',
    'Dr. João': '#8b5cf6',
    'Dra. Larissa': '#ec4899',
  };
  
  // Top instructor
  const topInstructor = analytics.instructors[0];
  
  // Generate insights
  const avgSatisfaction = analytics.satisfaction.overall;
  const satisfactionInsights = [];
  if (avgSatisfaction >= 8) {
    satisfactionInsights.push(`🌟 Satisfação média excepcional de ${avgSatisfaction.toFixed(1)}/10 ao longo dos 3 dias de formação.`);
  } else if (avgSatisfaction >= 6) {
    satisfactionInsights.push(`📊 Satisfação média de ${avgSatisfaction.toFixed(1)}/10. Há espaço para melhorias nos próximos eventos.`);
  } else {
    satisfactionInsights.push(`⚠️ Satisfação abaixo do esperado (${avgSatisfaction.toFixed(1)}/10). Revise os pontos de melhoria urgentemente.`);
  }
  
  const leadInsights = [];
  if (analytics.leads.total > 0) {
    const hotPercent = (analytics.leads.hot / analytics.leads.total) * 100;
    if (hotPercent >= 40) {
      leadInsights.push(`🔥 Excelente potencial comercial! ${hotPercent.toFixed(0)}% dos leads estão quentes.`);
    } else if (hotPercent >= 20) {
      leadInsights.push(`📈 ${hotPercent.toFixed(0)}% de leads quentes. Continue nutrindo os mornos para aumentar conversão.`);
    }
  }
  
  // Prepare global radar data with scores in labels
  const globalRadarDataRaw = [
    { metric: 'Satisfação', value: analytics.satisfaction.overall, fullMark: 10 },
    { metric: 'Técnico', value: analytics.contentMetrics.avgTechnical, fullMark: 10 },
    { metric: 'Prática', value: analytics.contentMetrics.avgPractical, fullMark: 10 },
    { metric: 'Clareza', value: analytics.contentMetrics.avgClarity, fullMark: 10 },
    { metric: 'Confiança', value: analytics.contentMetrics.avgConfidence, fullMark: 10 },
    { metric: 'Organização', value: analytics.contentMetrics.avgOrganization, fullMark: 10 },
    { metric: 'Suporte', value: analytics.contentMetrics.avgSupport, fullMark: 10 },
  ].filter(d => d.value > 0);
  
  // Add scores to labels for display
  const globalRadarData = globalRadarDataRaw.map(d => ({
    ...d,
    metricWithScore: `${d.metric} (${d.value.toFixed(1)}/10)`,
  }));
  
  // Find strongest and weakest dimensions
  const sortedMetrics = [...globalRadarData].sort((a, b) => b.value - a.value);
  const strongest = sortedMetrics[0];
  const weakest = sortedMetrics[sortedMetrics.length - 1];
  
  // Global insights
  const globalInsights = [];
  if (strongest) {
    globalInsights.push(`💪 Ponto forte: "${strongest.metric}" com nota ${strongest.value.toFixed(1)}/10.`);
  }
  if (analytics.globalAvg >= 8) {
    globalInsights.push(`✅ Média geral de ${analytics.globalAvg.toFixed(1)}/10 indica excelente desempenho global.`);
  } else if (analytics.globalAvg >= 6) {
    globalInsights.push(`📊 Média geral de ${analytics.globalAvg.toFixed(1)}/10 - bom desempenho com espaço para melhorias.`);
  }
  
  // Day 2 commercial insights
  const day2Insights = [];
  if (analytics.leads.total > 0) {
    const hotPercent = (analytics.leads.hot / analytics.leads.total) * 100;
    day2Insights.push(`🔥 ${analytics.leads.hot} leads quentes (${hotPercent.toFixed(0)}% do total)`);
    if (analytics.leads.avgScoreIA > 0) {
      day2Insights.push(`🤖 Score IA Avivar: ${analytics.leads.avgScoreIA.toFixed(1)}/10`);
    }
    if (analytics.leads.avgScoreLicense > 0) {
      day2Insights.push(`📜 Score Licença: ${analytics.leads.avgScoreLicense.toFixed(1)}/10`);
    }
    if (analytics.leads.avgScoreLegal > 0) {
      day2Insights.push(`⚖️ Score Jurídico: ${analytics.leads.avgScoreLegal.toFixed(1)}/10`);
    }
  }
  
  // Day 3 content insights
  const day3Insights = [];
  if (analytics.contentMetrics.avgTechnical > 0) {
    day3Insights.push(`🎯 Fundamentos Técnicos: ${analytics.contentMetrics.avgTechnical.toFixed(1)}/10`);
  }
  if (analytics.contentMetrics.avgConfidence > 0) {
    day3Insights.push(`💪 Nível de Confiança: ${analytics.contentMetrics.avgConfidence.toFixed(1)}/10`);
  }
  if (analytics.contentMetrics.avgManagement > 0) {
    day3Insights.push(`📈 Gestão: ${analytics.contentMetrics.avgManagement.toFixed(1)}/10`);
  }
  if (analytics.contentMetrics.avgLegal > 0) {
    day3Insights.push(`⚖️ Segurança Jurídica: ${analytics.contentMetrics.avgLegal.toFixed(1)}/10`);
  }
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Respostas</p>
                <p className="text-2xl font-bold">{analytics.satisfaction.totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Satisfação</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.satisfaction.overall)}`}>
                  {analytics.satisfaction.overall.toFixed(1)}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <BarChart3 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Global</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.globalAvg)}`}>
                  {analytics.globalAvg.toFixed(1)}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Flame className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Quentes</p>
                <p className="text-2xl font-bold text-destructive">{analytics.leads.hot}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Professores</p>
                <p className="text-2xl font-bold">{analytics.instructors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Global Overview Radar + Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Visão Geral das Métricas (3 Dias)
            </CardTitle>
            <CardDescription>Avaliação consolidada de todas as dimensões</CardDescription>
          </CardHeader>
          <CardContent>
            {globalRadarData.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={globalRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metricWithScore" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 10]} />
                      <Radar
                        name="Média"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}/10`, 'Nota']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <ChartExecutiveSummary insights={globalInsights} variant="success" />
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Sem dados suficientes</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Day 2 Commercial Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
              Insights Comerciais (Dia 2)
            </CardTitle>
            <CardDescription>Potencial de vendas e interesse por produtos</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.leads.total > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">🤖 IA Avivar</p>
                    <p className={`text-xl font-bold ${getScoreColor(analytics.leads.avgScoreIA)}`}>
                      {analytics.leads.avgScoreIA.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">📜 Licença</p>
                    <p className={`text-xl font-bold ${getScoreColor(analytics.leads.avgScoreLicense)}`}>
                      {analytics.leads.avgScoreLicense.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">⚖️ Jurídico</p>
                    <p className={`text-xl font-bold ${getScoreColor(analytics.leads.avgScoreLegal)}`}>
                      {analytics.leads.avgScoreLegal.toFixed(1)}/10
                    </p>
                  </div>
                </div>
                <ChartExecutiveSummary insights={day2Insights.slice(0, 2)} variant="info" />
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>Sem dados do Dia 2</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Day 3 Content Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-600" />
            Avaliação de Conteúdo (Dia 3)
          </CardTitle>
          <CardDescription>Métricas de entrega técnica, prática e gestão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">🎯 Técnico</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgTechnical)}`}>
                {analytics.contentMetrics.avgTechnical > 0 ? `${analytics.contentMetrics.avgTechnical.toFixed(1)}/10` : '-'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">🔬 Prática</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgPractical)}`}>
                {analytics.contentMetrics.avgPractical > 0 ? `${analytics.contentMetrics.avgPractical.toFixed(1)}/10` : '-'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">📈 Gestão</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgManagement)}`}>
                {analytics.contentMetrics.avgManagement > 0 ? `${analytics.contentMetrics.avgManagement.toFixed(1)}/10` : '-'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">⚖️ Jurídico</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgLegal)}`}>
                {analytics.contentMetrics.avgLegal > 0 ? `${analytics.contentMetrics.avgLegal.toFixed(1)}/10` : '-'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">🔍 Clareza</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgClarity)}`}>
                {analytics.contentMetrics.avgClarity > 0 ? `${analytics.contentMetrics.avgClarity.toFixed(1)}/10` : '-'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">💪 Confiança</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgConfidence)}`}>
                {analytics.contentMetrics.avgConfidence > 0 ? `${analytics.contentMetrics.avgConfidence.toFixed(1)}/10` : '-'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">📋 Organização</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgOrganization)}`}>
                {analytics.contentMetrics.avgOrganization > 0 ? `${analytics.contentMetrics.avgOrganization.toFixed(1)}/10` : '-'}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">🤝 Suporte</p>
              <p className={`text-xl font-bold ${getScoreColor(analytics.contentMetrics.avgSupport)}`}>
                {analytics.contentMetrics.avgSupport > 0 ? `${analytics.contentMetrics.avgSupport.toFixed(1)}/10` : '-'}
              </p>
            </div>
          </div>
          {day3Insights.length > 0 && (
            <ChartExecutiveSummary insights={day3Insights} variant="success" />
          )}
        </CardContent>
      </Card>
      
      {/* Satisfaction by Day */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Satisfação por Dia
            </CardTitle>
            <CardDescription>Evolução da satisfação média ao longo do evento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionByDay} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} tickFormatter={v => `${v}`} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}/10`, 'Satisfação']}
                    labelFormatter={(label) => {
                      const item = satisfactionByDay.find(d => d.name === label);
                      return `${label} (${item?.responses || 0} respostas)`;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {satisfactionByDay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ChartExecutiveSummary insights={satisfactionInsights} variant="info" />
          </CardContent>
        </Card>
        
        {/* Leads Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Distribuição de Leads (Dia 2)
            </CardTitle>
            <CardDescription>Classificação comercial dos participantes</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.leads.total > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {leadsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{analytics.leads.hot} Quentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{analytics.leads.warm} Mornos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{analytics.leads.cold} Frios</span>
                  </div>
                </div>
                {leadInsights.length > 0 && (
                  <ChartExecutiveSummary insights={leadInsights} variant="success" />
                )}
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>Sem dados do Dia 2</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Instructors Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Comparação de Professores (Todos os Dias)
          </CardTitle>
          <CardDescription>
            Dia 1: Dr. Hygor & Dr. Patrick | Dia 2: Dr. João & Dra. Larissa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.instructors.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Ranking Cards */}
              <div className="space-y-3">
                {analytics.instructors.map((instructor, index) => (
                  <div
                    key={instructor.name}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      index === 0 
                        ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' 
                        : 'border-border bg-card'
                    }`}
                  >
                    {index === 0 && (
                      <div className="absolute -top-3 -left-2">
                        <Badge className="bg-emerald-500 text-white">1º</Badge>
                      </div>
                    )}
                    {index === 1 && (
                      <div className="absolute -top-3 -left-2">
                        <Badge variant="secondary">2º</Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: instructorColors[instructor.name] || '#94a3b8' }}
                      />
                      <span className="font-semibold">{instructor.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {instructor.day === 'day1' ? 'Dia 1' : 'Dia 2'}
                      </Badge>
                    </div>
                    
                    <div className={`text-2xl font-bold ${getScoreColor(instructor.overallAvg)} mb-3`}>
                      {instructor.overallAvg.toFixed(1)}/10
                      <span className="text-sm font-normal text-muted-foreground ml-2">Média Geral</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Expectativas</p>
                        <p className={`font-semibold ${getScoreColor(instructor.avgExpectations)}`}>
                          {instructor.avgExpectations.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Clareza</p>
                        <p className={`font-semibold ${getScoreColor(instructor.avgClarity)}`}>
                          {instructor.avgClarity.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Tempo</p>
                        <p className={`font-semibold ${getScoreColor(instructor.avgTime)}`}>
                          {instructor.avgTime.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Radar Chart */}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={instructorRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 10]} />
                    {analytics.instructors.map((instructor) => (
                      <Radar
                        key={instructor.name}
                        name={instructor.name}
                        dataKey={instructor.name}
                        stroke={instructorColors[instructor.name] || '#94a3b8'}
                        fill={instructorColors[instructor.name] || '#94a3b8'}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>Sem dados de instrutores</p>
            </div>
          )}
          
          {topInstructor && (
            <ChartExecutiveSummary
              insights={[
                `⭐ Destaque para ${topInstructor.name} com média ${topInstructor.overallAvg.toFixed(1)}/10 - referência para próximas turmas.`,
              ]}
              variant="success"
            />
          )}
        </CardContent>
      </Card>
      
      {/* Monitors Ranking (Day 3) */}
      {analytics.monitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Ranking de Monitores (Dia 3)
            </CardTitle>
            <CardDescription>Avaliação de domínio técnico e atenção ao aluno</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.monitors.map((monitor, index) => (
                <div
                  key={monitor.name}
                  className={`relative p-4 rounded-xl border-2 ${
                    index === 0 
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' 
                      : 'border-border bg-card'
                  }`}
                >
                  {index === 0 && (
                    <div className="absolute -top-3 -left-2">
                      <Badge className="bg-amber-500 text-white">1º</Badge>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute -top-3 -left-2">
                      <Badge variant="secondary">2º</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    {index === 0 && <Trophy className="h-5 w-5 text-amber-500" />}
                    <span className="font-semibold">{monitor.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">🎯 Técnico</p>
                      <p className="font-bold text-primary">
                        {monitor.avgTechnical} {monitor.avgTechnical === 1 ? 'voto' : 'votos'}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">💕 Atenção</p>
                      <p className="font-bold text-pink-500">
                        {monitor.avgContribution} {monitor.avgContribution === 1 ? 'voto' : 'votos'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Completion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Taxa de Conclusão por Dia
          </CardTitle>
          <CardDescription>Percentual de alunos que completaram cada pesquisa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {completionData.map((day, index) => (
              <div key={day.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{day.name}</span>
                  <span className={`font-bold ${day.value >= 70 ? 'text-emerald-600' : day.value >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                    {day.value.toFixed(0)}%
                  </span>
                </div>
                <Progress value={day.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Feedback Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <Star className="h-5 w-5" />
              Principais Acertos
            </CardTitle>
            <CardDescription>O que os alunos mais elogiaram</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-auto max-h-96">
              {analytics.highlights.length > 0 ? (
                <div className="space-y-2">
                  {analytics.highlights.map((text, idx) => (
                    <div key={idx} className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-sm border-l-2 border-emerald-400">
                      "{text}"
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum feedback registrado</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Improvements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Lightbulb className="h-5 w-5" />
              Sugestões de Melhoria
            </CardTitle>
            <CardDescription>O que pode ser melhorado</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-auto max-h-96">
              {analytics.improvements.length > 0 ? (
                <div className="space-y-2">
                  {analytics.improvements.map((text, idx) => (
                    <div key={idx} className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-sm border-l-2 border-amber-400">
                      "{text}"
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma sugestão registrada</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
