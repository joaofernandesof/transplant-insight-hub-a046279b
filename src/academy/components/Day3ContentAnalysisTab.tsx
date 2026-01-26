import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { 
  BookOpen, Target, Briefcase, Scale, TrendingUp,
  Lightbulb, Sparkles, CheckCircle2, XCircle, MessageSquare, AlertTriangle, Eye
} from 'lucide-react';
import { Day3SurveyAnalytics } from '@/academy/hooks/useDay3SurveyAnalytics';

interface ContentAnalysisProps {
  analytics: Day3SurveyAnalytics;
}

// Tipo para o modal de detalhes
interface DetailModalData {
  title: string;
  subtitle: string;
  students: {
    name: string;
    avatar: string | null;
    response: string;
    responseLabel: string;
    score?: number;
  }[];
}

// Score colors based on value (0-10)
const getScoreColor = (score: number) => {
  if (score >= 9) return { bg: '#10b981', text: 'Excelente' };
  if (score >= 7.5) return { bg: '#3b82f6', text: 'Bom' };
  if (score >= 5) return { bg: '#eab308', text: 'Regular' };
  if (score >= 2.5) return { bg: '#f97316', text: 'Baixo' };
  return { bg: '#ef4444', text: 'Crítico' };
};

// Get response label for display
const getResponseLabel = (questionKey: string, responseValue: string): string => {
  const labels: Record<string, Record<string, string>> = {
    q3: { muito_fracos: 'Muito fracos', fracos: 'Fracos', adequados: 'Adequados', bons: 'Bons', excelentes: 'Excelentes' },
    q4: { muito_insuficiente: 'Muito insuficiente', insuficiente: 'Insuficiente', adequada: 'Adequada', boa: 'Boa', excelente: 'Excelente' },
    q5: { muito_teorico: 'Muito teórico', mais_teoria: 'Mais teoria', equilibrado: 'Equilibrado', mais_pratica: 'Mais prática', muito_pratico: 'Muito prático' },
    q6: { nenhuma: 'Nenhuma', pouca: 'Pouca', razoavel: 'Razoável', boa: 'Boa', total: 'Total' },
    q7: { nenhuma: 'Nenhuma', baixa: 'Baixa', moderada: 'Moderada', boa: 'Boa', alta: 'Alta' },
    q8: { nada_relevantes: 'Nada relevantes', pouco_relevantes: 'Pouco relevantes', relevantes: 'Relevantes', muito_relevantes: 'Muito relevantes', essenciais: 'Essenciais' },
    q9: { nenhuma: 'Nenhuma', pouca: 'Pouca', razoavel: 'Razoável', boa: 'Boa', muita: 'Muita' },
  };
  return labels[questionKey]?.[responseValue] || responseValue;
};

// Get score for response
const getResponseScore = (questionKey: string, responseValue: string): number => {
  const scores: Record<string, Record<string, number>> = {
    q3: { muito_fracos: 0, fracos: 2.5, adequados: 5, bons: 7.5, excelentes: 10 },
    q4: { muito_insuficiente: 0, insuficiente: 2.5, adequada: 5, boa: 7.5, excelente: 10 },
    q5: { muito_teorico: 2.5, mais_teoria: 5, equilibrado: 10, mais_pratica: 7.5, muito_pratico: 5 },
    q6: { nenhuma: 0, pouca: 2.5, razoavel: 5, boa: 7.5, total: 10 },
    q7: { nenhuma: 0, baixa: 2.5, moderada: 5, boa: 7.5, alta: 10 },
    q8: { nada_relevantes: 0, pouco_relevantes: 2.5, relevantes: 5, muito_relevantes: 7.5, essenciais: 10 },
    q9: { nenhuma: 0, pouca: 2.5, razoavel: 5, boa: 7.5, muita: 10 },
  };
  return scores[questionKey]?.[responseValue] ?? 0;
};

// Content areas configuration
const CONTENT_AREAS = [
  { 
    key: 'foundations', 
    label: 'Fundamentos Técnicos', 
    shortLabel: 'Técnico',
    questionKey: 'q3', 
    icon: BookOpen,
    options: [
      { key: 'muito_fracos', label: 'Muito fracos', score: 0 },
      { key: 'fracos', label: 'Fracos', score: 2.5 },
      { key: 'adequados', label: 'Adequados', score: 5 },
      { key: 'bons', label: 'Bons', score: 7.5 },
      { key: 'excelentes', label: 'Excelentes', score: 10 },
    ]
  },
  { 
    key: 'practical', 
    label: 'Carga Prática', 
    shortLabel: 'Prática',
    questionKey: 'q4', 
    icon: Target,
    options: [
      { key: 'muito_insuficiente', label: 'Muito insuficiente', score: 0 },
      { key: 'insuficiente', label: 'Insuficiente', score: 2.5 },
      { key: 'adequada', label: 'Adequada', score: 5 },
      { key: 'boa', label: 'Boa', score: 7.5 },
      { key: 'excelente', label: 'Excelente', score: 10 },
    ]
  },
  { 
    key: 'management', 
    label: 'Aulas de Gestão', 
    shortLabel: 'Gestão',
    questionKey: 'q8', 
    icon: Briefcase,
    options: [
      { key: 'nada_relevantes', label: 'Nada relevantes', score: 0 },
      { key: 'pouco_relevantes', label: 'Pouco relevantes', score: 2.5 },
      { key: 'relevantes', label: 'Relevantes', score: 5 },
      { key: 'muito_relevantes', label: 'Muito relevantes', score: 7.5 },
      { key: 'essenciais', label: 'Essenciais', score: 10 },
    ]
  },
  { 
    key: 'legal', 
    label: 'Segurança Jurídica', 
    shortLabel: 'Jurídico',
    questionKey: 'q9', 
    icon: Scale,
    options: [
      { key: 'nenhuma', label: 'Nenhuma', score: 0 },
      { key: 'pouca', label: 'Pouca', score: 2.5 },
      { key: 'razoavel', label: 'Razoável', score: 5 },
      { key: 'boa', label: 'Boa', score: 7.5 },
      { key: 'muita', label: 'Muita', score: 10 },
    ]
  },
];

const BALANCE_OPTIONS = [
  { key: 'muito_teorico', label: 'Muito teórico', score: 2.5, color: '#ef4444' },
  { key: 'mais_teoria', label: 'Mais teoria', score: 5, color: '#f97316' },
  { key: 'equilibrado', label: 'Equilibrado', score: 10, color: '#10b981' },
  { key: 'mais_pratica', label: 'Mais prática', score: 7.5, color: '#3b82f6' },
  { key: 'muito_pratico', label: 'Muito prático', score: 5, color: '#8b5cf6' },
];

const SCORE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

export function Day3ContentAnalysisTab({ analytics }: ContentAnalysisProps) {
  const [detailModal, setDetailModal] = useState<DetailModalData | null>(null);

  // Helper function to show students who answered a specific option
  const showStudentsForOption = (areaLabel: string, questionKey: string, optionKey: string, optionLabel: string) => {
    const students = analytics.responsesByStudent
      .filter(s => s.responses[questionKey] === optionKey)
      .map(s => ({
        name: s.studentName,
        avatar: s.avatarUrl,
        response: optionKey,
        responseLabel: optionLabel,
        score: getResponseScore(questionKey, optionKey),
      }));

    setDetailModal({
      title: areaLabel,
      subtitle: `Alunos que responderam: ${optionLabel}`,
      students,
    });
  };

  // Helper to show all students for a metric card
  const showStudentsForMetric = (areaLabel: string, questionKey: string) => {
    const students = analytics.responsesByStudent
      .filter(s => s.responses[questionKey])
      .map(s => ({
        name: s.studentName,
        avatar: s.avatarUrl,
        response: s.responses[questionKey] || '',
        responseLabel: getResponseLabel(questionKey, s.responses[questionKey] || ''),
        score: getResponseScore(questionKey, s.responses[questionKey] || ''),
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    setDetailModal({
      title: areaLabel,
      subtitle: 'Todas as respostas',
      students,
    });
  };

  // Calculate response distribution for each content area
  const contentDistributions = useMemo(() => {
    return CONTENT_AREAS.map(area => {
      const counts: Record<string, number> = {};
      let total = 0;
      
      area.options.forEach(opt => {
        counts[opt.key] = 0;
      });
      
      analytics.responsesByStudent.forEach(student => {
        const response = student.responses[area.questionKey];
        if (response && counts.hasOwnProperty(response)) {
          counts[response]++;
          total++;
        }
      });
      
      return {
        ...area,
        distribution: area.options.map((opt, idx) => ({
          ...opt,
          count: counts[opt.key] || 0,
          percentage: total > 0 ? Math.round((counts[opt.key] / total) * 100) : 0,
          color: SCORE_COLORS[idx],
        })),
        total,
      };
    });
  }, [analytics.responsesByStudent]);

  // Calculate balance distribution
  const balanceData = useMemo(() => {
    let total = 0;
    const counts: Record<string, number> = {};
    
    BALANCE_OPTIONS.forEach(opt => {
      counts[opt.key] = analytics.technicalContent.balanceDistribution[opt.key] || 0;
      total += counts[opt.key];
    });
    
    return BALANCE_OPTIONS.map(opt => ({
      ...opt,
      count: counts[opt.key],
      percentage: total > 0 ? Math.round((counts[opt.key] / total) * 100) : 0,
    }));
  }, [analytics.technicalContent.balanceDistribution]);

  // Radar chart data
  const radarData = [
    { metric: 'Técnico', value: analytics.technicalContent.avgFoundations, fullMark: 10 },
    { metric: 'Prática', value: analytics.technicalContent.avgPracticalLoad, fullMark: 10 },
    { metric: 'Gestão', value: analytics.businessContent.avgManagement, fullMark: 10 },
    { metric: 'Jurídico', value: analytics.businessContent.avgLegalSecurity, fullMark: 10 },
    { metric: 'Clareza', value: analytics.confidence.avgClarity, fullMark: 10 },
    { metric: 'Confiança', value: analytics.confidence.avgConfidence, fullMark: 10 },
  ];

  // Heatmap data
  const heatmapData = useMemo(() => {
    return CONTENT_AREAS.map(area => {
      const row = area.options.map((opt, idx) => {
        const dist = contentDistributions.find(d => d.key === area.key);
        const optData = dist?.distribution.find(d => d.key === opt.key);
        return {
          label: opt.label,
          score: opt.score,
          count: optData?.count || 0,
          percentage: optData?.percentage || 0,
        };
      });
      return { area: area.shortLabel, options: row };
    });
  }, [contentDistributions]);

  // Extract keywords from IMPROVEMENTS (negative/suggestion context)
  const improvementKeywords = useMemo(() => {
    const text = analytics.improvements.join(' ').toLowerCase();
    const wordCounts: Record<string, number> = {};
    
    // Words that indicate areas needing improvement (min 4 chars, meaningful)
    const relevantWords = [
      // Timing/Schedule
      'horário', 'tempo', 'duração', 'cronograma', 'atraso', 'intervalo', 'almoço', 'pausa',
      // Content
      'teoria', 'prática', 'conteúdo', 'superficial', 'aprofundar', 'profundidade', 'básico',
      // Organization
      'organização', 'estrutura', 'planejamento', 'logística', 
      // Infrastructure
      'espaço', 'ambiente', 'ar-condicionado', 'iluminação', 'equipamento',
      // Food/Comfort
      'alimentação', 'refeição', 'lanche', 'coffee', 'comida',
      // Communication
      'comunicação', 'informação', 'antecedência', 'avisar', 
      // Practical
      'hands-on', 'mãos-na-massa', 'treino', 'repetição',
      // General improvements
      'melhorar', 'mais', 'menos', 'faltou', 'precisar'
    ];
    
    relevantWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\w*`, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        wordCounts[word] = matches.length;
      }
    });
    
    return Object.entries(wordCounts)
      .filter(([_, count]) => (count as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 12) as [string, number][];
  }, [analytics.improvements]);

  // Extract keywords from HIGHLIGHTS (positive context)
  const highlightKeywords = useMemo(() => {
    const text = analytics.highlights.join(' ').toLowerCase();
    const wordCounts: Record<string, number> = {};
    
    // Words that indicate positive aspects (min 4 chars, meaningful)
    const relevantWords = [
      // People
      'professor', 'professores', 'instrutor', 'instrutores', 'monitor', 'monitores', 'equipe', 'staff',
      // Technical Quality
      'técnica', 'técnico', 'conhecimento', 'domínio', 'expertise', 'experiência',
      // Teaching Quality
      'didático', 'didática', 'clareza', 'explicação', 'ensino', 'aprendizado',
      // Practical
      'prático', 'prática', 'hands-on', 'aplicável', 'aplicação',
      // Content Quality  
      'conteúdo', 'material', 'apostila', 'qualidade', 'completo',
      // Organization
      'organização', 'estrutura', 'pontualidade',
      // Positive adjectives
      'excelente', 'excepcional', 'ótimo', 'maravilhoso', 'incrível',
      // Attention/Care
      'atenção', 'cuidado', 'suporte', 'disponibilidade', 'dedicação', 'carinho',
      // Network
      'networking', 'colegas', 'turma', 'integração'
    ];
    
    relevantWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\w*`, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        wordCounts[word] = matches.length;
      }
    });
    
    return Object.entries(wordCounts)
      .filter(([_, count]) => (count as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 12) as [string, number][];
  }, [analytics.highlights]);

  // Identify strengths and weaknesses
  const { strengths, weaknesses } = useMemo(() => {
    const areas = [
      { name: 'Fundamentos Técnicos', score: analytics.technicalContent.avgFoundations },
      { name: 'Carga Prática', score: analytics.technicalContent.avgPracticalLoad },
      { name: 'Aulas de Gestão', score: analytics.businessContent.avgManagement },
      { name: 'Segurança Jurídica', score: analytics.businessContent.avgLegalSecurity },
      { name: 'Clareza para Executar', score: analytics.confidence.avgClarity },
      { name: 'Confiança Adquirida', score: analytics.confidence.avgConfidence },
    ].sort((a, b) => b.score - a.score);
    
    return {
      strengths: areas.filter(a => a.score >= 7.5),
      weaknesses: areas.filter(a => a.score < 7.5),
    };
  }, [analytics]);

  // Generate insights
  const insights = useMemo(() => {
    const result: string[] = [];
    
    const avgAll = (analytics.technicalContent.avgFoundations + analytics.technicalContent.avgPracticalLoad + 
      analytics.businessContent.avgManagement + analytics.businessContent.avgLegalSecurity) / 4;
    
    if (avgAll >= 8.5) {
      result.push('✨ O conteúdo do curso está sendo muito bem avaliado de forma geral.');
    }
    
    if (analytics.technicalContent.avgFoundations > analytics.technicalContent.avgPracticalLoad + 1) {
      result.push('⚠️ A teoria está melhor avaliada que a prática. Considere aumentar exercícios práticos.');
    }
    
    if (analytics.businessContent.avgManagement < 7) {
      result.push('📊 As aulas de gestão precisam de mais relevância prática para o dia-a-dia.');
    }
    
    if (analytics.businessContent.avgLegalSecurity < 7) {
      result.push('⚖️ O conteúdo jurídico pode ser reforçado para maior segurança dos alunos.');
    }
    
    const equilibrado = analytics.technicalContent.balanceDistribution['equilibrado'] || 0;
    const total = Object.values(analytics.technicalContent.balanceDistribution).reduce((a, b) => a + b, 0);
    if (total > 0 && equilibrado / total < 0.5) {
      result.push('⚖️ Menos de 50% consideram o equilíbrio teoria/prática ideal.');
    }
    
    if (result.length === 0) {
      result.push('📈 Todos os indicadores de conteúdo estão dentro do esperado.');
    }
    
    return result;
  }, [analytics]);

  return (
    <div className="space-y-4">
      {/* Keywords Clouds FIRST - Above all charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Improvement Keywords */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <TrendingUp className="h-4 w-4" />
              Palavras mais citadas - Melhorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {improvementKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {improvementKeywords.map(([word, count], idx) => (
                  <span 
                    key={word} 
                    className="text-amber-600 dark:text-amber-400 font-medium capitalize"
                    style={{ 
                      fontSize: `${Math.max(12, Math.min(14 + count * 3, 24))}px`,
                      opacity: Math.max(0.6, 1 - idx * 0.05)
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Highlight Keywords */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Palavras mais citadas - Acertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highlightKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {highlightKeywords.map(([word, count], idx) => (
                  <span 
                    key={word} 
                    className="text-emerald-600 dark:text-emerald-400 font-medium capitalize"
                    style={{ 
                      fontSize: `${Math.max(12, Math.min(14 + count * 3, 24))}px`,
                      opacity: Math.max(0.6, 1 - idx * 0.05)
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 9 KPI Cards - Grid 3x3 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1: Satisfação Geral */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
          <div className="h-1 bg-emerald-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Satisfação Geral</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.satisfaction.avgLevel.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(analytics.satisfaction.avgLevel / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Fundamentos Técnicos */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => showStudentsForMetric('Fundamentos Técnicos', 'q3')}>
          <div className="h-1 bg-blue-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Fundamentos Técnicos</span>
              </div>
              <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.technicalContent.avgFoundations.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(analytics.technicalContent.avgFoundations / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Carga Prática */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => showStudentsForMetric('Carga Prática', 'q4')}>
          <div className="h-1 bg-purple-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900/30">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Carga Prática</span>
              </div>
              <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.technicalContent.avgPracticalLoad.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${(analytics.technicalContent.avgPracticalLoad / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Clareza para Executar */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => showStudentsForMetric('Clareza para Executar', 'q6')}>
          <div className="h-1 bg-cyan-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-cyan-100 dark:bg-cyan-900/30">
                  <Lightbulb className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Clareza para Executar</span>
              </div>
              <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.confidence.avgClarity.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${(analytics.confidence.avgClarity / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Confiança */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => showStudentsForMetric('Confiança', 'q7')}>
          <div className="h-1 bg-teal-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-teal-100 dark:bg-teal-900/30">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Confiança</span>
              </div>
              <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.confidence.avgConfidence.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${(analytics.confidence.avgConfidence / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Organização */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
          <div className="h-1 bg-amber-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/30">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Organização</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.experience.avgOrganization.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(analytics.experience.avgOrganization / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Suporte */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
          <div className="h-1 bg-rose-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-rose-100 dark:bg-rose-900/30">
                  <MessageSquare className="h-4 w-4 text-rose-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Suporte</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.experience.avgSupport.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${(analytics.experience.avgSupport / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Aulas de Gestão */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => showStudentsForMetric('Aulas de Gestão', 'q8')}>
          <div className="h-1 bg-indigo-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-indigo-100 dark:bg-indigo-900/30">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Aulas de Gestão</span>
              </div>
              <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.businessContent.avgManagement.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(analytics.businessContent.avgManagement / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 9: Segurança Jurídica */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => showStudentsForMetric('Segurança Jurídica', 'q9')}>
          <div className="h-1 bg-slate-500" />
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-900/30">
                  <Scale className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Segurança Jurídica</span>
              </div>
              <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{analytics.businessContent.avgLegalSecurity.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">/ 10</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-slate-500 rounded-full transition-all"
                style={{ width: `${(analytics.businessContent.avgLegalSecurity / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar + Balance Distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Comparativo de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickCount={6} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Balance Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Equilíbrio Teoria/Prática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={balanceData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ label, percentage }) => percentage > 0 ? `${percentage}%` : ''}
                  labelLine={false}
                >
                  {balanceData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} respostas`, name]} />
                <Legend 
                  layout="horizontal" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Percentage Distribution for Each Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Distribuição de Respostas por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {contentDistributions.map(area => (
              <div key={area.key} className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <area.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{area.label}</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={area.distribution} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      width={100} 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${props.payload.count} (${props.payload.percentage}%)`,
                        ''
                      ]}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                      {area.distribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Mapa de Calor - Avaliações por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Área</th>
                  {['Ruim', 'Baixo', 'Regular', 'Bom', 'Excelente'].map(level => (
                    <th key={level} className="text-center py-2 px-3 font-medium text-muted-foreground text-xs">
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, rowIdx) => {
                  const area = CONTENT_AREAS[rowIdx];
                  return (
                    <tr key={row.area} className="border-t">
                      <td className="py-2 px-3 font-medium">{row.area}</td>
                      {row.options.map((opt, idx) => {
                        const intensity = opt.percentage / 100;
                        const bgColor = SCORE_COLORS[idx];
                        const areaOption = area.options[idx];
                        return (
                          <td 
                            key={idx} 
                            className={`text-center py-2 px-3 ${opt.count > 0 ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
                            style={{ 
                              backgroundColor: intensity > 0 ? `${bgColor}${Math.round(intensity * 0.5 * 255).toString(16).padStart(2, '0')}` : 'transparent'
                            }}
                            onClick={() => opt.count > 0 && showStudentsForOption(area.label, area.questionKey, areaOption.key, areaOption.label)}
                          >
                            <span className="font-semibold">{opt.count}</span>
                            {opt.percentage > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">({opt.percentage}%)</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Escala:</span>
            {SCORE_COLORS.map((color, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span>{['0', '2.5', '5', '7.5', '10'][idx]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {item.score.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum ponto com score ≥ 7.5</p>
            )}
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Pontos a Melhorar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((item, idx) => {
                  // Color by severity: < 6 = red (grave), 6-7.5 = yellow (moderate)
                  const isGrave = item.score < 6;
                  const bgColor = isGrave 
                    ? 'bg-red-50 dark:bg-red-900/20' 
                    : 'bg-amber-50 dark:bg-amber-900/20';
                  const badgeBg = isGrave 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
                  
                  return (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${bgColor}`}>
                      <span className="font-medium text-sm">{item.name}</span>
                      <Badge variant="secondary" className={badgeBg}>
                        {item.score.toFixed(1)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Todos os indicadores estão acima de 7.5!
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {detailModal?.title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{detailModal?.subtitle}</p>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {detailModal?.students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum aluno encontrado
                </p>
              ) : (
                detailModal?.students.map((student, idx) => {
                  const scoreColor = getScoreColor(student.score || 0);
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {student.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.responseLabel}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs shrink-0"
                        style={{ 
                          backgroundColor: scoreColor.bg + '20', 
                          color: scoreColor.bg 
                        }}
                      >
                        {student.score?.toFixed(1)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
