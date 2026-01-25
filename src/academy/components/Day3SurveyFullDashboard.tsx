import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Clock,
  Trophy,
  Star,
  MessageSquare,
  TrendingUp,
  ThumbsUp,
  Lightbulb,
  Award,
  Target,
  BookOpen,
  Briefcase,
  Scale,
  HeartHandshake,
} from 'lucide-react';
import { useDay3SurveyAnalytics } from '@/academy/hooks/useDay3SurveyAnalytics';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Day3SurveyFullDashboardProps {
  classId?: string | null;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const SATISFACTION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  muito_satisfeito: { label: 'Muito satisfeito', emoji: '🤩', color: '#10b981' },
  satisfeito: { label: 'Satisfeito', emoji: '🙂', color: '#3b82f6' },
  neutro: { label: 'Neutro', emoji: '😐', color: '#f59e0b' },
  insatisfeito: { label: 'Insatisfeito', emoji: '😕', color: '#ef4444' },
  muito_insatisfeito: { label: 'Muito insatisfeito', emoji: '😡', color: '#991b1b' },
};

const PROMISE_LABELS: Record<string, { label: string; emoji: string }> = {
  muito_acima: { label: 'Muito acima', emoji: '🔥' },
  acima: { label: 'Acima', emoji: '✨' },
  dentro: { label: 'Dentro', emoji: '✅' },
  abaixo: { label: 'Abaixo', emoji: '⚠️' },
  muito_abaixo: { label: 'Muito abaixo', emoji: '❌' },
};

const BALANCE_LABELS: Record<string, string> = {
  equilibrado: '⚖️ Bem equilibrado',
  mais_pratica: '🛠️ Mais prática',
  mais_teoria: '📘 Mais teoria',
  muito_pratico: '🧪 Muito prático',
  muito_teorico: '📚 Muito teórico',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function ScoreCard({ title, value, max = 5, icon: Icon, color = 'emerald' }: {
  title: string;
  value: number;
  max?: number;
  icon: React.ElementType;
  color?: string;
}) {
  const percentage = (value / max) * 100;
  const colorClasses = {
    emerald: 'text-emerald-600 bg-emerald-100',
    blue: 'text-blue-600 bg-blue-100',
    violet: 'text-violet-600 bg-violet-100',
    amber: 'text-amber-600 bg-amber-100',
  };
  
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{value.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground mb-0.5">/ {max}</span>
        </div>
        <Progress value={percentage} className="h-1.5 mt-2" />
      </CardContent>
    </Card>
  );
}

export function Day3SurveyFullDashboard({ classId }: Day3SurveyFullDashboardProps) {
  const { data: analytics, isLoading, error } = useDay3SurveyAnalytics(classId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }
  
  if (error || !analytics) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">Nenhuma resposta ainda</h3>
          <p className="text-sm">As respostas da Pesquisa Final (Dia 3) aparecerão aqui.</p>
        </div>
      </Card>
    );
  }
  
  // Prepare chart data
  const promiseData = Object.entries(analytics.satisfaction.promiseMet).map(([key, value]) => ({
    name: PROMISE_LABELS[key]?.label || key,
    value,
    emoji: PROMISE_LABELS[key]?.emoji || '',
  }));
  
  const balanceData = Object.entries(analytics.technicalContent.balanceDistribution).map(([key, value]) => ({
    name: BALANCE_LABELS[key] || key,
    value,
  }));
  
  const monitorTechnicalData = Object.entries(analytics.monitorRankings.technicalDomain)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const monitorCaringData = Object.entries(analytics.monitorRankings.caringAttention)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const radarData = [
    { metric: 'Satisfação', value: analytics.satisfaction.avgLevel },
    { metric: 'Técnico', value: analytics.technicalContent.avgFoundations },
    { metric: 'Prática', value: analytics.technicalContent.avgPracticalLoad },
    { metric: 'Clareza', value: analytics.confidence.avgClarity },
    { metric: 'Confiança', value: analytics.confidence.avgConfidence },
    { metric: 'Gestão', value: analytics.businessContent.avgManagement },
    { metric: 'Jurídico', value: analytics.businessContent.avgLegalSecurity },
    { metric: 'Organização', value: analytics.experience.avgOrganization },
    { metric: 'Suporte', value: analytics.experience.avgSupport },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.completedResponses}</p>
                <p className="text-xs text-muted-foreground">Respostas completas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.satisfaction.avgLevel.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Satisfação média (1-5)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(analytics.avgEffectiveTime)}</p>
                <p className="text-xs text-muted-foreground">Tempo médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="monitors">Monitores</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Visão Geral das Métricas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Média"
                      dataKey="value"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Promise Met Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  O curso correspondeu ao prometido?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={promiseData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard title="Clareza para Executar" value={analytics.confidence.avgClarity} icon={Lightbulb} color="emerald" />
            <ScoreCard title="Confiança" value={analytics.confidence.avgConfidence} icon={Award} color="blue" />
            <ScoreCard title="Organização" value={analytics.experience.avgOrganization} icon={Target} color="violet" />
            <ScoreCard title="Suporte" value={analytics.experience.avgSupport} icon={HeartHandshake} color="amber" />
          </div>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Avaliação do Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreCard title="Fundamentos Técnicos" value={analytics.technicalContent.avgFoundations} icon={BookOpen} color="emerald" />
                <ScoreCard title="Carga Prática" value={analytics.technicalContent.avgPracticalLoad} icon={Target} color="blue" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Equilíbrio Teoria/Prática
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={balanceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {balanceData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <ScoreCard title="Aulas de Gestão" value={analytics.businessContent.avgManagement} icon={Briefcase} color="violet" />
            <ScoreCard title="Conteúdo Jurídico" value={analytics.businessContent.avgLegalSecurity} icon={Scale} color="amber" />
          </div>
        </TabsContent>
        
        {/* Monitors Tab */}
        <TabsContent value="monitors" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Maior Domínio Técnico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monitorTechnicalData.map((monitor, idx) => (
                    <div key={monitor.name} className="flex items-center gap-3">
                      <Badge variant={idx === 0 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <span className="flex-1 font-medium">{monitor.name}</span>
                      <span className="text-muted-foreground">{monitor.value} votos</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-rose-500" />
                  Mais Atenção e Cuidado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monitorCaringData.map((monitor, idx) => (
                    <div key={monitor.name} className="flex items-center gap-3">
                      <Badge variant={idx === 0 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <span className="flex-1 font-medium">{monitor.name}</span>
                      <span className="text-muted-foreground">{monitor.value} votos</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {analytics.monitorComments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comentários sobre Monitores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {analytics.monitorComments.map((comment, idx) => (
                      <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                        "{comment}"
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  O que precisa melhorar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {analytics.improvements.length > 0 ? (
                      analytics.improvements.map((item, idx) => (
                        <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                          "{item}"
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum feedback ainda.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-500" />
                  O que mais acertamos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {analytics.highlights.length > 0 ? (
                      analytics.highlights.map((item, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm">
                          "{item}"
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum feedback ainda.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Respostas por Aluno ({analytics.responsesByStudent.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {analytics.responsesByStudent
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .map((student, idx) => {
                      const satConfig = SATISFACTION_LABELS[student.satisfactionLevel || ''] || { emoji: '❓', label: 'N/A', color: '#94a3b8' };
                      return (
                        <div key={student.userId} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                            {idx + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.completedAt 
                                ? format(parseISO(student.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                : 'Não concluído'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{satConfig.emoji}</span>
                            <Badge 
                              variant="secondary"
                              style={{ backgroundColor: satConfig.color + '20', color: satConfig.color }}
                            >
                              {satConfig.label}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{student.overallScore}</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
