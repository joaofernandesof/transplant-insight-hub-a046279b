import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Target, Shield, CheckCircle, XCircle } from 'lucide-react';

interface QuestionAnswer {
  question: string;
  answer: string | null;
  points: number;
  maxPoints: number;
}

interface Day2ScorePopoverProps {
  section: 'ia' | 'license' | 'legal';
  score: number;
  maxScore: number;
  survey: any;
  children: React.ReactNode;
}

const sectionConfig = {
  ia: {
    title: 'IA Avivar',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    questions: [
      { key: 'q12_avivar_current_process', label: 'Como é seu processo de follow-up atual?' },
      { key: 'q13_avivar_opportunity_loss', label: 'Você sente que perde oportunidades por falta de automação?' },
      { key: 'q14_avivar_timing', label: 'Quando você pretende implementar automação?' },
    ]
  },
  license: {
    title: 'Licença',
    icon: Target,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    questions: [
      { key: 'q15_license_path', label: 'Montar uma clínica própria é viável para você?' },
      { key: 'q16_license_pace', label: 'O ritmo atual de crescimento te expõe?' },
      { key: 'q17_license_timing', label: 'Quando você pensa em expandir/escalar?' },
    ]
  },
  legal: {
    title: 'Jurídico',
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    questions: [
      { key: 'q18_legal_feeling', label: 'Como você se sente em relação à parte jurídica?' },
      { key: 'q19_legal_influence', label: 'Dúvidas jurídicas influenciam suas decisões?' },
      { key: 'q20_legal_timing', label: 'Quando você pensa em organizar a parte jurídica?' },
    ]
  }
};

// Score mapping for each answer
const scoreMapping: Record<string, number> = {
  // IA Avivar Q12
  'Tudo depende de pessoas e memória': 0,
  'Tudo manual, depende de pessoas': 0,
  'Uso WhatsApp, mas sem padrão definido': 2,
  'Tenho organização básica, mas com falhas frequentes': 2,
  'Tenho algum sistema, mas é pouco eficiente': 2,
  'Consigo organizar, mas sinto limites claros': 4,
  'Tenho estrutura e quero ganhar escala e previsibilidade': 6,
  // IA Avivar Q13
  'Funciona bem do jeito que está': 0,
  'Não vejo perda de oportunidades': 0,
  'Perco poucas oportunidades': 2,
  'Funciona, mas gera desgaste': 2,
  'Perco bastante, mas consigo lidar': 4,
  'Funciona com perda de oportunidades': 4,
  'Perco muitas oportunidades e isso trava meu crescimento': 6,
  'É um gargalo claro no crescimento': 6,
  // IA Avivar Q14
  'Não é prioridade agora': 0,
  'Quando tiver mais tempo': 2,
  'Nos próximos meses': 4,
  'O quanto antes': 6,
  // License Q15
  'Não é viável para mim hoje': 0,
  'Seria viável apenas com muito planejamento': 2,
  'É viável se o modelo fizer sentido': 4,
  'É totalmente viável para mim': 6,
  // License Q16
  'Não me expõe': 0,
  'Me expõe pouco': 2,
  'Me expõe bastante': 4,
  'É um dos meus principais gargalos': 6,
  // License Q17
  'Não penso nisso no momento': 0,
  'Talvez em um futuro distante': 2,
  // 'Nos próximos meses': 4, // Already defined
  'Agora é o momento certo': 6,
  // Legal Q18
  'Tranquilo e seguro': 0,
  'Um pouco inseguro': 2,
  'Inseguro em alguns pontos': 4,
  'Exposto a riscos que me preocupam': 6,
  // Legal Q19
  'Não influenciam': 0,
  'Influenciam pouco': 2,
  'Influenciam bastante': 4,
  'Travaram ou quase travaram decisões importantes': 6,
  // Legal Q20
  'Não vejo isso como prioridade': 0,
  'Quando o negócio estiver maior': 2,
  // 'Nos próximos meses': 4, // Already defined
  // 'O quanto antes': 6, // Already defined
};

export function Day2ScorePopover({ section, score, maxScore, survey, children }: Day2ScorePopoverProps) {
  const config = sectionConfig[section];
  const Icon = config.icon;

  const getAnswerPoints = (answer: string | null): number => {
    if (!answer) return 0;
    return scoreMapping[answer] || 0;
  };

  const getPointsColor = (points: number): string => {
    if (points >= 6) return 'text-primary';
    if (points >= 4) return 'text-green-600';
    if (points >= 2) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors w-full">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="center">
        {/* Header */}
        <div className={`flex items-center gap-2 p-3 border-b ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
          <div className="flex-1">
            <h4 className="font-semibold">{config.title}</h4>
            <p className="text-xs text-muted-foreground">Respostas detalhadas</p>
          </div>
          <div className="text-right">
            <span className={`text-xl font-bold ${config.color}`}>{score}</span>
            <span className="text-muted-foreground text-sm">/{maxScore}</span>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
          {config.questions.map((q, idx) => {
            const answer = survey[q.key];
            const points = getAnswerPoints(answer);
            
            return (
              <div key={q.key} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Q{idx + 1}
                  </Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {q.label}
                  </p>
                </div>
                
                {answer ? (
                  <div className="flex items-center gap-2 ml-8">
                    <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium">{answer}</p>
                    </div>
                    <Badge className={`${getPointsColor(points)} bg-transparent border shrink-0`}>
                      {points} pts
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 ml-8 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm italic">Não respondido</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with progress */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Pontuação da seção</span>
            <span>{Math.round((score / maxScore) * 100)}%</span>
          </div>
          <Progress value={(score / maxScore) * 100} className="h-2" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
