import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, Zap, Target, Shield, CheckCircle2, AlertTriangle, 
  ThumbsUp, ThumbsDown, Clock, TrendingUp, Star, Phone
} from 'lucide-react';

interface Day2CallInsightsPopoverProps {
  survey: any;
  day1Survey?: any;
  children: React.ReactNode;
}

const getInsightLevel = (score: number, max: number): 'hot' | 'warm' | 'cold' => {
  const pct = (score / max) * 100;
  if (pct >= 66) return 'hot';
  if (pct >= 33) return 'warm';
  return 'cold';
};

const InsightBadge = ({ level }: { level: 'hot' | 'warm' | 'cold' }) => {
  const config = {
    hot: { label: 'QUENTE', className: 'bg-red-500 text-white' },
    warm: { label: 'MORNO', className: 'bg-amber-500 text-white' },
    cold: { label: 'FRIO', className: 'bg-blue-400 text-white' },
  };
  return <Badge className={config[level].className}>{config[level].label}</Badge>;
};

export function Day2CallInsightsPopover({ survey, day1Survey, children }: Day2CallInsightsPopoverProps) {
  // Extract scores
  const iaScore = survey.score_ia_avivar || 0;
  const licenseScore = survey.score_license || 0;
  const legalScore = survey.score_legal || 0;
  const totalScore = survey.score_total || 0;

  // Determine levels
  const iaLevel = getInsightLevel(iaScore, 18);
  const licenseLevel = getInsightLevel(licenseScore, 18);
  const legalLevel = getInsightLevel(legalScore, 18);

  // Key responses for call preparation
  const keyInsights = {
    avivar: {
      process: survey.q12_avivar_current_process,
      loss: survey.q13_avivar_opportunity_loss,
      timing: survey.q14_avivar_timing,
    },
    license: {
      path: survey.q15_license_path,
      pace: survey.q16_license_pace,
      timing: survey.q17_license_timing,
    },
    legal: {
      feeling: survey.q18_legal_feeling,
      influence: survey.q19_legal_influence,
      timing: survey.q20_legal_timing,
    }
  };

  // Generate call talking points based on responses
  const generateTalkingPoints = () => {
    const points: string[] = [];

    // IA Avivar insights
    if (iaLevel === 'hot') {
      points.push('🔥 ALTA PRIORIDADE - Lead reconhece perda de oportunidades por falta de automação');
      if (keyInsights.avivar.timing === 'O quanto antes') {
        points.push('⚡ Quer implementar automação IMEDIATAMENTE');
      }
    } else if (iaLevel === 'warm') {
      points.push('💡 Mostrar ROI da automação - já sente desgaste no processo manual');
    }

    // License insights
    if (licenseLevel === 'hot') {
      points.push('🎯 FORTE CANDIDATO A LICENÇA - Vê viabilidade e sente exposição no ritmo atual');
      if (keyInsights.license.timing === 'Agora é o momento certo') {
        points.push('🚀 Momento de decisão - pronto para escalar');
      }
    } else if (licenseLevel === 'warm') {
      points.push('📊 Apresentar modelo de licenciamento com números - precisa de construção');
    }

    // Legal insights
    if (legalLevel === 'hot') {
      points.push('⚠️ ALTA INSEGURANÇA JURÍDICA - Dúvidas travando decisões importantes');
    } else if (legalLevel === 'warm') {
      points.push('📋 Abordar compliance e proteção jurídica como diferencial');
    }

    return points;
  };

  const talkingPoints = generateTalkingPoints();

  // Objections to anticipate
  const getObjections = () => {
    const objections: string[] = [];
    
    if (keyInsights.license.path === 'Não é viável para mim hoje') {
      objections.push('Pode alegar falta de capital - mostrar modelo de entrada acessível');
    }
    if (keyInsights.avivar.process?.includes('Funciona bem')) {
      objections.push('Pode resistir à mudança - focar em escala, não em problema atual');
    }
    if (keyInsights.legal.feeling === 'Tranquilo e seguro') {
      objections.push('Não vê urgência jurídica - apresentar casos de risco oculto');
    }

    return objections;
  };

  const objections = getObjections();

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <Phone className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <h4 className="font-semibold">Resumo para Call de Vendas</h4>
            <p className="text-xs text-muted-foreground">Insights combinados D1 + D2</p>
          </div>
          <Badge variant="outline" className="font-bold">
            {totalScore}/54 pts
          </Badge>
        </div>

        {/* Product Interest Summary */}
        <div className="p-3 border-b">
          <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Interesse por Produto
          </h5>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-yellow-500/10">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium">IA Avivar</span>
              <InsightBadge level={iaLevel} />
              <span className="text-[10px] text-muted-foreground">{iaScore}/18</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-500/10">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Licença</span>
              <InsightBadge level={licenseLevel} />
              <span className="text-[10px] text-muted-foreground">{licenseScore}/18</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10">
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium">Jurídico</span>
              <InsightBadge level={legalLevel} />
              <span className="text-[10px] text-muted-foreground">{legalScore}/18</span>
            </div>
          </div>
        </div>

        {/* Talking Points */}
        <div className="p-3 border-b">
          <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
            <Star className="h-3 w-3" />
            Pontos-Chave para Abordar
          </h5>
          <div className="space-y-1.5">
            {talkingPoints.length > 0 ? (
              talkingPoints.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Lead ainda sem pontuação significativa - focar em descoberta
              </p>
            )}
          </div>
        </div>

        {/* Objections */}
        {objections.length > 0 && (
          <div className="p-3 border-b bg-amber-50/50 dark:bg-amber-950/20">
            <h5 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Possíveis Objeções
            </h5>
            <div className="space-y-1.5">
              {objections.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <ThumbsDown className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Responses Quick View */}
        <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
          <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Respostas-Chave (Timing)
          </h5>
          <div className="grid gap-2 text-xs">
            {keyInsights.avivar.timing && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0 text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
                  IA
                </Badge>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{keyInsights.avivar.timing}</span>
              </div>
            )}
            {keyInsights.license.timing && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0 text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
                  LIC
                </Badge>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{keyInsights.license.timing}</span>
              </div>
            )}
            {keyInsights.legal.timing && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0 text-red-600 border-red-300 bg-red-50 dark:bg-red-950">
                  JUR
                </Badge>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{keyInsights.legal.timing}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/30 flex justify-end">
          <span className="text-[10px] text-muted-foreground">
            Classificação: <span className="font-medium">{survey.lead_classification || 'Pendente'}</span>
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
