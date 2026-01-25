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

const getInsightLevel = (score: number, answeredCount: number): 'hot' | 'warm' | 'cold' | 'pending' => {
  if (answeredCount === 0) return 'pending';
  const maxPossible = answeredCount * 6; // 6pts per question
  const pct = (score / maxPossible) * 100;
  if (pct >= 66) return 'hot';
  if (pct >= 33) return 'warm';
  return 'cold';
};

const InsightBadge = ({ level }: { level: 'hot' | 'warm' | 'cold' | 'pending' }) => {
  const config = {
    hot: { label: 'QUENTE', className: 'bg-red-500 text-white' },
    warm: { label: 'MORNO', className: 'bg-amber-500 text-white' },
    cold: { label: 'FRIO', className: 'bg-blue-400 text-white' },
    pending: { label: 'PENDENTE', className: 'bg-gray-400 text-white' },
  };
  return <Badge className={config[level].className}>{config[level].label}</Badge>;
};

export function Day2CallInsightsPopover({ survey, day1Survey, children }: Day2CallInsightsPopoverProps) {
  // Count answered questions per section
  const iaAnswered = [survey.q12_avivar_current_process, survey.q13_avivar_opportunity_loss, survey.q14_avivar_timing].filter(Boolean).length;
  const licenseAnswered = [survey.q15_license_path, survey.q16_license_pace, survey.q17_license_timing].filter(Boolean).length;
  const legalAnswered = [survey.q18_legal_feeling, survey.q19_legal_influence, survey.q20_legal_timing].filter(Boolean).length;

  // Calculate scores from responses
  const iaScoreMap: Record<string, number> = {
    'Tudo depende de pessoas e memória': 0, 'Tudo manual, depende de pessoas': 0,
    'Uso WhatsApp, mas sem padrão definido': 2, 'Tenho organização básica, mas com falhas frequentes': 2,
    'Tenho algum sistema, mas é pouco eficiente': 2, 'Consigo organizar, mas sinto limites claros': 4,
    'Tenho estrutura e quero ganhar escala e previsibilidade': 6,
    'Funciona bem do jeito que está': 0, 'Não vejo perda de oportunidades': 0,
    'Perco poucas oportunidades': 2, 'Funciona, mas gera desgaste': 2,
    'Perco bastante, mas consigo lidar': 4, 'Funciona com perda de oportunidades': 4,
    'Perco muitas oportunidades e isso trava meu crescimento': 6, 'É um gargalo claro no crescimento': 6,
    'Não é prioridade agora': 0, 'Quando tiver mais tempo': 2, 'Nos próximos meses': 4, 'O quanto antes': 6,
  };
  const licenseScoreMap: Record<string, number> = {
    'Não é viável para mim hoje': 0, 'Seria viável apenas com muito planejamento': 2,
    'É viável se o modelo fizer sentido': 4, 'É totalmente viável para mim': 6,
    'Não me expõe': 0, 'Me expõe pouco': 2, 'Me expõe bastante': 4, 'É um dos meus principais gargalos': 6,
    'Não penso nisso no momento': 0, 'Talvez em um futuro distante': 2, 'Nos próximos meses': 4, 'Agora é o momento certo': 6,
  };
  const legalScoreMap: Record<string, number> = {
    'Tranquilo e seguro': 0, 'Um pouco inseguro': 2, 'Inseguro em alguns pontos': 4, 'Exposto a riscos que me preocupam': 6,
    'Não influenciam': 0, 'Influenciam pouco': 2, 'Influenciam bastante': 4, 'Travaram ou quase travaram decisões importantes': 6,
    'Não vejo isso como prioridade': 0, 'Quando o negócio estiver maior': 2, 'Nos próximos meses': 4, 'O quanto antes': 6,
  };

  let iaScore = 0, licenseScore = 0, legalScore = 0;
  if (survey.q12_avivar_current_process) iaScore += iaScoreMap[survey.q12_avivar_current_process] || 0;
  if (survey.q13_avivar_opportunity_loss) iaScore += iaScoreMap[survey.q13_avivar_opportunity_loss] || 0;
  if (survey.q14_avivar_timing) iaScore += iaScoreMap[survey.q14_avivar_timing] || 0;
  if (survey.q15_license_path) licenseScore += licenseScoreMap[survey.q15_license_path] || 0;
  if (survey.q16_license_pace) licenseScore += licenseScoreMap[survey.q16_license_pace] || 0;
  if (survey.q17_license_timing) licenseScore += licenseScoreMap[survey.q17_license_timing] || 0;
  if (survey.q18_legal_feeling) legalScore += legalScoreMap[survey.q18_legal_feeling] || 0;
  if (survey.q19_legal_influence) legalScore += legalScoreMap[survey.q19_legal_influence] || 0;
  if (survey.q20_legal_timing) legalScore += legalScoreMap[survey.q20_legal_timing] || 0;

  const totalScore = iaScore + licenseScore + legalScore;
  const totalAnswered = iaAnswered + licenseAnswered + legalAnswered;

  // Determine levels based on WEIGHTED percentage (not absolute)
  const iaLevel = getInsightLevel(iaScore, iaAnswered);
  const licenseLevel = getInsightLevel(licenseScore, licenseAnswered);
  const legalLevel = getInsightLevel(legalScore, legalAnswered);

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
            {totalScore}/{totalAnswered * 6} pts
          </Badge>
        </div>

        {/* Product Interest Summary */}
        <div className="p-3 border-b">
          <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Interesse por Produto (ponderado)
          </h5>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-500/10">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">IA Avivar</span>
              <InsightBadge level={iaLevel} />
              <span className="text-[10px] text-muted-foreground">
                {iaScore}/{iaAnswered * 6} ({iaAnswered}/3 resp)
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10">
              <Target className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium">Licença</span>
              <InsightBadge level={licenseLevel} />
              <span className="text-[10px] text-muted-foreground">
                {licenseScore}/{licenseAnswered * 6} ({licenseAnswered}/3 resp)
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-500/10">
              <Shield className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-medium">Jurídico</span>
              <InsightBadge level={legalLevel} />
              <span className="text-[10px] text-muted-foreground">
                {legalScore}/{legalAnswered * 6} ({legalAnswered}/3 resp)
              </span>
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
