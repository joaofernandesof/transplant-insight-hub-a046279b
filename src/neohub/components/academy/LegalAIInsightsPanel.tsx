import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, 
  Zap, Target, Shield, Users, CheckCircle2,
  ArrowRight, Lightbulb, Scale
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LegalMetrics {
  larisaMetrics: {
    expectations: number;
    clarity: number;
    time: number;
    overall: number;
    totalResponses: number;
    feedbacksPositive: string[];
    feedbacksImprove: string[];
  } | null;
  legalPerception: {
    feelingDist: Record<string, number>;
    influenceDist: Record<string, number>;
    timingDist: Record<string, number>;
    averageScore: number;
    normalizedScore: number;
    leads: { hot: number; warm: number; cold: number };
    total: number;
  } | null;
  examMetrics: {
    title: string;
    average: number;
    min: number;
    max: number;
    approved: number;
    total: number;
    approvalRate: number;
  } | null;
}

interface AIInsights {
  resumoExecutivo?: string;
  diagnosticoJuridico?: {
    nivelRisco: 'alto' | 'medio' | 'baixo';
    percentualInseguros: number;
    principaisDores: string[];
  };
  analiseInstrutora?: {
    nota: number;
    pontoForte: string;
    melhoria: string;
    comparativoTurma: string;
  };
  oportunidadesComerciais?: {
    potencialTotal: number;
    leadsQuentes: number;
    urgenciaMedia: string;
    abordagemSugerida: string;
  };
  acoesSugeridas?: Array<{
    acao: string;
    responsavel: string;
    prazo: string;
    prioridade: number;
  }>;
  alertas?: string[];
}

interface LegalAIInsightsPanelProps {
  metrics: LegalMetrics;
  className?: string;
}

export function LegalAIInsightsPanel({ metrics, className }: LegalAIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const buildPromptData = () => {
    const { larisaMetrics, legalPerception, examMetrics } = metrics;
    
    return {
      instrutora: larisaMetrics ? {
        notaGeral: larisaMetrics.overall.toFixed(1),
        expectativas: larisaMetrics.expectations.toFixed(1),
        clareza: larisaMetrics.clarity.toFixed(1),
        tempo: larisaMetrics.time.toFixed(1),
        totalAvaliacoes: larisaMetrics.totalResponses,
        feedbacksPositivos: larisaMetrics.feedbacksPositive.slice(0, 5),
        feedbacksMelhoria: larisaMetrics.feedbacksImprove.slice(0, 5),
      } : null,
      percepcaoJuridica: legalPerception ? {
        scoreNormalizado: legalPerception.normalizedScore.toFixed(1),
        distribuicaoSentimento: legalPerception.feelingDist,
        distribuicaoInfluencia: legalPerception.influenceDist,
        distribuicaoUrgencia: legalPerception.timingDist,
        leads: legalPerception.leads,
        totalRespostas: legalPerception.total,
      } : null,
      prova: examMetrics ? {
        titulo: examMetrics.title,
        mediaAproveitamento: examMetrics.average.toFixed(0),
        taxaAprovacao: examMetrics.approvalRate.toFixed(0),
        notaMinima: examMetrics.min,
        notaMaxima: examMetrics.max,
      } : null,
    };
  };

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const data = buildPromptData();
      
      const { data: result, error } = await supabase.functions.invoke('legal-ai-insights', {
        body: { 
          metrics: data,
          context: 'Dashboard Jurídico - Módulo de Direito Médico'
        }
      });

      if (error) throw error;

      if (result?.insights) {
        setInsights(result.insights);
        setLastGenerated(new Date());
        toast.success('Insights gerados com sucesso!');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Erro ao gerar insights. Tente novamente.');
      
      // Fallback with local analysis
      generateLocalInsights();
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalInsights = () => {
    const { larisaMetrics, legalPerception, examMetrics } = metrics;
    
    const localInsights: AIInsights = {
      resumoExecutivo: `O módulo jurídico apresenta ${legalPerception?.normalizedScore && legalPerception.normalizedScore >= 6 ? 'bom engajamento' : 'oportunidades de melhoria'} com ${legalPerception?.leads.hot || 0} leads quentes identificados. A Dra. Larissa obteve nota ${larisaMetrics?.overall.toFixed(1) || 'N/A'}/10, ${larisaMetrics && larisaMetrics.overall >= 7.5 ? 'acima da média esperada' : 'com espaço para evolução'}.`,
      
      diagnosticoJuridico: {
        nivelRisco: legalPerception && legalPerception.leads.hot >= legalPerception.total * 0.4 ? 'alto' : 
                   legalPerception && legalPerception.leads.warm >= legalPerception.total * 0.3 ? 'medio' : 'baixo',
        percentualInseguros: legalPerception ? 
          Math.round(((legalPerception.feelingDist['Exposto a riscos'] || 0) + (legalPerception.feelingDist['Inseguro em pontos'] || 0)) / legalPerception.total * 100) : 0,
        principaisDores: [
          'Insegurança com contratos e termos',
          'Dúvidas sobre licenciamento',
          'Medo de processos judiciais'
        ]
      },
      
      analiseInstrutora: larisaMetrics ? {
        nota: larisaMetrics.overall,
        pontoForte: larisaMetrics.clarity >= larisaMetrics.expectations ? 'Clareza didática' : 'Atendimento de expectativas',
        melhoria: larisaMetrics.time < 7 ? 'Gestão do tempo' : 'Aprofundamento técnico',
        comparativoTurma: larisaMetrics.overall >= 8 ? 'Acima da média histórica' : 'Dentro do esperado'
      } : undefined,
      
      oportunidadesComerciais: legalPerception ? {
        potencialTotal: legalPerception.leads.hot + legalPerception.leads.warm,
        leadsQuentes: legalPerception.leads.hot,
        urgenciaMedia: Object.entries(legalPerception.timingDist).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Indefinido',
        abordagemSugerida: legalPerception.leads.hot >= 5 ? 
          'Contato imediato com leads HOT para conversão em 48h' : 
          'Nutrição de leads WARM com conteúdo de autoridade'
      } : undefined,
      
      acoesSugeridas: [
        {
          acao: `Fazer follow-up com ${legalPerception?.leads.hot || 0} leads quentes`,
          responsavel: 'Comercial',
          prazo: '48 horas',
          prioridade: 1
        },
        {
          acao: 'Enviar material complementar sobre proteção jurídica',
          responsavel: 'Marketing',
          prazo: '1 semana',
          prioridade: 2
        },
        {
          acao: 'Agendar calls individuais com leads WARM',
          responsavel: 'Comercial',
          prazo: '1 semana',
          prioridade: 3
        }
      ],
      
      alertas: [
        legalPerception && legalPerception.leads.cold >= legalPerception.total * 0.4 ? 
          '⚠️ Alta taxa de leads frios - revisar qualificação na entrada' : '',
        examMetrics && examMetrics.approvalRate < 70 ? 
          '⚠️ Taxa de aprovação abaixo de 70% - considerar reforço de conteúdo' : '',
        larisaMetrics && larisaMetrics.time < 6 ? 
          '⚠️ Avaliação de tempo abaixo do ideal - considerar ajustar cronograma' : ''
      ].filter(Boolean)
    };
    
    setInsights(localInsights);
    setLastGenerated(new Date());
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-rose-500';
    if (priority === 2) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getRiskColor = (level: string) => {
    if (level === 'alto') return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
    if (level === 'medio') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Análise Inteligente - Módulo Jurídico</CardTitle>
                <CardDescription>
                  Insights gerados por IA com base nos dados coletados
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={generateInsights} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {insights ? 'Atualizar' : 'Gerar Insights'}
                </>
              )}
            </Button>
          </div>
          {lastGenerated && (
            <p className="text-xs text-muted-foreground mt-2">
              Última análise: {lastGenerated.toLocaleString('pt-BR')}
            </p>
          )}
        </CardHeader>
      </Card>

      {isLoading && (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !insights && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Análise de IA Disponível</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Clique em "Gerar Insights" para obter uma análise inteligente 
                dos dados do módulo jurídico com recomendações acionáveis.
              </p>
              <Button onClick={generateInsights} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {insights && (
        <>
          {/* Resumo Executivo */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.resumoExecutivo}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Diagnóstico Jurídico */}
            {insights.diagnosticoJuridico && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-500" />
                    Diagnóstico Jurídico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível de Risco Percebido</span>
                    <Badge className={getRiskColor(insights.diagnosticoJuridico.nivelRisco)}>
                      {insights.diagnosticoJuridico.nivelRisco.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alunos Inseguros</span>
                    <span className="font-bold text-amber-600">
                      {insights.diagnosticoJuridico.percentualInseguros}%
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Principais Dores:</p>
                    <ul className="space-y-1">
                      {insights.diagnosticoJuridico.principaisDores.map((dor, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                          {dor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Análise Instrutora */}
            {insights.analiseInstrutora && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-500" />
                    Análise Dra. Larissa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nota Geral</span>
                    <Badge variant="outline" className="bg-violet-50 text-violet-700">
                      {insights.analiseInstrutora.nota.toFixed(1)}/10
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ponto Forte</span>
                    <span className="text-xs text-emerald-600 font-medium">
                      ✓ {insights.analiseInstrutora.pontoForte}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Oportunidade</span>
                    <span className="text-xs text-amber-600 font-medium">
                      ↑ {insights.analiseInstrutora.melhoria}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {insights.analiseInstrutora.comparativoTurma}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Oportunidades Comerciais */}
            {insights.oportunidadesComerciais && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Oportunidades Comerciais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-2xl font-bold text-emerald-600">
                        {insights.oportunidadesComerciais.potencialTotal}
                      </p>
                      <p className="text-xs text-muted-foreground">Potencial Total</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-2xl font-bold text-rose-600">
                        {insights.oportunidadesComerciais.leadsQuentes}
                      </p>
                      <p className="text-xs text-muted-foreground">Leads HOT</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-1">Abordagem Sugerida:</p>
                    <p className="text-xs text-muted-foreground">
                      {insights.oportunidadesComerciais.abordagemSugerida}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertas */}
            {insights.alertas && insights.alertas.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.alertas.map((alerta, i) => (
                      <li key={i} className="text-sm p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                        {alerta}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ações Sugeridas */}
          {insights.acoesSugeridas && insights.acoesSugeridas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Plano de Ação Sugerido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.acoesSugeridas.map((acao, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(acao.prioridade)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{acao.acao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {acao.responsavel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Prazo: {acao.prazo}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
