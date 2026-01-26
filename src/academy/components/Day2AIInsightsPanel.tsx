import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, 
  Zap, Target, Shield, Users, Clock, CheckCircle2,
  ArrowRight, Lightbulb, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Day2SurveyData {
  surveys: any[];
  className: string;
}

interface AIInsights {
  resumoExecutivo?: string;
  scoreGeral?: number;
  pontosCriticos?: Array<{
    area: string;
    problema: string;
    urgencia: 'alta' | 'media' | 'baixa';
    impacto: 'alto' | 'medio' | 'baixo';
  }>;
  oportunidadesComerciais?: {
    iaAvivar?: { potencial: string; leadsProntos: number; insight: string; abordagem: string };
    licenca?: { potencial: string; leadsProntos: number; insight: string; abordagem: string };
    juridico?: { potencial: string; leadsProntos: number; insight: string; abordagem: string };
  };
  analiseInstrutores?: {
    joao?: { nota: number; pontoForte: string; melhoria: string };
    larissa?: { nota: number; pontoForte: string; melhoria: string };
  };
  acoesSugeridas?: Array<{
    acao: string;
    responsavel: string;
    prazo: string;
    prioridade: number;
  }>;
  alertas?: string[];
  tendencias?: string[];
  rawContent?: string;
}

interface Day2AIInsightsPanelProps {
  surveys: any[];
  className: string;
}

export function Day2AIInsightsPanel({ surveys, className }: Day2AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const buildSurveyData = () => {
    const completed = surveys.filter(s => s.is_completed);
    const partial = surveys.filter(s => !s.is_completed);

    // Score averages (normalize to 0-10 scale)
    // Raw scores: ia/license/legal = 0-18 each, total = 0-54
    const normalize18to10 = (score: number) => Math.min(10, (score / 18) * 10);
    const normalize54to10 = (score: number) => Math.min(10, (score / 54) * 10);
    
    const avgScoreTotal = surveys.length ? normalize54to10(surveys.reduce((acc, s) => acc + (s.score_total || 0), 0) / surveys.length) : 0;
    const avgScoreIA = surveys.length ? normalize18to10(surveys.reduce((acc, s) => acc + (s.score_ia_avivar || 0), 0) / surveys.length) : 0;
    const avgScoreLicense = surveys.length ? normalize18to10(surveys.reduce((acc, s) => acc + (s.score_license || 0), 0) / surveys.length) : 0;
    const avgScoreLegal = surveys.length ? normalize18to10(surveys.reduce((acc, s) => acc + (s.score_legal || 0), 0) / surveys.length) : 0;

    // Lead classification
    const hotLeads = surveys.filter(s => s.lead_classification === 'hot' || s.score_total >= 40).length;
    const warmLeads = surveys.filter(s => s.lead_classification === 'warm' || (s.score_total >= 25 && s.score_total < 40)).length;
    const coldLeads = surveys.filter(s => s.lead_classification === 'cold' || s.score_total < 25).length;

    // Instructor metrics (simplified)
    const joaoExpectations = surveys.filter(s => s.q2_joao_expectations).map(s => {
      const val = s.q2_joao_expectations;
      if (val?.includes('superou')) return 5;
      if (val?.includes('atendeu')) return 4;
      if (val?.includes('parcialmente')) return 3;
      return 2;
    });
    const joaoClarity = surveys.filter(s => s.q3_joao_clarity).map(s => {
      const val = s.q3_joao_clarity;
      if (val?.includes('Muito')) return 5;
      if (val?.includes('Claro')) return 4;
      if (val?.includes('Razoável')) return 3;
      return 2;
    });
    const joaoTime = surveys.filter(s => s.q4_joao_time).map(s => {
      const val = s.q4_joao_time;
      if (val?.includes('Ideal')) return 5;
      if (val?.includes('Adequado')) return 4;
      if (val?.includes('poderia')) return 3;
      return 2;
    });

    const larissaExpectations = surveys.filter(s => s.q7_larissa_expectations).map(s => {
      const val = s.q7_larissa_expectations;
      if (val?.includes('superou')) return 5;
      if (val?.includes('atendeu')) return 4;
      if (val?.includes('parcialmente')) return 3;
      return 2;
    });
    const larissaClarity = surveys.filter(s => s.q8_larissa_clarity).map(s => {
      const val = s.q8_larissa_clarity;
      if (val?.includes('Muito')) return 5;
      if (val?.includes('Claro')) return 4;
      if (val?.includes('Razoável')) return 3;
      return 2;
    });
    const larissaTime = surveys.filter(s => s.q9_larissa_time).map(s => {
      const val = s.q9_larissa_time;
      if (val?.includes('Ideal')) return 5;
      if (val?.includes('Adequado')) return 4;
      if (val?.includes('poderia')) return 3;
      return 2;
    });

    // BNT counters
    const countResponses = (field: string) => {
      const counts: Record<string, number> = {};
      surveys.forEach(s => {
        const val = s[field];
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      return counts;
    };

    return {
      totalResponses: surveys.length,
      completedResponses: completed.length,
      partialResponses: partial.length,
      completionRate: surveys.length ? (completed.length / surveys.length) * 100 : 0,
      avgScoreTotal,
      avgScoreIA,
      avgScoreLicense,
      avgScoreLegal,
      hotLeads,
      warmLeads,
      coldLeads,
      instructorMetrics: {
        joao: {
          avgExpectations: joaoExpectations.length ? joaoExpectations.reduce((a, b) => a + b, 0) / joaoExpectations.length : 0,
          avgClarity: joaoClarity.length ? joaoClarity.reduce((a, b) => a + b, 0) / joaoClarity.length : 0,
          avgTime: joaoTime.length ? joaoTime.reduce((a, b) => a + b, 0) / joaoTime.length : 0,
          strengths: surveys.map(s => s.q5_joao_liked_most).filter(Boolean).slice(0, 5),
          improvements: surveys.map(s => s.q6_joao_improve).filter(Boolean).slice(0, 5),
        },
        larissa: {
          avgExpectations: larissaExpectations.length ? larissaExpectations.reduce((a, b) => a + b, 0) / larissaExpectations.length : 0,
          avgClarity: larissaClarity.length ? larissaClarity.reduce((a, b) => a + b, 0) / larissaClarity.length : 0,
          avgTime: larissaTime.length ? larissaTime.reduce((a, b) => a + b, 0) / larissaTime.length : 0,
          strengths: surveys.map(s => s.q10_larissa_liked_most).filter(Boolean).slice(0, 5),
          improvements: surveys.map(s => s.q11_larissa_improve).filter(Boolean).slice(0, 5),
        },
      },
      iaAvivar: {
        currentProcess: countResponses('q12_avivar_current_process'),
        opportunityLoss: countResponses('q13_avivar_opportunity_loss'),
        timing: countResponses('q14_avivar_timing'),
      },
      license: {
        path: countResponses('q15_license_path'),
        pace: countResponses('q16_license_pace'),
        timing: countResponses('q17_license_timing'),
      },
      legal: {
        feeling: countResponses('q18_legal_feeling'),
        influence: countResponses('q19_legal_influence'),
        timing: countResponses('q20_legal_timing'),
      },
    };
  };

  const generateInsights = async () => {
    if (surveys.length === 0) {
      toast.error('Não há dados suficientes para gerar análise');
      return;
    }

    setIsLoading(true);
    try {
      const surveyData = buildSurveyData();
      
      const { data, error } = await supabase.functions.invoke('analyze-day2-survey-insights', {
        body: { surveyData, className }
      });

      if (error) throw error;
      
      setInsights(data.insights);
      setLastGenerated(new Date());
      toast.success('Análise gerada com sucesso!');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Erro ao gerar análise. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPotentialBadge = (potencial?: string) => {
    switch (potencial) {
      case 'alto':
        return <Badge className="bg-green-500 text-white">Alto Potencial</Badge>;
      case 'medio':
        return <Badge className="bg-yellow-500 text-white">Médio Potencial</Badge>;
      default:
        return <Badge variant="secondary">Baixo Potencial</Badge>;
    }
  };

  const getUrgencyBadge = (urgencia?: string) => {
    switch (urgencia) {
      case 'alta':
        return <Badge className="bg-red-500 text-white">Urgente</Badge>;
      case 'media':
        return <Badge className="bg-orange-500 text-white">Média</Badge>;
      default:
        return <Badge variant="outline">Baixa</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Gerando Análise de IA...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise de IA
          </CardTitle>
          <CardDescription>
            Gere insights automáticos sobre os leads e oportunidades comerciais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateInsights} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Análise com IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Análise de IA - Dia 2</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {lastGenerated && (
                <span className="text-xs text-muted-foreground">
                  Gerado em {lastGenerated.toLocaleString('pt-BR')}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={generateInsights}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Score Geral */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Score Geral da Turma</span>
                <span className="text-2xl font-bold text-primary">{insights.scoreGeral || 0}/100</span>
              </div>
              <Progress value={insights.scoreGeral || 0} className="h-2" />
            </div>
          </div>

          {/* Resumo Executivo */}
          {insights.resumoExecutivo && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm leading-relaxed">{insights.resumoExecutivo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Oportunidades Comerciais */}
      {insights.oportunidadesComerciais && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Oportunidades Comerciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* IA Avivar */}
              <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">IA Avivar</span>
                  {getPotentialBadge(insights.oportunidadesComerciais.iaAvivar?.potencial)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insights.oportunidadesComerciais.iaAvivar?.insight}
                </p>
                {insights.oportunidadesComerciais.iaAvivar?.leadsProntos > 0 && (
                  <div className="flex items-center gap-1 text-sm font-medium text-purple-600">
                    <Users className="h-4 w-4" />
                    {insights.oportunidadesComerciais.iaAvivar.leadsProntos} leads prontos
                  </div>
                )}
                {insights.oportunidadesComerciais.iaAvivar?.abordagem && (
                  <div className="mt-2 p-2 rounded bg-white/50 dark:bg-black/20">
                    <p className="text-xs"><strong>Abordagem:</strong> {insights.oportunidadesComerciais.iaAvivar.abordagem}</p>
                  </div>
                )}
              </div>

              {/* Licença */}
              <div className="p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  <span className="font-medium">Licença R$ 80k</span>
                  {getPotentialBadge(insights.oportunidadesComerciais.licenca?.potencial)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insights.oportunidadesComerciais.licenca?.insight}
                </p>
                {insights.oportunidadesComerciais.licenca?.leadsProntos > 0 && (
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <Users className="h-4 w-4" />
                    {insights.oportunidadesComerciais.licenca.leadsProntos} leads prontos
                  </div>
                )}
                {insights.oportunidadesComerciais.licenca?.abordagem && (
                  <div className="mt-2 p-2 rounded bg-white/50 dark:bg-black/20">
                    <p className="text-xs"><strong>Abordagem:</strong> {insights.oportunidadesComerciais.licenca.abordagem}</p>
                  </div>
                )}
              </div>

              {/* Jurídico */}
              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Jurídico</span>
                  {getPotentialBadge(insights.oportunidadesComerciais.juridico?.potencial)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insights.oportunidadesComerciais.juridico?.insight}
                </p>
                {insights.oportunidadesComerciais.juridico?.leadsProntos > 0 && (
                  <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                    <Users className="h-4 w-4" />
                    {insights.oportunidadesComerciais.juridico.leadsProntos} leads prontos
                  </div>
                )}
                {insights.oportunidadesComerciais.juridico?.abordagem && (
                  <div className="mt-2 p-2 rounded bg-white/50 dark:bg-black/20">
                    <p className="text-xs"><strong>Abordagem:</strong> {insights.oportunidadesComerciais.juridico.abordagem}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pontos Críticos */}
      {insights.pontosCriticos && insights.pontosCriticos.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Pontos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.pontosCriticos.map((ponto, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{ponto.area}</span>
                    {getUrgencyBadge(ponto.urgencia)}
                  </div>
                  <p className="text-sm text-muted-foreground">{ponto.problema}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise dos Instrutores */}
      {insights.analiseInstrutores && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Análise dos Instrutores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {insights.analiseInstrutores.joao && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">João</span>
                    <Badge variant="outline">{insights.analiseInstrutores.joao.nota}/10</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{insights.analiseInstrutores.joao.pontoForte}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>{insights.analiseInstrutores.joao.melhoria}</span>
                    </div>
                  </div>
                </div>
              )}
              {insights.analiseInstrutores.larissa && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Larissa</span>
                    <Badge variant="outline">{insights.analiseInstrutores.larissa.nota}/10</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{insights.analiseInstrutores.larissa.pontoForte}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>{insights.analiseInstrutores.larissa.melhoria}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Sugeridas */}
      {insights.acoesSugeridas && insights.acoesSugeridas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="h-5 w-5 text-primary" />
              Ações Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.acoesSugeridas.sort((a, b) => a.prioridade - b.prioridade).map((acao, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {acao.prioridade}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{acao.acao}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="capitalize">{acao.responsavel}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {acao.prazo === 'imediato' ? 'Imediato' : acao.prazo === 'proximo_dia' ? 'Próximo dia' : 'Fim do curso'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas e Tendências */}
      {(insights.alertas?.length > 0 || insights.tendencias?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {insights.alertas && insights.alertas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {insights.alertas.map((alerta, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      {alerta}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {insights.tendencias && insights.tendencias.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Tendências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {insights.tendencias.map((tendencia, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      {tendencia}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Raw content fallback */}
      {insights.rawContent && !insights.resumoExecutivo && (
        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap text-sm">{insights.rawContent}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
