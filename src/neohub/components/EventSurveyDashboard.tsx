import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  Award,
  MessageSquare,
  Flame,
  Star,
  CheckCircle2,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  PieChart as PieChartIcon,
  User,
  Sparkles,
} from "lucide-react";
import { useSurveyAnalytics, InstructorMetrics, MonitorMetrics } from "@/neohub/hooks/useSurveyAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventSurveyDashboardProps {
  classId: string | null;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const NPS_COLORS = { promoters: '#10b981', passives: '#f59e0b', detractors: '#ef4444' };

// Word frequency counter for word cloud simulation
const getWordFrequency = (texts: string[]): { word: string; count: number }[] => {
  const wordCount: Record<string, number> = {};
  const stopWords = ['de', 'da', 'do', 'e', 'a', 'o', 'que', 'em', 'para', 'com', 'um', 'uma', 'os', 'as', 'no', 'na', 'é', 'foi', 'muito', 'mais', 'como', 'se', 'ao', 'por'];
  
  texts.forEach(text => {
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleaned = word.replace(/[^a-záàâãéèêíïóôõöúçñ]/gi, '');
      if (cleaned.length > 3 && !stopWords.includes(cleaned)) {
        wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
      }
    });
  });

  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
};

const getRatingLabel = (value: number): string => {
  if (value >= 4.5) return 'Excelente';
  if (value >= 3.5) return 'Bom';
  if (value >= 2.5) return 'Regular';
  if (value >= 1.5) return 'Ruim';
  return 'Péssimo';
};

const getRatingColor = (value: number): string => {
  if (value >= 4.5) return 'text-emerald-600';
  if (value >= 3.5) return 'text-blue-600';
  if (value >= 2.5) return 'text-yellow-600';
  if (value >= 1.5) return 'text-orange-600';
  return 'text-red-600';
};

const StarRating = ({ value, max = 5 }: { value: number; max?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.round(value)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{value.toFixed(1)}</span>
    </div>
  );
};

export function EventSurveyDashboard({ classId }: EventSurveyDashboardProps) {
  const { data: analytics, isLoading, error } = useSurveyAnalytics(classId);
  const [activeTab, setActiveTab] = useState("overview");

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
          <p className="text-sm">As respostas da pesquisa de satisfação aparecerão aqui.</p>
        </div>
      </Card>
    );
  }

  // Prepare data for charts
  const instructorData = [
    { name: 'Dr. Hygor', ...analytics.instructors.hygor },
    { name: 'Dr. Patrick', ...analytics.instructors.patrick },
  ];

  const instructorRadarData = [
    {
      metric: 'Expectativas',
      'Dr. Hygor': analytics.instructors.hygor.avgExpectations,
      'Dr. Patrick': analytics.instructors.patrick.avgExpectations,
    },
    {
      metric: 'Clareza',
      'Dr. Hygor': analytics.instructors.hygor.avgClarity,
      'Dr. Patrick': analytics.instructors.patrick.avgClarity,
    },
    {
      metric: 'Tempo',
      'Dr. Hygor': analytics.instructors.hygor.avgTime,
      'Dr. Patrick': analytics.instructors.patrick.avgTime,
    },
  ];

  const infrastructureData = [
    { name: 'Organização', value: analytics.infrastructure.organization },
    { name: 'Conteúdo', value: analytics.infrastructure.contentRelevance },
    { name: 'Professores', value: analytics.infrastructure.teacherCompetence },
    { name: 'Material', value: analytics.infrastructure.materialQuality },
    { name: 'Pontualidade', value: analytics.infrastructure.punctuality },
    { name: 'Infraestrutura', value: analytics.infrastructure.infrastructure },
    { name: 'Equipe', value: analytics.infrastructure.supportTeam },
    { name: 'Coffee Break', value: analytics.infrastructure.coffeeBreak },
  ];

  const npsData = [
    { name: 'Promotores', value: analytics.nps.promoters, color: NPS_COLORS.promoters },
    { name: 'Neutros', value: analytics.nps.passives, color: NPS_COLORS.passives },
    { name: 'Detratores', value: analytics.nps.detractors, color: NPS_COLORS.detractors },
  ];

  const wordFrequency = getWordFrequency([...analytics.openFeedback.likedMost, ...analytics.openFeedback.suggestions]);

  // Profile distribution charts
  const hungerData = Object.entries(analytics.studentProfile.hungerLevel).map(([key, value]) => ({
    name: key.replace('_', ' '),
    value,
  }));

  const urgencyData = Object.entries(analytics.studentProfile.urgencyLevel).map(([key, value]) => ({
    name: key.replace('_', ' '),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{analytics.totalResponses}</p>
                <p className="text-xs text-muted-foreground">Respostas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{analytics.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          analytics.nps.score >= 50 
            ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50'
            : analytics.nps.score >= 0
            ? 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200/50'
            : 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                analytics.nps.score >= 50 ? 'bg-emerald-500/20' : analytics.nps.score >= 0 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <TrendingUp className={`h-5 w-5 ${
                  analytics.nps.score >= 50 ? 'text-emerald-600' : analytics.nps.score >= 0 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className={`text-3xl font-bold ${
                  analytics.nps.score >= 50 ? 'text-emerald-700 dark:text-emerald-400' : 
                  analytics.nps.score >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                }`}>{analytics.nps.score}</p>
                <p className="text-xs text-muted-foreground">NPS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{analytics.overallSatisfaction.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">{analytics.hotLeads.length}</p>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{analytics.studentProfile.firstTimers}</p>
                <p className="text-xs text-muted-foreground">1ª Vez</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="instructors" className="gap-1.5">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Professores</span>
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="gap-1.5">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Infraestrutura</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Alunos</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NPS Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Distribuição NPS
                </CardTitle>
                <CardDescription>
                  Promotores, Neutros e Detratores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={npsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {npsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{analytics.nps.promoters}</p>
                    <p className="text-xs text-muted-foreground">Promotores</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{analytics.nps.passives}</p>
                    <p className="text-xs text-muted-foreground">Neutros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{analytics.nps.detractors}</p>
                    <p className="text-xs text-muted-foreground">Detratores</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Perfil dos Alunos
                </CardTitle>
                <CardDescription>
                  Nível de interesse e urgência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Nível de Fome (Interesse)</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hungerData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f59e0b" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Nível de Urgência</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={urgencyData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#ef4444" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hot Leads */}
          {analytics.hotLeads.length > 0 && (
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <Flame className="h-5 w-5" />
                  Hot Leads Identificados
                </CardTitle>
                <CardDescription>
                  Alunos com alta fome ou urgência - potenciais compradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analytics.hotLeads.map((lead, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {lead.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <div className="flex gap-2 mt-1">
                          {(lead.hungerLevel === 'muito_alto' || lead.hungerLevel === 'alto') && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                              🔥 Fome Alta
                            </Badge>
                          )}
                          {(lead.urgencyLevel === 'muito_alto' || lead.urgencyLevel === 'alto') && (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                              ⚡ Urgência
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparativo de Professores</CardTitle>
                <CardDescription>Avaliação por critério</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={instructorRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                      <Radar name="Dr. Hygor" dataKey="Dr. Hygor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Dr. Patrick" dataKey="Dr. Patrick" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Média Geral por Professor</CardTitle>
                <CardDescription>Score médio de todas as avaliações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={instructorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="overallAvg" name="Média" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Instructor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[analytics.instructors.hygor, analytics.instructors.patrick].map((instructor, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{instructor.name}</CardTitle>
                    <StarRating value={instructor.overallAvg} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className={`text-xl font-bold ${getRatingColor(instructor.avgExpectations)}`}>
                        {instructor.avgExpectations.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Expectativas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className={`text-xl font-bold ${getRatingColor(instructor.avgClarity)}`}>
                        {instructor.avgClarity.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Clareza</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className={`text-xl font-bold ${getRatingColor(instructor.avgTime)}`}>
                        {instructor.avgTime.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Tempo</p>
                    </div>
                  </div>

                  {instructor.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-emerald-500" />
                        Pontos Fortes
                      </p>
                      <ScrollArea className="h-24">
                        <div className="space-y-1">
                          {instructor.strengths.slice(0, 5).map((s, i) => (
                            <p key={i} className="text-sm text-muted-foreground bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">
                              "{s}"
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {instructor.improvements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Sugestões de Melhoria
                      </p>
                      <ScrollArea className="h-24">
                        <div className="space-y-1">
                          {instructor.improvements.slice(0, 5).map((s, i) => (
                            <p key={i} className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                              "{s}"
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avaliação de Infraestrutura</CardTitle>
                <CardDescription>Média por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={infrastructureData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [value.toFixed(2), 'Média']} />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 4, 4, 0]}
                        fill="#3b82f6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes por Categoria</CardTitle>
                <CardDescription>Notas individuais com indicadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {infrastructureData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <Progress value={(item.value / 5) * 100} className="w-32 h-2" />
                        <Badge 
                          variant="outline" 
                          className={`min-w-[60px] justify-center ${
                            item.value >= 4.5 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            item.value >= 3.5 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            item.value >= 2.5 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }`}
                        >
                          {item.value.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Lightbulb className="h-5 w-5" />
                Insights e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Best performing */}
                <div className="p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                    ✅ Pontos Fortes
                  </p>
                  <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                    {infrastructureData
                      .filter(i => i.value >= 4)
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 3)
                      .map((item, idx) => (
                        <li key={idx}>• {item.name}: {item.value.toFixed(1)}</li>
                      ))}
                  </ul>
                </div>

                {/* Needs improvement */}
                <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    ⚠️ Pontos de Atenção
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    {infrastructureData
                      .filter(i => i.value < 4)
                      .sort((a, b) => a.value - b.value)
                      .slice(0, 3)
                      .map((item, idx) => (
                        <li key={idx}>• {item.name}: {item.value.toFixed(1)}</li>
                      ))}
                    {infrastructureData.filter(i => i.value < 4).length === 0 && (
                      <li>Todas as categorias com nota ≥ 4.0 🎉</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Word Cloud Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Palavras Mais Citadas</CardTitle>
                <CardDescription>Frequência de termos no feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 justify-center p-4">
                  {wordFrequency.slice(0, 20).map((item, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="transition-all hover:scale-105"
                      style={{
                        fontSize: `${Math.min(10 + item.count * 2, 24)}px`,
                        opacity: Math.min(0.5 + item.count * 0.1, 1),
                      }}
                    >
                      {item.word}
                      <span className="ml-1 text-muted-foreground">({item.count})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Liked Most */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-emerald-500" />
                  O Que Mais Gostaram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {analytics.openFeedback.likedMost.length > 0 ? (
                      analytics.openFeedback.likedMost.map((text, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                          <p className="text-sm text-foreground">"{text}"</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum feedback registrado
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Sugestões de Melhoria
              </CardTitle>
              <CardDescription>
                Feedback dos alunos para os próximos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.openFeedback.suggestions.length > 0 ? (
                    analytics.openFeedback.suggestions.map((text, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                        <p className="text-sm text-foreground">"{text}"</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4 col-span-2">
                      Nenhuma sugestão registrada
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Respostas por Aluno</CardTitle>
              <CardDescription>
                Status de preenchimento e satisfação individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {analytics.responsesByStudent.map((student, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        student.isHotLead 
                          ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={student.isHotLead ? 'bg-orange-100 text-orange-700' : ''}>
                            {student.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {student.userName}
                            {student.isHotLead && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                <Flame className="h-3 w-3 mr-1" />
                                Hot Lead
                              </Badge>
                            )}
                            {student.isFirstTime && (
                              <Badge variant="outline" className="text-xs">
                                1ª vez
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.completedAt ? (
                              <>Respondeu em {format(parseISO(student.completedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</>
                            ) : (
                              <span className="text-yellow-600">Não completou</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {student.satisfaction && (
                          <Badge 
                            variant="outline"
                            className={`${
                              student.satisfaction === 'excelente' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              student.satisfaction === 'bom' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              student.satisfaction === 'regular' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}
                          >
                            {student.satisfaction}
                          </Badge>
                        )}
                        {student.completedAt ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
