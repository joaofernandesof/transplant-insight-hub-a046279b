import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Legend,
  LabelList,
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
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useSurveyAnalytics } from "@/neohub/hooks/useSurveyAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventSurveyDashboardProps {
  classId: string | null;
}

const NPS_COLORS = { promoters: '#10b981', passives: '#f59e0b', detractors: '#ef4444' };

// All possible satisfaction levels for NPS
const ALL_SATISFACTION_LEVELS = [
  { key: 'Muito satisfeito', label: 'Muito satisfeito', color: '#10b981' },
  { key: 'Satisfeito', label: 'Satisfeito', color: '#22c55e' },
  { key: 'Neutro', label: 'Neutro', color: '#f59e0b' },
  { key: 'Insatisfeito', label: 'Insatisfeito', color: '#f97316' },
  { key: 'Muito insatisfeito', label: 'Muito insatisfeito', color: '#ef4444' },
];

// All possible urgency levels
const ALL_URGENCY_LEVELS = [
  { key: 'Alta urgência', label: 'Alta urgência', color: '#ef4444' },
  { key: 'Média urgência', label: 'Média urgência', color: '#f59e0b' },
  { key: 'Sem urgência', label: 'Sem urgência', color: '#94a3b8' },
];

// All possible weekly time levels
const ALL_WEEKLY_TIME = [
  { key: 'Mais de 10 horas', label: 'Mais de 10h', color: '#10b981' },
  { key: 'De 5 a 10 horas', label: '5 a 10h', color: '#3b82f6' },
  { key: 'Até 5 horas', label: 'Até 5h', color: '#94a3b8' },
];

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

// Helper to build distribution data with all options
const buildDistributionData = (
  distribution: Record<string, number>,
  allOptions: { key: string; label: string; color: string }[]
) => {
  return allOptions.map(opt => ({
    name: opt.label,
    value: distribution[opt.key] || 0,
    fill: opt.color,
  }));
};

export function EventSurveyDashboard({ classId }: EventSurveyDashboardProps) {
  const { data: analytics, isLoading, error } = useSurveyAnalytics(classId);

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

  // Build satisfaction distribution from responses
  const satisfactionDistribution: Record<string, number> = {};
  analytics.responsesByStudent.forEach(r => {
    if (r.satisfaction) {
      satisfactionDistribution[r.satisfaction] = (satisfactionDistribution[r.satisfaction] || 0) + 1;
    }
  });

  const satisfactionData = buildDistributionData(satisfactionDistribution, ALL_SATISFACTION_LEVELS);
  const urgencyData = buildDistributionData(analytics.studentProfile.urgencyLevel, ALL_URGENCY_LEVELS);
  const weeklyTimeData = buildDistributionData(analytics.studentProfile.weeklyTime, ALL_WEEKLY_TIME);

  // NPS distribution data
  const npsDistribution = [
    { name: 'Promotores', value: analytics.nps.promoters, fill: NPS_COLORS.promoters },
    { name: 'Neutros', value: analytics.nps.passives, fill: NPS_COLORS.passives },
    { name: 'Detratores', value: analytics.nps.detractors, fill: NPS_COLORS.detractors },
  ];

  // Infrastructure data
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

  // Instructor radar data
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

  const wordFrequency = getWordFrequency([...analytics.openFeedback.likedMost, ...analytics.openFeedback.suggestions]);

  const maxSatisfaction = Math.max(...satisfactionData.map(d => d.value), 1);
  const maxUrgency = Math.max(...urgencyData.map(d => d.value), 1);
  const maxWeeklyTime = Math.max(...weeklyTimeData.map(d => d.value), 1);
  const maxNps = Math.max(...npsDistribution.map(d => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{analytics.totalResponses}</p>
                <p className="text-xs text-muted-foreground">Respostas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{analytics.completionRate}%</p>
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
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${
                analytics.nps.score >= 50 ? 'bg-emerald-500/20' : analytics.nps.score >= 0 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <TrendingUp className={`h-4 w-4 ${
                  analytics.nps.score >= 50 ? 'text-emerald-600' : analytics.nps.score >= 0 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  analytics.nps.score >= 50 ? 'text-emerald-700 dark:text-emerald-400' : 
                  analytics.nps.score >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                }`}>{analytics.nps.score}</p>
                <p className="text-xs text-muted-foreground">NPS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{analytics.overallSatisfaction.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{analytics.hotLeads.length}</p>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{analytics.studentProfile.firstTimers}</p>
                <p className="text-xs text-muted-foreground">1ª Vez</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - All in one page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Satisfaction Distribution - Horizontal Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Satisfação Geral
            </CardTitle>
            <CardDescription className="text-xs">Distribuição de respostas</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" domain={[0, maxSatisfaction]} hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [value, 'Respostas']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" fontSize={11} fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* NPS Distribution - Horizontal Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Distribuição NPS
            </CardTitle>
            <CardDescription className="text-xs">Promotores, Neutros e Detratores</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={npsDistribution} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" domain={[0, maxNps]} hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [value, 'Alunos']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    <LabelList dataKey="value" position="right" fontSize={12} fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Urgency Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Nível de Urgência
            </CardTitle>
            <CardDescription className="text-xs">Urgência para iniciar na área</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urgencyData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" domain={[0, maxUrgency]} hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [value, 'Alunos']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" fontSize={11} fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Tempo Semanal Disponível
            </CardTitle>
            <CardDescription className="text-xs">Horas de dedicação por semana</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTimeData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" domain={[0, maxWeeklyTime]} hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [value, 'Alunos']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" fontSize={11} fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Avaliação de Infraestrutura</CardTitle>
          <CardDescription className="text-xs">Média por categoria (0-5)</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={infrastructureData} layout="vertical" margin={{ left: 0, right: 40, top: 5, bottom: 5 }}>
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => [value.toFixed(2), 'Média']} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList dataKey="value" position="right" fontSize={11} fill="#64748b" formatter={(v: number) => v.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Instructors Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comparativo de Professores</CardTitle>
            <CardDescription className="text-xs">Avaliação por critério</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={instructorRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                  <Radar name="Dr. Hygor" dataKey="Dr. Hygor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="Dr. Patrick" dataKey="Dr. Patrick" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Individual Instructor Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notas dos Professores</CardTitle>
            <CardDescription className="text-xs">Média geral por professor</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {[analytics.instructors.hygor, analytics.instructors.patrick].map((instructor, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{instructor.name}</span>
                    <StarRating value={instructor.overallAvg} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-background">
                      <p className={`text-lg font-bold ${getRatingColor(instructor.avgExpectations)}`}>
                        {instructor.avgExpectations.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Expectativas</p>
                    </div>
                    <div className="p-2 rounded bg-background">
                      <p className={`text-lg font-bold ${getRatingColor(instructor.avgClarity)}`}>
                        {instructor.avgClarity.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Clareza</p>
                    </div>
                    <div className="p-2 rounded bg-background">
                      <p className={`text-lg font-bold ${getRatingColor(instructor.avgTime)}`}>
                        {instructor.avgTime.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Tempo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hot Leads */}
      {analytics.hotLeads.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Flame className="h-4 w-4" />
              Hot Leads Identificados ({analytics.hotLeads.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Alunos com alta urgência - potenciais compradores
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {analytics.hotLeads.map((lead, i) => (
                <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  <Flame className="h-3 w-3 mr-1" />
                  {lead.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Word Cloud */}
        {wordFrequency.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Palavras Mais Citadas</CardTitle>
              <CardDescription className="text-xs">Frequência de termos no feedback</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5 justify-center p-2">
                {wordFrequency.slice(0, 15).map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="transition-all hover:scale-105"
                    style={{
                      fontSize: `${Math.min(10 + item.count * 1.5, 18)}px`,
                      opacity: Math.min(0.6 + item.count * 0.08, 1),
                    }}
                  >
                    {item.word}
                    <span className="ml-1 text-muted-foreground text-[10px]">({item.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What they liked most */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-emerald-500" />
              O Que Mais Gostaram
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-40">
              <div className="space-y-1.5">
                {analytics.openFeedback.likedMost.length > 0 ? (
                  analytics.openFeedback.likedMost.slice(0, 6).map((text, idx) => (
                    <div key={idx} className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                      <p className="text-xs text-foreground">"{text}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum feedback registrado
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      {analytics.openFeedback.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Sugestões de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {analytics.openFeedback.suggestions.slice(0, 6).map((text, idx) => (
                <div key={idx} className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <p className="text-xs text-foreground">"{text}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Respostas por Aluno ({analytics.responsesByStudent.length})</CardTitle>
          <CardDescription className="text-xs">
            Status de preenchimento e satisfação individual
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-72">
            <div className="space-y-1.5">
              {analytics.responsesByStudent.map((student, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    student.isHotLead 
                      ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200' 
                      : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-xs ${student.isHotLead ? 'bg-orange-100 text-orange-700' : ''}`}>
                        {student.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {student.userName}
                        {student.isHotLead && (
                          <Flame className="h-3 w-3 text-orange-500" />
                        )}
                        {student.isFirstTime && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            1ª vez
                          </Badge>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {student.completedAt ? (
                          <>Respondeu em {format(parseISO(student.completedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</>
                        ) : (
                          <span className="text-yellow-600">Não completou</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.satisfaction && (
                      <Badge 
                        variant="outline"
                        className={`text-[10px] ${
                          student.satisfaction.toLowerCase().includes('muito satisfeito') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          student.satisfaction.toLowerCase().includes('satisfeito') ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          student.satisfaction.toLowerCase().includes('neutro') ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {student.satisfaction}
                      </Badge>
                    )}
                    {student.completedAt ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
