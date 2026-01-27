/**
 * Legal Module Dashboard - Refactored
 * Complete dashboard with 6 dedicated tabs
 */

import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Star,
  GraduationCap,
  Flame,
  Download,
  Sparkles,
  FileStack,
  Loader2,
  Users,
  HelpCircle,
  UserCheck,
  FileText,
  Printer
} from "lucide-react";
import { LegalAIInsightsPanel } from "./LegalAIInsightsPanel";
import { 
  LegalWidgetInsight,
  generateLarisaOverallInsight,
  generateLegalScoreInsight,
  generateExamInsight,
  generateLeadsInsight,
} from "./LegalWidgetInsight";
import { FeedbackWithAuthor } from "./FeedbackCard";
import { toast } from "sonner";

// Import new tab components
import { 
  LegalOverviewTab, 
  LegalMentorsTab, 
  LegalQuestionsTab,
  LegalStudentsTab,
  LegalFullSurveysTab,
  LegalPrintView,
  type LarissaMetrics,
  type LegalPerception,
  type ExamMetrics,
  type StudentWithScores
} from "./legal";

// Filtro para remover feedbacks sensíveis
const shouldFilterFeedback = (feedback: string): boolean => {
  const text = feedback.toLowerCase();
  if (text.includes('carolina') && (text.includes('falou muito') || text.includes('fala muito') || text.includes('falando muito') || text.includes('falar muito'))) {
    return true;
  }
  return false;
};

interface LegalModuleDashboardProps {
  classId?: string;
}

export function LegalModuleDashboard({ classId }: LegalModuleDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch all survey data WITH user info
  const { data: surveyData, isLoading: loadingSurveys } = useQuery({
    queryKey: ['legal-full-surveys', classId],
    queryFn: async () => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select(`
          user_id,
          q7_larissa_expectations, 
          q8_larissa_clarity, 
          q9_larissa_time, 
          q10_larissa_liked_most, 
          q11_larissa_improve,
          q18_legal_feeling,
          q19_legal_influence,
          q20_legal_timing,
          score_legal,
          score_total,
          lead_classification
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

  // Calculate Larissa metrics
  const calculateLarissaMetrics = (): LarissaMetrics | null => {
    if (!surveyData || surveyData.length === 0) return null;

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

    const expectations = surveyData.map(d => mapExpectation(d.q7_larissa_expectations)).filter(Boolean) as number[];
    const clarity = surveyData.map(d => mapClarity(d.q8_larissa_clarity)).filter(Boolean) as number[];
    const time = surveyData.map(d => mapTime(d.q9_larissa_time)).filter(Boolean) as number[];

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      expectations: avg(expectations),
      clarity: avg(clarity),
      time: avg(time),
      overall: (avg(expectations) + avg(clarity) + avg(time)) / 3,
      totalResponses: surveyData.length,
      feedbacksPositive: surveyData
        .filter(d => d.q10_larissa_liked_most && d.q10_larissa_liked_most.length > 2)
        .map(d => ({ feedback: d.q10_larissa_liked_most as string, userName: d.userName, avatarUrl: d.avatarUrl })) as FeedbackWithAuthor[],
      feedbacksImprove: surveyData
        .filter(d => d.q11_larissa_improve && d.q11_larissa_improve.length > 2)
        .filter(d => !shouldFilterFeedback(d.q11_larissa_improve || ''))
        .map(d => ({ feedback: d.q11_larissa_improve as string, userName: d.userName, avatarUrl: d.avatarUrl })) as FeedbackWithAuthor[]
    };
  };

  // Calculate legal perception
  const calculateLegalPerception = (): LegalPerception | null => {
    if (!surveyData || surveyData.length === 0) return null;

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
      if (v.includes('não')) return 'Não influenciam';
      return 'Outro';
    };

    const normalizeLegalTiming = (val: string): string => {
      const v = val.toLowerCase();
      if (v.includes('quanto antes') || v.includes('urgente') || v.includes('imediato')) return 'O quanto antes';
      if (v.includes('próximos meses')) return 'Próximos meses';
      if (v.includes('maior') || v.includes('crescer')) return 'Quando crescer';
      if (v.includes('prioridade')) return 'Não é prioridade';
      return 'Outro';
    };

    const feelingDist: Record<string, number> = {};
    const influenceDist: Record<string, number> = {};
    const timingDist: Record<string, number> = {};
    const feelingPeople: Record<string, { name: string; avatarUrl?: string | null }[]> = {};
    const influencePeople: Record<string, { name: string; avatarUrl?: string | null }[]> = {};
    const timingPeople: Record<string, { name: string; avatarUrl?: string | null }[]> = {};
    let totalScore = 0;
    let scoreCount = 0;
    const leads = { hot: 0, warm: 0, cold: 0 };
    const leadsPeople: { hot: { name: string; avatarUrl?: string | null }[]; warm: { name: string; avatarUrl?: string | null }[]; cold: { name: string; avatarUrl?: string | null }[] } = { hot: [], warm: [], cold: [] };

    surveyData.forEach(d => {
      const person = { name: d.userName, avatarUrl: d.avatarUrl };

      if (d.q18_legal_feeling) {
        const key = normalizeLegalFeeling(d.q18_legal_feeling);
        feelingDist[key] = (feelingDist[key] || 0) + 1;
        if (!feelingPeople[key]) feelingPeople[key] = [];
        feelingPeople[key].push(person);
      }
      if (d.q19_legal_influence) {
        const key = normalizeLegalInfluence(d.q19_legal_influence);
        influenceDist[key] = (influenceDist[key] || 0) + 1;
        if (!influencePeople[key]) influencePeople[key] = [];
        influencePeople[key].push(person);
      }
      if (d.q20_legal_timing) {
        const key = normalizeLegalTiming(d.q20_legal_timing);
        timingDist[key] = (timingDist[key] || 0) + 1;
        if (!timingPeople[key]) timingPeople[key] = [];
        timingPeople[key].push(person);
      }
      if (d.score_legal !== null) {
        totalScore += d.score_legal;
        scoreCount++;
      }
      if (d.lead_classification === 'hot') {
        leads.hot++;
        leadsPeople.hot.push(person);
      } else if (d.lead_classification === 'warm') {
        leads.warm++;
        leadsPeople.warm.push(person);
      } else if (d.lead_classification === 'cold') {
        leads.cold++;
        leadsPeople.cold.push(person);
      }
    });

    return {
      feelingDist,
      influenceDist,
      timingDist,
      feelingPeople,
      influencePeople,
      timingPeople,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      normalizedScore: scoreCount > 0 ? (totalScore / scoreCount) * 10 / 18 : 0,
      leads,
      leadsPeople,
      total: surveyData.length
    };
  };

  // Calculate exam metrics
  const calculateExamMetrics = (): ExamMetrics | null => {
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

  // Build students with scores
  const buildStudentsWithScores = (): StudentWithScores[] => {
    if (!surveyData) return [];

    const examScoreMap = new Map(
      examData?.attempts?.map(a => [a.user_id, a.score || 0]) || []
    );

    return surveyData.map(s => ({
      userId: s.user_id,
      name: s.userName,
      avatarUrl: s.avatarUrl,
      scoreLegal: s.score_legal || 0,
      scoreNormalized: ((s.score_legal || 0) * 10) / 18,
      classification: (s.lead_classification as 'hot' | 'warm' | 'cold') || 'cold',
      examScore: examScoreMap.get(s.user_id) ?? null,
      examPassed: (examScoreMap.get(s.user_id) || 0) >= 70,
      feeling: s.q18_legal_feeling,
      influence: s.q19_legal_influence,
      timing: s.q20_legal_timing,
      responses: {
        q18_legal_feeling: s.q18_legal_feeling,
        q19_legal_influence: s.q19_legal_influence,
        q20_legal_timing: s.q20_legal_timing,
        q7_larissa_expectations: s.q7_larissa_expectations,
        q8_larissa_clarity: s.q8_larissa_clarity,
        q9_larissa_time: s.q9_larissa_time,
        q10_larissa_liked_most: s.q10_larissa_liked_most,
        q11_larissa_improve: s.q11_larissa_improve,
      }
    }));
  };

  // Calculate all metrics
  const larisaMetrics = calculateLarissaMetrics();
  const legalPerception = calculateLegalPerception();
  const examMetrics = calculateExamMetrics();
  const students = buildStudentsWithScores();

  const isLoading = loadingSurveys || loadingExam;

  // React-to-print hook for high-fidelity PDF - MUST be before any early returns
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Dashboard Jurídico - ${new Date().toISOString().split('T')[0]}`,
    onBeforePrint: async () => {
      setShowPrintView(true);
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setShowPrintView(false);
      setIsExportingAll(false);
      toast.success('PDF gerado com sucesso!');
    },
  });

  const handleExportAllTabs = useCallback(() => {
    setIsExportingAll(true);
    toast.info('Preparando relatório...');
    // Show print view first, then trigger print
    setShowPrintView(true);
    setTimeout(() => {
      handlePrint();
    }, 800);
  }, [handlePrint]);

  const handleExportCurrentTab = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Tab configuration
  const LEGAL_TABS = ['overview', 'mentors', 'questions', 'students', 'surveys', 'ai-insights'];
  const LEGAL_TAB_NAMES: Record<string, string> = {
    'overview': 'Visão Geral',
    'mentors': 'Mentoras',
    'questions': 'Perguntas',
    'students': 'Alunos',
    'surveys': 'Pesquisas',
    'ai-insights': 'IA'
  };

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
        <div className="flex flex-wrap gap-2 no-print">
          <Button 
            onClick={handleExportAllTabs} 
            variant="default" 
            disabled={isExportingAll}
            className="gap-2"
          >
            {isExportingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileStack className="h-4 w-4" />
                Exportar Tudo (PDF)
              </>
            )}
          </Button>
          <Button onClick={handleExportCurrentTab} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Aba
          </Button>
        </div>
      </div>

      {/* Hidden Print View - renders all tabs for PDF */}
      {showPrintView && (
        <div className="fixed left-[-9999px] top-0">
          <LegalPrintView
            ref={printRef}
            larisaMetrics={larisaMetrics}
            legalPerception={legalPerception}
            examMetrics={examMetrics}
            students={students}
          />
        </div>
      )}

      {/* Tabs - moved to top */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Scale className="h-3 w-3 mr-1 hidden sm:inline" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="mentors" className="text-xs sm:text-sm">
            <Users className="h-3 w-3 mr-1 hidden sm:inline" />
            Mentoras
          </TabsTrigger>
          <TabsTrigger value="questions" className="text-xs sm:text-sm">
            <HelpCircle className="h-3 w-3 mr-1 hidden sm:inline" />
            Perguntas
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm">
            <UserCheck className="h-3 w-3 mr-1 hidden sm:inline" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="surveys" className="text-xs sm:text-sm">
            <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
            Pesquisas
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-1 text-xs sm:text-sm">
            <Sparkles className="h-3 w-3" />
            IA
          </TabsTrigger>
        </TabsList>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
            {larisaMetrics && (
              <LegalWidgetInsight 
                {...generateLarisaOverallInsight(larisaMetrics.overall, larisaMetrics.totalResponses)}
              />
            )}
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
            {legalPerception && (
              <LegalWidgetInsight 
                {...generateLegalScoreInsight(legalPerception.normalizedScore, legalPerception.total)}
              />
            )}
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
            <p className="text-xs text-muted-foreground mt-1">Média: {examMetrics?.average.toFixed(0) || '-'}%</p>
            {examMetrics && (
              <LegalWidgetInsight 
                {...generateExamInsight(examMetrics.approvalRate, examMetrics.average)}
              />
            )}
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
            {legalPerception && (
              <LegalWidgetInsight 
                {...generateLeadsInsight(legalPerception.leads.hot, legalPerception.leads.warm, legalPerception.leads.cold, legalPerception.total)}
              />
            )}
          </CardContent>
        </Card>
      </div>

        {/* Tab Contents */}
        <TabsContent value="overview" className="mt-4">
          <LegalOverviewTab 
            larisaMetrics={larisaMetrics}
            legalPerception={legalPerception}
            examMetrics={examMetrics}
            students={students}
          />
        </TabsContent>

        <TabsContent value="mentors" className="mt-4">
          <LegalMentorsTab larisaMetrics={larisaMetrics} />
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <LegalQuestionsTab 
            legalPerception={legalPerception}
            larisaMetrics={larisaMetrics}
          />
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <LegalStudentsTab 
            students={students}
            legalPerception={legalPerception}
          />
        </TabsContent>

        <TabsContent value="surveys" className="mt-4">
          <LegalFullSurveysTab students={students} />
        </TabsContent>

        <TabsContent value="ai-insights" className="mt-4">
          <LegalAIInsightsPanel 
            metrics={{
              larisaMetrics: larisaMetrics ? {
                expectations: larisaMetrics.expectations,
                clarity: larisaMetrics.clarity,
                time: larisaMetrics.time,
                overall: larisaMetrics.overall,
                totalResponses: larisaMetrics.totalResponses,
                feedbacksPositive: larisaMetrics.feedbacksPositive.map(f => f.feedback),
                feedbacksImprove: larisaMetrics.feedbacksImprove.map(f => f.feedback),
              } : null,
              legalPerception,
              examMetrics
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
