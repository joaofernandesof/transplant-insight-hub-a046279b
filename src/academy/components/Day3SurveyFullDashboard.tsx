import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Eye,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDay3SurveyAnalytics } from '@/academy/hooks/useDay3SurveyAnalytics';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Day3SurveyFullDashboardProps {
  classId?: string | null;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

// Classificação de satisfação baseada no score (0-10)
// 0-3: Muito insatisfeito | 4-6: Insatisfeito | 7: Neutro | 8-9: Satisfeito | 10: Muito satisfeito
const getSatisfactionFromScore = (score: number): { label: string; color: string } => {
  if (score >= 10) return { label: 'Muito Satisfeito', color: '#10b981' };
  if (score >= 8) return { label: 'Satisfeito', color: '#22c55e' };
  if (score >= 7) return { label: 'Neutro', color: '#eab308' };
  if (score >= 4) return { label: 'Insatisfeito', color: '#f97316' };
  return { label: 'Muito Insatisfeito', color: '#ef4444' };
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

// Stop words to ignore in word cloud
const STOP_WORDS = new Set([
  'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'os', 'as', 'dos', 'das',
  'para', 'com', 'que', 'na', 'no', 'por', 'mais', 'muito', 'foi', 'ser', 'ter',
  'como', 'mas', 'se', 'ou', 'seu', 'sua', 'ele', 'ela', 'isso', 'esse', 'essa',
  'ao', 'à', 'às', 'aos', 'é', 'são', 'está', 'estão', 'tem', 'têm', 'havia',
  'nenhuma', 'nenhum', 'todos', 'todas', 'tudo', 'nada', 'bem', 'bom', 'boa',
  'já', 'ainda', 'também', 'só', 'apenas', 'sobre', 'entre', 'até', 'sem',
]);

function extractWords(texts: string[]): { word: string; count: number }[] {
  const wordCounts: Record<string, number> = {};
  
  texts.forEach(text => {
    const words = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents for matching
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 words
}

function WordCloud({ texts, color }: { texts: string[]; color: 'amber' | 'emerald' }) {
  const words = extractWords(texts);
  
  if (words.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-4">Sem dados suficientes</p>;
  }
  
  const maxCount = Math.max(...words.map(w => w.count));
  
  const colorClasses = {
    amber: ['text-amber-400', 'text-amber-500', 'text-amber-600', 'text-amber-700'],
    emerald: ['text-emerald-400', 'text-emerald-500', 'text-emerald-600', 'text-emerald-700'],
  };
  
  return (
    <div className="flex flex-wrap gap-2 justify-center items-center min-h-[80px]">
      {words.map(({ word, count }) => {
        const intensity = Math.ceil((count / maxCount) * 4);
        const colorClass = colorClasses[color][Math.min(intensity - 1, 3)];
        const fontSize = 0.75 + (count / maxCount) * 1; // 0.75rem to 1.75rem
        
        return (
          <span
            key={word}
            className={`font-medium ${colorClass} transition-all hover:scale-110 cursor-default`}
            style={{ fontSize: `${fontSize}rem` }}
            title={`${count}x`}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

function ScoreCard({ title, value, max = 10, icon: Icon, color = 'emerald' }: {
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

// Question labels for display
const QUESTION_LABELS: Record<string, string> = {
  q1: 'Nível de satisfação geral',
  q2: 'Promessa de entrega atendida',
  q3: 'Qualidade das bases técnicas',
  q4: 'Carga prática do curso',
  q5: 'Equilíbrio teoria/prática',
  q6: 'Clareza sobre execução',
  q7: 'Confiança adquirida',
  q8: 'Aulas de gestão',
  q9: 'Conteúdo jurídico',
  q10: 'Organização do evento',
  q11: 'Qualidade do suporte',
  q12: 'O que precisa melhorar',
  q13: 'O que mais acertamos',
  q14: 'Melhor monitor (técnico)',
  q15: 'Melhor monitor (atenção)',
  q16: 'Comentários sobre monitores',
};

const VALUE_DISPLAY_LABELS: Record<string, Record<string, string>> = {
  q1: { muito_satisfeito: 'Muito Satisfeito', satisfeito: 'Satisfeito', neutro: 'Neutro', insatisfeito: 'Insatisfeito', muito_insatisfeito: 'Muito Insatisfeito' },
  q2: { muito_acima: 'Muito Acima', acima: 'Acima', dentro: 'Dentro', abaixo: 'Abaixo', muito_abaixo: 'Muito Abaixo' },
  q3: { excelentes: 'Excelentes', bons: 'Bons', adequados: 'Adequados', fracos: 'Fracos', muito_fracos: 'Muito Fracos' },
  q4: { excelente: 'Excelente', boa: 'Boa', adequada: 'Adequada', insuficiente: 'Insuficiente', muito_insuficiente: 'Muito Insuficiente' },
  q5: { equilibrado: 'Bem Equilibrado', mais_pratica: 'Mais Prática', mais_teoria: 'Mais Teoria', muito_pratico: 'Muito Prático', muito_teorico: 'Muito Teórico' },
  q6: { total: 'Total', boa: 'Boa', razoavel: 'Razoável', pouca: 'Pouca', nenhuma: 'Nenhuma' },
  q7: { alta: 'Alta', boa: 'Boa', moderada: 'Moderada', baixa: 'Baixa', nenhuma: 'Nenhuma' },
  q8: { essenciais: 'Essenciais', muito_relevantes: 'Muito Relevantes', relevantes: 'Relevantes', pouco_relevantes: 'Pouco Relevantes', nada_relevantes: 'Nada Relevantes' },
  q9: { muita: 'Muita', boa: 'Boa', razoavel: 'Razoável', pouca: 'Pouca', nenhuma: 'Nenhuma' },
  q10: { excelente: 'Excelente', boa: 'Boa', regular: 'Regular', ruim: 'Ruim', muito_ruim: 'Muito Ruim' },
  q11: { excelente: 'Excelente', bom: 'Bom', adequado: 'Adequado', fraco: 'Fraco', muito_fraco: 'Muito Fraco' },
  q14: { elenilton: 'Dr. Elenilton', patrick: 'Dr. Patrick', eder: 'Dr. Eder', gleyldes: 'Dra. Gleyldes' },
  q15: { elenilton: 'Dr. Elenilton', patrick: 'Dr. Patrick', eder: 'Dr. Eder', gleyldes: 'Dra. Gleyldes' },
};

type StudentResponse = {
  userId: string;
  studentName: string;
  avatarUrl: string | null;
  completedAt: string | null;
  effectiveTime: number | null;
  overallScore: number;
  satisfactionLevel: string | null;
  responses: Record<string, string | null>;
};

export function Day3SurveyFullDashboard({ classId }: Day3SurveyFullDashboardProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
  const [sortField, setSortField] = useState<'name' | 'date' | 'score' | 'satisfaction'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { data: analytics, isLoading, error } = useDay3SurveyAnalytics(classId);
  
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };
  
  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };
  
  const sortStudents = (students: StudentResponse[]) => {
    return [...students].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return multiplier * a.studentName.localeCompare(b.studentName);
        case 'date':
          if (!a.completedAt && !b.completedAt) return 0;
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          return multiplier * (new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
        case 'score':
          return multiplier * (a.overallScore - b.overallScore);
        case 'satisfaction':
          const satOrder: Record<string, number> = { muito_satisfeito: 5, satisfeito: 4, neutro: 3, insatisfeito: 2, muito_insatisfeito: 1 };
          return multiplier * ((satOrder[a.satisfactionLevel || ''] || 0) - (satOrder[b.satisfactionLevel || ''] || 0));
        default:
          return 0;
      }
    });
  };
  
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
  
  // All monitors list - show all 4 unique monitors
  const ALL_MONITORS = ['Dr. Elenilton', 'Dr. Patrick', 'Dr. Eder', 'Dra. Gleyldes'];

  const monitorTechnicalData = ALL_MONITORS
    .map(name => ({ 
      name, 
      value: analytics.monitorRankings.technicalDomain[name] || 0 
    }))
    .sort((a, b) => b.value - a.value);
  
  const monitorCaringData = ALL_MONITORS
    .map(name => ({ 
      name, 
      value: analytics.monitorRankings.caringAttention[name] || 0 
    }))
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
      {/* Tabs First */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="monitors">Monitores</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
        </TabsList>
        
        {/* Header Stats - Now Below Tabs */}
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
                  <p className="text-xs text-muted-foreground">Satisfação média (0-10)</p>
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
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
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
        <TabsContent value="feedback" className="space-y-6">
          {/* Word Clouds */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Palavras mais citadas - Melhorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WordCloud texts={analytics.improvements} color="amber" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Palavras mais citadas - Acertos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WordCloud texts={analytics.highlights} color="emerald" />
              </CardContent>
            </Card>
          </div>
          
          {/* All Feedbacks */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  O que precisa melhorar ({analytics.improvements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.improvements.length > 0 ? (
                    analytics.improvements.map((item, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm dark:bg-amber-950/20 dark:border-amber-900/30">
                        "{item}"
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhum feedback ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-500" />
                  O que mais acertamos ({analytics.highlights.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.highlights.length > 0 ? (
                    analytics.highlights.map((item, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm dark:bg-emerald-950/20 dark:border-emerald-900/30">
                        "{item}"
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhum feedback ainda.</p>
                  )}
                </div>
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
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('name')}
                          className="flex items-center font-medium hover:text-foreground transition-colors"
                        >
                          Aluno
                          {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('date')}
                          className="flex items-center font-medium hover:text-foreground transition-colors"
                        >
                          Data
                          {getSortIcon('date')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('satisfaction')}
                          className="flex items-center font-medium hover:text-foreground transition-colors"
                        >
                          Satisfação
                          {getSortIcon('satisfaction')}
                        </button>
                      </TableHead>
                      <TableHead>Promessa</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Prática</TableHead>
                      <TableHead>Clareza</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Gestão</TableHead>
                      <TableHead>Jurídico</TableHead>
                      <TableHead>Organização</TableHead>
                      <TableHead>Suporte</TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('score')}
                          className="flex items-center font-medium hover:text-foreground transition-colors"
                        >
                          Score
                          {getSortIcon('score')}
                        </button>
                      </TableHead>
                      <TableHead className="w-16">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortStudents(analytics.responsesByStudent).map((student, idx) => {
                      const satConfig = getSatisfactionFromScore(student.overallScore);
                      const getValueLabel = (key: string) => {
                        const val = student.responses[key];
                        return val ? (VALUE_DISPLAY_LABELS[key]?.[val] || val) : '—';
                      };
                      
                      return (
                        <TableRow key={student.userId} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={student.avatarUrl || undefined} alt={student.studentName} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                  {student.studentName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium whitespace-nowrap">{student.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {student.completedAt 
                              ? format(parseISO(student.completedAt), "dd/MM/yy HH:mm", { locale: ptBR })
                              : <span className="text-amber-600">Pendente</span>}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className="text-xs whitespace-nowrap"
                              style={{ backgroundColor: satConfig.color + '20', color: satConfig.color }}
                            >
                              {satConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{getValueLabel('q2')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q3')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q4')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q6')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q7')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q8')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q9')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q10')}</TableCell>
                          <TableCell className="text-sm">{getValueLabel('q11')}</TableCell>
                          <TableCell>
                            <span className="font-bold text-lg">{student.overallScore}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Student Detail Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedStudent?.avatarUrl || undefined} alt={selectedStudent?.studentName} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {selectedStudent?.studentName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              Respostas de {selectedStudent?.studentName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Header Info */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de conclusão</p>
                    <p className="font-medium">
                      {selectedStudent.completedAt 
                        ? format(parseISO(selectedStudent.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Não concluído'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Tempo</p>
                    <p className="font-medium">
                      {selectedStudent.effectiveTime ? formatTime(selectedStudent.effectiveTime) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Score médio</p>
                    <p className="text-2xl font-bold text-primary">{selectedStudent.overallScore}</p>
                  </div>
                </div>
                
                {/* All Responses */}
                <div className="space-y-3">
                  {Object.entries(selectedStudent.responses).map(([key, value]) => {
                    const questionLabel = QUESTION_LABELS[key] || key;
                    const displayValue = value 
                      ? (VALUE_DISPLAY_LABELS[key]?.[value] || value)
                      : '—';
                    const isOpenText = ['q12', 'q13', 'q16'].includes(key);
                    
                    return (
                      <div key={key} className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">{questionLabel}</p>
                        {isOpenText && value ? (
                          <p className="text-sm bg-muted/30 p-2 rounded italic">"{displayValue}"</p>
                        ) : (
                          <p className="font-medium">{displayValue}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
