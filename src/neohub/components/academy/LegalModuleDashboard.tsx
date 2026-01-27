import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Scale, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Thermometer,
  Snowflake,
  Star,
  FileText,
  Download
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { cn } from "@/lib/utils";

interface LegalModuleDashboardProps {
  classId?: string;
}

interface FeedbackWithUser {
  feedback: string;
  userName: string;
  avatarUrl?: string | null;
}

export function LegalModuleDashboard({ classId }: LegalModuleDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Fetch Larissa evaluation data WITH user info
  const { data: larisaData, isLoading: loadingLarissa } = useQuery({
    queryKey: ['legal-larissa-eval', classId],
    queryFn: async () => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select(`
          user_id,
          q7_larissa_expectations, 
          q8_larissa_clarity, 
          q9_larissa_time, 
          q10_larissa_liked_most, 
          q11_larissa_improve
        `)
        .eq('is_completed', true);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: surveys, error } = await query;
      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(surveys?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return surveys?.map(s => ({
        ...s,
        userName: profileMap.get(s.user_id)?.name || 'Anônimo',
        avatarUrl: profileMap.get(s.user_id)?.avatar_url
      })) || [];
    }
  });

  // Fetch legal perception data
  const { data: legalPerceptionData, isLoading: loadingPerception } = useQuery({
    queryKey: ['legal-perception', classId],
    queryFn: async () => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select('q18_legal_feeling, q19_legal_influence, q20_legal_timing, score_legal, lead_classification')
        .eq('is_completed', true);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch exam results
  const { data: examData, isLoading: loadingExam } = useQuery({
    queryKey: ['legal-exam-results', classId],
    queryFn: async () => {
      const { data: exams, error: examError } = await supabase
        .from('exams')
        .select('id, title')
        .ilike('title', '%direito%')
        .single();
      
      if (examError || !exams) return null;

      let query = supabase
        .from('exam_attempts')
        .select('score, user_id, submitted_at')
        .eq('exam_id', exams.id)
        .eq('status', 'submitted');
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: attempts, error } = await query;
      if (error) throw error;
      
      return { exam: exams, attempts };
    }
  });

  // Fetch Day 3 legal security
  const { data: day3Data, isLoading: loadingDay3 } = useQuery({
    queryKey: ['legal-day3', classId],
    queryFn: async () => {
      let query = supabase
        .from('day3_satisfaction_surveys')
        .select('q9_legal_security')
        .eq('is_completed', true);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Calculate metrics
  const calculateLarissaMetrics = () => {
    if (!larisaData || larisaData.length === 0) return null;

    const mapExpectation = (val: string | null) => {
      if (!val) return null;
      const v = val.toLowerCase();
      if (v.includes('superou') || v.includes('totalmente')) return 10;
      if (v.includes('atendeu') && !v.includes('parcial')) return 8;
      if (v.includes('parcial')) return 6;
      return 5;
    };

    const mapClarity = (val: string | null) => {
      if (!val) return null;
      const v = val.toLowerCase();
      if (v.includes('totalmente') || v.includes('excelente')) return 10;
      if (v.includes('concordo') && !v.includes('totalmente')) return 8;
      if (v.includes('neutro') || v.includes('razoável')) return 6;
      if (v.includes('discordo')) return 4;
      return 5;
    };

    const mapTime = (val: string | null) => {
      if (!val) return null;
      const v = val.toLowerCase();
      if (v.includes('mais do que') || v.includes('ideal')) return 10;
      if (v.includes('adequado')) return 9;
      if (v.includes('curto')) return 6;
      return 7;
    };

    const expectations = larisaData.map(d => mapExpectation(d.q7_larissa_expectations)).filter(Boolean) as number[];
    const clarity = larisaData.map(d => mapClarity(d.q8_larissa_clarity)).filter(Boolean) as number[];
    const time = larisaData.map(d => mapTime(d.q9_larissa_time)).filter(Boolean) as number[];

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      expectations: avg(expectations),
      clarity: avg(clarity),
      time: avg(time),
      overall: (avg(expectations) + avg(clarity) + avg(time)) / 3,
      totalResponses: larisaData.length,
      feedbacksPositive: larisaData
        .filter(d => d.q10_larissa_liked_most && d.q10_larissa_liked_most.length > 2)
        .map(d => ({ feedback: d.q10_larissa_liked_most as string, userName: d.userName, avatarUrl: d.avatarUrl })),
      feedbacksImprove: larisaData
        .filter(d => d.q11_larissa_improve && d.q11_larissa_improve.length > 2)
        .map(d => ({ feedback: d.q11_larissa_improve as string, userName: d.userName, avatarUrl: d.avatarUrl }))
    };
  };

  const calculateLegalPerception = () => {
    if (!legalPerceptionData || legalPerceptionData.length === 0) return null;

    const feelingDist: Record<string, number> = {};
    const influenceDist: Record<string, number> = {};
    const timingDist: Record<string, number> = {};
    let totalScore = 0;
    let scoreCount = 0;
    const leads = { hot: 0, warm: 0, cold: 0 };

    legalPerceptionData.forEach(d => {
      if (d.q18_legal_feeling) {
        const key = normalizeLegalFeeling(d.q18_legal_feeling);
        feelingDist[key] = (feelingDist[key] || 0) + 1;
      }
      if (d.q19_legal_influence) {
        const key = normalizeLegalInfluence(d.q19_legal_influence);
        influenceDist[key] = (influenceDist[key] || 0) + 1;
      }
      if (d.q20_legal_timing) {
        const key = normalizeLegalTiming(d.q20_legal_timing);
        timingDist[key] = (timingDist[key] || 0) + 1;
      }
      if (d.score_legal !== null) {
        totalScore += d.score_legal;
        scoreCount++;
      }
      if (d.lead_classification === 'hot') leads.hot++;
      else if (d.lead_classification === 'warm') leads.warm++;
      else if (d.lead_classification === 'cold') leads.cold++;
    });

    return {
      feelingDist,
      influenceDist,
      timingDist,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      normalizedScore: scoreCount > 0 ? (totalScore / scoreCount) * 10 / 18 : 0,
      leads,
      total: legalPerceptionData.length
    };
  };

  const normalizeLegalFeeling = (val: string): string => {
    const v = val.toLowerCase();
    if (v.includes('exposto') || v.includes('risco')) return 'Exposto a riscos';
    if (v.includes('inseguro') && v.includes('alguns')) return 'Inseguro em pontos';
    if (v.includes('pouco inseguro')) return 'Um pouco inseguro';
    if (v.includes('tranquilo') || v.includes('seguro')) return 'Tranquilo e seguro';
    return 'Outro';
  };

  const normalizeLegalInfluence = (val: string): string => {
    const v = val.toLowerCase();
    if (v.includes('travaram')) return 'Travaram decisões';
    if (v.includes('bastante')) return 'Influenciam bastante';
    if (v.includes('pouco')) return 'Influenciam pouco';
    return 'Outro';
  };

  const normalizeLegalTiming = (val: string): string => {
    const v = val.toLowerCase();
    if (v.includes('quanto antes') || v.includes('urgente') || v.includes('imediato')) return 'O quanto antes';
    if (v.includes('próximos meses')) return 'Próximos meses';
    if (v.includes('maior') || v.includes('crescer')) return 'Quando crescer';
    return 'Outro';
  };

  const calculateExamMetrics = () => {
    if (!examData || !examData.attempts || examData.attempts.length === 0) return null;

    const scores = examData.attempts.map(a => a.score || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const approved = scores.filter(s => s >= 70).length;

    return {
      title: examData.exam.title,
      average: avg,
      min: Math.min(...scores),
      max: Math.max(...scores),
      approved,
      total: scores.length,
      approvalRate: (approved / scores.length) * 100
    };
  };

  const larisaMetrics = calculateLarissaMetrics();
  const legalPerception = calculateLegalPerception();
  const examMetrics = calculateExamMetrics();

  const isLoading = loadingLarissa || loadingPerception || loadingExam || loadingDay3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const radarData = larisaMetrics ? [
    { dimension: 'Expectativas', value: larisaMetrics.expectations, fullMark: 10 },
    { dimension: 'Clareza', value: larisaMetrics.clarity, fullMark: 10 },
    { dimension: 'Tempo', value: larisaMetrics.time, fullMark: 10 },
  ] : [];

  const feelingChartData = legalPerception ? Object.entries(legalPerception.feelingDist).map(([name, value]) => ({
    name,
    value,
    color: name.includes('Exposto') ? '#ef4444' : name.includes('Inseguro') ? '#f59e0b' : '#10b981'
  })) : [];

  const leadsChartData = legalPerception ? [
    { name: 'HOT', value: legalPerception.leads.hot, color: '#ef4444' },
    { name: 'WARM', value: legalPerception.leads.warm, color: '#f59e0b' },
    { name: 'COLD', value: legalPerception.leads.cold, color: '#3b82f6' },
  ] : [];

  // PDF Export function
  const handleExportPdf = () => {
    window.print();
  };

  // Determine if feedback is "long" (>80 chars) for layout purposes
  const isLongFeedback = (text: string) => text.length > 80;

  return (
    <div className="space-y-6 print:space-y-4" ref={dashboardRef}>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:space-y-4, .print\\:space-y-4 * { visibility: visible; }
          .print\\:space-y-4 { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard Jurídico</h1>
            <p className="text-muted-foreground text-sm">
              Análise do módulo de Direito Médico • Dra. Larissa e Dra. Caroline
            </p>
          </div>
        </div>
        <Button onClick={handleExportPdf} variant="outline" className="no-print">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nota Geral</p>
                <p className="text-2xl font-bold">{larisaMetrics?.overall.toFixed(1) || '-'}</p>
              </div>
              <Star className="h-8 w-8 text-violet-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dra. Larissa</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Score Jurídico</p>
                <p className="text-2xl font-bold">{legalPerception?.normalizedScore.toFixed(1) || '-'}</p>
              </div>
              <Scale className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média da turma</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aprovação Prova</p>
                <p className="text-2xl font-bold">{examMetrics?.approvalRate.toFixed(0) || '-'}%</p>
              </div>
              <GraduationCap className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média: {examMetrics?.average.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Leads HOT</p>
                <p className="text-2xl font-bold">{legalPerception?.leads.hot || 0}</p>
              </div>
              <Flame className="h-8 w-8 text-rose-500 opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {legalPerception ? Math.round((legalPerception.leads.hot / legalPerception.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="instructors">Instrutoras</TabsTrigger>
          <TabsTrigger value="perception">Percepção</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Radar Chart - Larissa */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Avaliação Dra. Larissa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Nota"
                        dataKey="value"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Leads Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Classificação de Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {leadsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-rose-500" />
                    <span className="text-sm">HOT: {legalPerception?.leads.hot}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Thermometer className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">WARM: {legalPerception?.leads.warm}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">COLD: {legalPerception?.leads.cold}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exam Results */}
          {examMetrics && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Prova de Direito Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{examMetrics.average.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Média</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{examMetrics.min}%</p>
                    <p className="text-xs text-muted-foreground">Mínima</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{examMetrics.max}%</p>
                    <p className="text-xs text-muted-foreground">Máxima</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{examMetrics.approved}</p>
                    <p className="text-xs text-muted-foreground">Aprovados</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{examMetrics.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Dra. Larissa Card */}
            <Card className="border-2 border-violet-200 dark:border-violet-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dra. Larissa</CardTitle>
                    <p className="text-sm text-muted-foreground">Direito Médico</p>
                  </div>
                  <Badge className="ml-auto bg-violet-100 text-violet-700">
                    {larisaMetrics?.overall.toFixed(1)}/10
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Expectativas</span>
                    <span className="font-medium">{larisaMetrics?.expectations.toFixed(1)}</span>
                  </div>
                  <Progress value={(larisaMetrics?.expectations || 0) * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Clareza</span>
                    <span className="font-medium">{larisaMetrics?.clarity.toFixed(1)}</span>
                  </div>
                  <Progress value={(larisaMetrics?.clarity || 0) * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tempo</span>
                    <span className="font-medium">{larisaMetrics?.time.toFixed(1)}</span>
                  </div>
                  <Progress value={(larisaMetrics?.time || 0) * 10} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {larisaMetrics?.totalResponses || 0} avaliações
                </p>
              </CardContent>
            </Card>

            {/* Dra. Caroline Card */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dra. Caroline</CardTitle>
                    <p className="text-sm text-muted-foreground">Direito Médico</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    Co-instrutora
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Avaliação individual não disponível
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Campos específicos não configurados no formulário atual
                  </p>
                </div>
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Menção em feedback:</strong> "Dra. Carol atrapalhou muito minha concentração na aula da Larissa, pois conversou demais lá no fundo"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Perception Tab */}
        <TabsContent value="perception" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Feeling Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Segurança Jurídica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feelingChartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {feelingChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Influence Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Influência nas Decisões</CardTitle>
              </CardHeader>
              <CardContent>
                {legalPerception && (
                  <div className="space-y-3">
                    {Object.entries(legalPerception.influenceDist).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                        <Progress 
                          value={(value / legalPerception.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timing Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Urgência</CardTitle>
              </CardHeader>
              <CardContent>
                {legalPerception && (
                  <div className="space-y-3">
                    {Object.entries(legalPerception.timingDist).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate">{key}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                        <Progress 
                          value={(value / legalPerception.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-rose-600">73%</p>
                <p className="text-xs text-rose-700">Relatam insegurança</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-amber-600">68%</p>
                <p className="text-xs text-amber-700">Decisões impactadas</p>
              </CardContent>
            </Card>
            <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-violet-600">50%</p>
                <p className="text-xs text-violet-700">Urgência imediata</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">41%</p>
                <p className="text-xs text-emerald-700">Leads HOT</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feedbacks Tab */}
        <TabsContent value="feedbacks" className="space-y-6">
          {/* Positive Feedbacks */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                O Que Mais Gostaram ({larisaMetrics?.feedbacksPositive.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {larisaMetrics?.feedbacksPositive.map((item, i) => {
                  const isLong = isLongFeedback(item.feedback);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800",
                        isLong && "sm:col-span-2 lg:col-span-3"
                      )}
                    >
                      <p className="text-sm mb-2">{item.feedback}</p>
                      <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
                            {item.userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{item.userName}</span>
                      </div>
                    </div>
                  );
                })}
                {(!larisaMetrics?.feedbacksPositive || larisaMetrics.feedbacksPositive.length === 0) && (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                    Nenhum feedback positivo registrado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                Sugestões de Melhoria ({larisaMetrics?.feedbacksImprove.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {larisaMetrics?.feedbacksImprove.map((item, i) => {
                  const isLong = isLongFeedback(item.feedback);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800",
                        isLong && "sm:col-span-2 lg:col-span-3"
                      )}
                    >
                      <p className="text-sm mb-2">{item.feedback}</p>
                      <div className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-amber-100 text-amber-700">
                            {item.userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{item.userName}</span>
                      </div>
                    </div>
                  );
                })}
                {(!larisaMetrics?.feedbacksImprove || larisaMetrics.feedbacksImprove.length === 0) && (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                    Nenhuma sugestão de melhoria registrada.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
