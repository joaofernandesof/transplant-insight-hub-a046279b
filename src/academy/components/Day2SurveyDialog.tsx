import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDay2Survey } from '../hooks/useDay2Survey';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, Smile, Meh, Frown, ThumbsUp, ThumbsDown, Clock, Zap, Target, Shield, Calendar, MessageSquare } from 'lucide-react';

interface Day2SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onComplete?: () => void;
}

// Question definitions
const QUESTIONS = [
  // Section 1: Satisfação Geral
  {
    key: 'q1_satisfaction_level',
    text: 'No geral, qual é o seu nível de satisfação com o curso, até agora?',
    type: 'radio',
    category: 'Satisfação Geral',
    options: [
      { value: 'Muito insatisfeito', icon: <Frown className="h-5 w-5 text-red-500" /> },
      { value: 'Insatisfeito', icon: <Frown className="h-5 w-5 text-orange-500" /> },
      { value: 'Neutro', icon: <Meh className="h-5 w-5 text-yellow-500" /> },
      { value: 'Satisfeito', icon: <Smile className="h-5 w-5 text-lime-500" /> },
      { value: 'Muito satisfeito', icon: <Smile className="h-5 w-5 text-green-500" /> }
    ]
  },
  // Section 2: Aula João Fernandes
  {
    key: 'q2_joao_expectations',
    text: 'O tema abordado atendeu às suas expectativas?',
    type: 'radio',
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica',
    options: [
      { value: 'Não atendeu', icon: <ThumbsDown className="h-5 w-5 text-red-500" /> },
      { value: 'Atendeu parcialmente', icon: <Meh className="h-5 w-5 text-yellow-500" /> },
      { value: 'Atendeu totalmente', icon: <ThumbsUp className="h-5 w-5 text-green-500" /> }
    ]
  },
  {
    key: 'q3_joao_clarity',
    text: 'O professor conseguiu explicar os conceitos de forma clara e compreensível?',
    type: 'radio',
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica',
    options: [
      { value: 'Discordo totalmente', icon: <Frown className="h-5 w-5 text-red-500" /> },
      { value: 'Discordo', icon: <Frown className="h-5 w-5 text-orange-500" /> },
      { value: 'Neutro', icon: <Meh className="h-5 w-5 text-yellow-500" /> },
      { value: 'Concordo', icon: <Smile className="h-5 w-5 text-lime-500" /> },
      { value: 'Concordo totalmente', icon: <Smile className="h-5 w-5 text-green-500" /> }
    ]
  },
  {
    key: 'q4_joao_time',
    text: 'Você sentiu que o tempo da aula foi suficiente para abordar o tema?',
    type: 'radio',
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica',
    options: [
      { value: 'Insuficiente', icon: <Clock className="h-5 w-5 text-red-500" /> },
      { value: 'Adequado', icon: <Clock className="h-5 w-5 text-green-500" /> },
      { value: 'Mais do que suficiente', icon: <Clock className="h-5 w-5 text-blue-500" /> }
    ]
  },
  {
    key: 'q5_joao_liked_most',
    text: 'O que você mais gostou na aula do João Fernandes?',
    type: 'text',
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica'
  },
  {
    key: 'q6_joao_improve',
    text: 'O que poderia melhorar na aula do João Fernandes?',
    type: 'text',
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica'
  },
  // Section 3: Aula Larissa Guerreiro
  {
    key: 'q7_larissa_expectations',
    text: 'O tema abordado atendeu às suas expectativas?',
    type: 'radio',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas',
    options: [
      { value: 'Não atendeu', icon: <ThumbsDown className="h-5 w-5 text-red-500" /> },
      { value: 'Atendeu parcialmente', icon: <Meh className="h-5 w-5 text-yellow-500" /> },
      { value: 'Atendeu totalmente', icon: <ThumbsUp className="h-5 w-5 text-green-500" /> }
    ]
  },
  {
    key: 'q8_larissa_clarity',
    text: 'A professora conseguiu explicar os conceitos de forma clara e compreensível?',
    type: 'radio',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas',
    options: [
      { value: 'Discordo totalmente', icon: <Frown className="h-5 w-5 text-red-500" /> },
      { value: 'Discordo', icon: <Frown className="h-5 w-5 text-orange-500" /> },
      { value: 'Neutro', icon: <Meh className="h-5 w-5 text-yellow-500" /> },
      { value: 'Concordo', icon: <Smile className="h-5 w-5 text-lime-500" /> },
      { value: 'Concordo totalmente', icon: <Smile className="h-5 w-5 text-green-500" /> }
    ]
  },
  {
    key: 'q9_larissa_time',
    text: 'Você sentiu que o tempo da aula foi suficiente para abordar o tema?',
    type: 'radio',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas',
    options: [
      { value: 'Insuficiente', icon: <Clock className="h-5 w-5 text-red-500" /> },
      { value: 'Adequado', icon: <Clock className="h-5 w-5 text-green-500" /> },
      { value: 'Mais do que suficiente', icon: <Clock className="h-5 w-5 text-blue-500" /> }
    ]
  },
  {
    key: 'q10_larissa_liked_most',
    text: 'O que você mais gostou na aula da Larissa Guerreiro?',
    type: 'text',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas'
  },
  {
    key: 'q11_larissa_improve',
    text: 'O que poderia melhorar na aula da Larissa Guerreiro?',
    type: 'text',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas'
  },
  // Section 4: IA Avivar
  {
    key: 'q12_avivar_current_process',
    text: 'Hoje, como acontece o atendimento inicial e o acompanhamento dos seus leads e pacientes?',
    type: 'radio',
    category: 'IA de Atendimento - Avivar',
    icon: <Zap className="h-5 w-5" />,
    options: [
      { value: 'Tudo manual, depende de pessoas' },
      { value: 'Uso WhatsApp, mas sem padrão definido' },
      { value: 'Tenho algum sistema, mas é pouco eficiente' },
      { value: 'Tenho processo estruturado e quero automatizar para escalar' }
    ]
  },
  {
    key: 'q13_avivar_opportunity_loss',
    text: 'O quanto você sente que perde oportunidades ou tempo por falta de automação no atendimento?',
    type: 'radio',
    category: 'IA de Atendimento - Avivar',
    icon: <Zap className="h-5 w-5" />,
    options: [
      { value: 'Não sinto que perco oportunidades' },
      { value: 'Perco poucas oportunidades' },
      { value: 'Perco bastante, mas consigo lidar' },
      { value: 'Perco muitas oportunidades e isso trava meu crescimento' }
    ]
  },
  // Section 5: Licença ByNeofolic
  {
    key: 'q14_license_current_structure',
    text: 'Hoje, como você estruturou sua clínica ou projeto na área capilar?',
    type: 'radio',
    category: 'Licença ByNeofolic',
    icon: <Target className="h-5 w-5" />,
    options: [
      { value: 'Tudo foi construído sozinho, sem modelo' },
      { value: 'Tenho referências, mas adaptei por conta própria' },
      { value: 'Sigo parcialmente um modelo validado' },
      { value: 'Opero ou quero operar com um modelo testado e acompanhado' }
    ]
  },
  {
    key: 'q15_license_acceleration',
    text: 'O quanto ter acompanhamento, processos prontos e uma marca validada aceleraria seus resultados?',
    type: 'radio',
    category: 'Licença ByNeofolic',
    icon: <Target className="h-5 w-5" />,
    options: [
      { value: 'Não faria diferença' },
      { value: 'Ajudaria um pouco' },
      { value: 'Ajudaria bastante' },
      { value: 'Seria decisivo para crescer mais rápido' }
    ]
  },
  // Section 6: Assessoria Jurídica
  {
    key: 'q16_legal_current_structure',
    text: 'Hoje, como está a estrutura jurídica da sua clínica ou atuação profissional?',
    type: 'radio',
    category: 'Assessoria Jurídica',
    icon: <Shield className="h-5 w-5" />,
    options: [
      { value: 'Não tenho praticamente nada estruturado' },
      { value: 'Tenho contratos básicos e termos genéricos' },
      { value: 'Tenho estrutura razoável, mas com inseguranças' },
      { value: 'Tenho tudo estruturado e revisado por especialista' }
    ]
  },
  {
    key: 'q17_legal_limitations',
    text: 'O quanto questões jurídicas hoje limitam ou te deixam inseguro para crescer e escalar?',
    type: 'radio',
    category: 'Assessoria Jurídica',
    icon: <Shield className="h-5 w-5" />,
    options: [
      { value: 'Não limitam' },
      { value: 'Limitam um pouco' },
      { value: 'Limitam bastante' },
      { value: 'São um risco real para minha operação' }
    ]
  },
  // Section 7: Timing e Decisão
  {
    key: 'q18_timing_next_60_days',
    text: 'Nos próximos 60 dias, qual dessas opções melhor representa seu momento?',
    type: 'radio',
    category: 'Timing e Decisão',
    icon: <Calendar className="h-5 w-5" />,
    options: [
      { value: 'Estou apenas absorvendo conhecimento' },
      { value: 'Quero estruturar com calma' },
      { value: 'Quero acelerar com apoio certo' },
      { value: 'Quero avançar agora' }
    ]
  },
  {
    key: 'q19_timing_individual_interest',
    text: 'Você teria interesse em conversar individualmente para montar um plano envolvendo IA de atendimento, licença de marca e assessoria jurídica?',
    type: 'radio',
    category: 'Timing e Decisão',
    icon: <Calendar className="h-5 w-5" />,
    options: [
      { value: 'Não' },
      { value: 'Talvez mais para frente' },
      { value: 'Sim, quero entender melhor' },
      { value: 'Sim, quero avançar nisso agora' }
    ]
  },
  // Section 8: Insight Final
  {
    key: 'q20_insight_final',
    text: 'Quando você vê outros médicos se destacando nessa área, o que você acha que eles fizeram de diferente?',
    type: 'text',
    category: 'Insight Final',
    icon: <MessageSquare className="h-5 w-5" />
  }
];

export function Day2SurveyDialog({ open, onOpenChange, classId, onComplete }: Day2SurveyDialogProps) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const effectiveTimeRef = useRef(0);
  const lastVisibleTimeRef = useRef(Date.now());
  
  const { existingSurvey, isLoading, isCompleted, startSurvey, saveProgress, submitSurvey } = useDay2Survey(classId);

  // Initialize survey
  useEffect(() => {
    if (open && user && !existingSurvey && !isLoading && !isInitializing) {
      setIsInitializing(true);
      startSurvey.mutateAsync(classId).then((data) => {
        if (data) {
          setSurveyId(data.id);
        }
        setIsInitializing(false);
      }).catch(() => {
        setIsInitializing(false);
      });
    } else if (existingSurvey) {
      setSurveyId(existingSurvey.id);
      // Resume from saved progress
      const savedData: Record<string, string> = {};
      QUESTIONS.forEach(q => {
        const value = existingSurvey[q.key as keyof typeof existingSurvey];
        if (value) savedData[q.key] = value as string;
      });
      setFormData(savedData);
      setCurrentQuestion(Math.min((existingSurvey.current_section || 1) - 1, QUESTIONS.length - 1));
      effectiveTimeRef.current = existingSurvey.effective_time_seconds || 0;
    }
  }, [open, user, existingSurvey, isLoading, classId]);

  // Track effective time
  useEffect(() => {
    if (!open) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        effectiveTimeRef.current += Math.floor((Date.now() - lastVisibleTimeRef.current) / 1000);
      } else {
        lastVisibleTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    lastVisibleTimeRef.current = Date.now();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!document.hidden) {
        effectiveTimeRef.current += Math.floor((Date.now() - lastVisibleTimeRef.current) / 1000);
      }
    };
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentQuestion(0);
      setFormData({});
      setSurveyId(null);
    }
  }, [open]);

  const currentQ = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const isTextQuestion = currentQ?.type === 'text';
  const canProceed = isTextQuestion || formData[currentQ?.key];

  const handleNext = async () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      // Save progress
      if (surveyId) {
        await saveProgress.mutateAsync({
          surveyId,
          data: formData,
          currentSection: currentQuestion + 2
        });
      }
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!surveyId) return;
    
    // Calculate final effective time
    if (!document.hidden) {
      effectiveTimeRef.current += Math.floor((Date.now() - lastVisibleTimeRef.current) / 1000);
    }
    
    await submitSurvey.mutateAsync({
      surveyId,
      data: formData,
      effectiveTime: effectiveTimeRef.current
    });
    
    onComplete?.();
    onOpenChange(false);
  };

  const handleOptionSelect = (value: string) => {
    setFormData(prev => ({ ...prev, [currentQ.key]: value }));
  };

  if (isLoading || isInitializing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold">Pesquisa já respondida!</h3>
            <p className="text-muted-foreground text-center">
              Você já completou a pesquisa de satisfação do Dia 2. Obrigado pelo seu feedback!
            </p>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Pesquisa de Satisfação - Dia 2
          </DialogTitle>
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Pergunta {currentQuestion + 1} de {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {currentQ.category}
            </span>
          </div>

          {/* Question */}
          <h3 className="text-lg font-medium mb-6">{currentQ.text}</h3>

          {/* Options or Text Input */}
          {currentQ.type === 'radio' && currentQ.options && (
            <RadioGroup
              value={formData[currentQ.key] || ''}
              onValueChange={handleOptionSelect}
              className="space-y-3"
            >
              {currentQ.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData[currentQ.key] === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  <RadioGroupItem value={option.value} id={`${currentQ.key}-${idx}`} />
                  {'icon' in option && option.icon}
                  <Label htmlFor={`${currentQ.key}-${idx}`} className="flex-1 cursor-pointer">
                    {option.value}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQ.type === 'text' && (
            <Textarea
              value={formData[currentQ.key] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, [currentQ.key]: e.target.value }))}
              placeholder="Digite sua resposta..."
              className="min-h-[120px]"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>

          {currentQuestion === QUESTIONS.length - 1 ? (
            <Button 
              onClick={handleSubmit}
              disabled={submitSurvey.isPending}
            >
              {submitSurvey.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Pesquisa'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!canProceed || saveProgress.isPending}
            >
              {saveProgress.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Próximo'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
