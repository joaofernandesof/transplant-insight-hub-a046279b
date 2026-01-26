import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDay2Survey } from '../hooks/useDay2Survey';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, CheckCircle2, Smile, Meh, Frown, ThumbsUp, ThumbsDown, Clock, Zap, Target, Shield } from 'lucide-react';
import { SurveyErrors } from '@/lib/errorReporting';
import { toast } from 'sonner';
import joaoFernandesImg from '@/assets/joao-fernandes.png';
import larissaGuerreiroImg from '@/assets/larissa-guerreiro.png';

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
    speakerImage: joaoFernandesImg,
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
    speakerImage: joaoFernandesImg,
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
    speakerImage: joaoFernandesImg,
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
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica',
    speakerImage: joaoFernandesImg
  },
  {
    key: 'q6_joao_improve',
    text: 'O que poderia melhorar na aula do João Fernandes?',
    type: 'text',
    category: 'Aula João Fernandes - Gestão Inteligente e Expansão Clínica',
    speakerImage: joaoFernandesImg
  },
  // Section 3: Aula Larissa Guerreiro
  {
    key: 'q7_larissa_expectations',
    text: 'O tema abordado atendeu às suas expectativas?',
    type: 'radio',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas',
    speakerImage: larissaGuerreiroImg,
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
    speakerImage: larissaGuerreiroImg,
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
    speakerImage: larissaGuerreiroImg,
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
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas',
    speakerImage: larissaGuerreiroImg
  },
  {
    key: 'q11_larissa_improve',
    text: 'O que poderia melhorar na aula da Larissa Guerreiro?',
    type: 'text',
    category: 'Aula Larissa Guerreiro - Blindagem Jurídica para Clínicas Médicas',
    speakerImage: larissaGuerreiroImg
  },
  // Section 4: IA Avivar (q12-q14)
  {
    key: 'q12_avivar_current_process',
    text: 'Hoje, como acontece o atendimento inicial e o acompanhamento dos seus leads e pacientes?',
    type: 'radio',
    category: 'IA de Atendimento - Avivar',
    icon: <Zap className="h-5 w-5" />,
    options: [
      { value: 'Tudo depende de pessoas e memória' },
      { value: 'Tenho organização básica, mas com falhas frequentes' },
      { value: 'Consigo organizar, mas sinto limites claros' },
      { value: 'Tenho estrutura e quero ganhar escala e previsibilidade' }
    ]
  },
  {
    key: 'q13_avivar_opportunity_loss',
    text: 'O quanto você sente que perde oportunidades ou tempo por falta de automação no atendimento?',
    type: 'radio',
    category: 'IA de Atendimento - Avivar',
    icon: <Zap className="h-5 w-5" />,
    options: [
      { value: 'Funciona bem do jeito que está' },
      { value: 'Funciona, mas gera desgaste' },
      { value: 'Funciona com perda de oportunidades' },
      { value: 'É um gargalo claro no crescimento' }
    ]
  },
  {
    key: 'q14_avivar_timing',
    text: 'Em que momento faria sentido implementar uma solução de IA para atendimento?',
    type: 'radio',
    category: 'IA de Atendimento - Avivar',
    icon: <Zap className="h-5 w-5" />,
    options: [
      { value: 'Não é prioridade agora' },
      { value: 'Quando tiver mais tempo' },
      { value: 'Nos próximos meses' },
      { value: 'O quanto antes' }
    ]
  },
  // Section 5: Licença ByNeofolic (q15-q17)
  {
    key: 'q15_license_path',
    text: 'Considerando um investimento inicial de R$ 80.000 para operar sob uma licença estruturada, qual dessas opções mais se aproxima da sua realidade atual?',
    type: 'radio',
    category: 'Licença ByNeofolic',
    icon: <Target className="h-5 w-5" />,
    options: [
      { value: 'Não é viável para mim hoje' },
      { value: 'Seria viável apenas com muito planejamento' },
      { value: 'É viável se o modelo fizer sentido' },
      { value: 'É totalmente viável para mim' }
    ]
  },
  {
    key: 'q16_license_pace',
    text: 'Pensando no estágio atual da sua clínica ou projeto, o quanto operar sem um modelo licenciado e padronizado te expõe a erros, retrabalho ou crescimento lento?',
    type: 'radio',
    category: 'Licença ByNeofolic',
    icon: <Target className="h-5 w-5" />,
    options: [
      { value: 'Não me expõe' },
      { value: 'Me expõe pouco' },
      { value: 'Me expõe bastante' },
      { value: 'É um dos meus principais gargalos' }
    ]
  },
  {
    key: 'q17_license_timing',
    text: 'Em que momento faria sentido para você avaliar seriamente a entrada em uma licença com investimento nessa faixa?',
    type: 'radio',
    category: 'Licença ByNeofolic',
    icon: <Target className="h-5 w-5" />,
    options: [
      { value: 'Não penso nisso no momento' },
      { value: 'Talvez em um futuro distante' },
      { value: 'Nos próximos meses' },
      { value: 'Agora é o momento certo' }
    ]
  },
  // Section 6: Assessoria Jurídica (q18-q20)
  {
    key: 'q18_legal_feeling',
    text: 'Como você se sente em relação à estrutura jurídica da sua clínica ou atuação profissional?',
    type: 'radio',
    category: 'Assessoria Jurídica',
    icon: <Shield className="h-5 w-5" />,
    options: [
      { value: 'Tranquilo e seguro' },
      { value: 'Um pouco inseguro' },
      { value: 'Inseguro em alguns pontos' },
      { value: 'Exposto a riscos que me preocupam' }
    ]
  },
  {
    key: 'q19_legal_influence',
    text: 'O quanto questões jurídicas influenciam suas decisões de crescimento?',
    type: 'radio',
    category: 'Assessoria Jurídica',
    icon: <Shield className="h-5 w-5" />,
    options: [
      { value: 'Não influenciam' },
      { value: 'Influenciam pouco' },
      { value: 'Influenciam bastante' },
      { value: 'Travaram ou quase travaram decisões importantes' }
    ]
  },
  {
    key: 'q20_legal_timing',
    text: 'Em que momento faria sentido buscar uma assessoria jurídica especializada?',
    type: 'radio',
    category: 'Assessoria Jurídica',
    icon: <Shield className="h-5 w-5" />,
    options: [
      { value: 'Não vejo isso como prioridade' },
      { value: 'Quando o negócio estiver maior' },
      { value: 'Nos próximos meses' },
      { value: 'O quanto antes' }
    ]
  }
];

// Text input component with debounced auto-save
function TextQuestionInput({ 
  questionKey, 
  value, 
  onChange, 
  onAutoSave 
}: { 
  questionKey: string; 
  value: string; 
  onChange: (value: string) => void;
  onAutoSave: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync local value when external value changes (e.g., resuming)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    
    // Debounce auto-save (save after 1 second of no typing)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onAutoSave(newValue);
    }, 1000);
  }, [onChange, onAutoSave]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Save on blur (when user clicks away)
  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (localValue.trim()) {
      onAutoSave(localValue);
    }
  }, [localValue, onAutoSave]);
  
  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Digite sua resposta..."
      className="min-h-[120px]"
    />
  );
}

export function Day2SurveyDialog({ open, onOpenChange, classId, onComplete }: Day2SurveyDialogProps) {
  const { user } = useUnifiedAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Use ref to always have current surveyId in callbacks (prevents stale closure)
  const surveyIdRef = useRef<string | null>(null);
  const formDataRef = useRef<Record<string, string>>({});
  
  // Keep refs in sync with state
  useEffect(() => {
    surveyIdRef.current = surveyId;
  }, [surveyId]);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  const effectiveTimeRef = useRef(0);
  const lastVisibleTimeRef = useRef(Date.now());
  
  const { existingSurvey, isLoading, isCompleted, startSurvey, saveProgress, submitSurvey } = useDay2Survey(classId);

  // Initialize survey
  useEffect(() => {
    if (open && user && !existingSurvey && !isLoading && !isInitializing) {
      setIsInitializing(true);
      startSurvey.mutateAsync(classId)
        .then((data) => {
          if (data?.id) {
            console.log('[Day2] Survey initialized:', data.id);
            setSurveyId(data.id);
            surveyIdRef.current = data.id; // Sync ref immediately
          } else {
            SurveyErrors.initFailed(new Error('Nenhum ID retornado pelo servidor'));
          }
        })
        .catch((error) => {
          SurveyErrors.initFailed(error);
        })
        .finally(() => setIsInitializing(false));
    } else if (existingSurvey?.id) {
      console.log('[Day2] Resuming:', existingSurvey.id);
      setSurveyId(existingSurvey.id);
      surveyIdRef.current = existingSurvey.id; // Sync ref immediately
      // Resume from saved progress
      const savedData: Record<string, string> = {};
      QUESTIONS.forEach(q => {
        const value = existingSurvey[q.key as keyof typeof existingSurvey];
        if (value) savedData[q.key] = value as string;
      });
      setFormData(savedData);
      formDataRef.current = savedData; // Sync ref immediately
      
      // Find first unanswered question to resume from
      let resumeIndex = 0;
      let foundUnanswered = false;
      
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        // If any question is not answered, resume from there
        if (!savedData[q.key]) {
          resumeIndex = i;
          foundUnanswered = true;
          break;
        }
      }
      
      // If all questions answered but not completed, stay on last question
      if (!foundUnanswered && !existingSurvey.is_completed) {
        resumeIndex = QUESTIONS.length - 1;
      }
      
      setCurrentQuestion(resumeIndex);
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

  // Only reset state when dialog closes if survey is completed
  useEffect(() => {
    if (!open && isCompleted) {
      setCurrentQuestion(0);
      setFormData({});
      setSurveyId(null);
    }
  }, [open, isCompleted]);

  const currentQ = QUESTIONS[currentQuestion];
  // Progress with easing: fast at start, slow at end (last 30%)
  const linearProgress = (currentQuestion + 1) / QUESTIONS.length;
  const easedProgress = linearProgress <= 0.7 
    ? (linearProgress / 0.7) * 0.85  // First 70% of questions = 85% of bar
    : 0.85 + ((linearProgress - 0.7) / 0.3) * 0.15; // Last 30% of questions = 15% of bar
  const progress = easedProgress * 100;
  const isTextQuestion = currentQ?.type === 'text';
  const canProceed = isTextQuestion || formData[currentQ?.key];

  const handleNext = useCallback(() => {
    if (currentQ.type === 'radio' && !formData[currentQ.key]) {
      toast.error('Por favor, selecione uma opção antes de continuar.');
      return;
    }
    
    // Use ref for most current surveyId
    const currentSurveyId = surveyIdRef.current;
    if (!currentSurveyId) {
      SurveyErrors.noSurveyId();
      return;
    }
    
    if (currentQuestion < QUESTIONS.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      saveProgress.mutate({
        surveyId: currentSurveyId,
        data: formData,
        currentSection: nextQuestion + 1
      }, {
        onError: (error) => SurveyErrors.saveFailed(currentQ?.key, error)
      });
    }
  }, [currentQ, currentQuestion, formData, surveyId, saveProgress]);

  const handleBack = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }, [currentQuestion]);

  const handleSubmit = useCallback(() => {
    // Use ref for most current surveyId
    const currentSurveyId = surveyIdRef.current;
    if (!currentSurveyId) {
      SurveyErrors.noSurveyId();
      return;
    }
    
    if (submitSurvey.isPending) return;
    
    if (!document.hidden) {
      effectiveTimeRef.current += Math.floor((Date.now() - lastVisibleTimeRef.current) / 1000);
    }
    
    console.log('[Day2] Submitting:', currentSurveyId);
    submitSurvey.mutate({
      surveyId: currentSurveyId,
      data: formData,
      effectiveTime: effectiveTimeRef.current
    }, {
      onSuccess: () => {
        console.log('[Day2] Success');
        toast.success('Pesquisa enviada com sucesso!');
        onComplete?.();
        onOpenChange(false);
      },
      onError: (error) => {
        SurveyErrors.submitFailed(error);
      }
    });
  }, [surveyId, formData, submitSurvey, onComplete, onOpenChange]);

  const handleOptionSelect = useCallback((value: string) => {
    const updatedData = { ...formDataRef.current, [currentQ.key]: value };
    setFormData(updatedData);
    formDataRef.current = updatedData;
    
    if (currentQ.type === 'radio' && currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        
        // Use ref to get current surveyId (avoids stale closure)
        const currentSurveyId = surveyIdRef.current;
        if (currentSurveyId) {
        saveProgress.mutate({
            surveyId: currentSurveyId,
            data: updatedData,
            currentSection: nextQuestion + 1
          }, {
            onError: (error) => SurveyErrors.saveFailed(currentQ?.key, error)
          });
        } else {
          console.warn('[Day2] No surveyId in auto-advance, skipping save');
        }
      }, 250);
    }
  }, [currentQ?.key, currentQ?.type, currentQuestion, saveProgress]);

  // Show loading if no surveyId is available yet
  const isReady = !!surveyIdRef.current;
  
  if (isLoading || isInitializing || (!isReady && !isCompleted)) {
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
            <div className="flex items-center justify-end text-sm text-muted-foreground">
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-4 [&>div]:bg-green-500 [&>div]:transition-all [&>div]:duration-500 [&>div]:ease-out" 
            />
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Category Title with Speaker Image */}
          <div className="flex items-center gap-3 mb-6">
            {'speakerImage' in currentQ && currentQ.speakerImage && (
              <img 
                src={currentQ.speakerImage} 
                alt="Speaker" 
                className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
              />
            )}
            <h2 className="text-xl font-bold text-foreground">
              {currentQ.category}
            </h2>
          </div>

          {/* Question */}
          <p className="text-base text-muted-foreground mb-6">{currentQ.text}</p>

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
            <TextQuestionInput
              questionKey={currentQ.key}
              value={formData[currentQ.key] || ''}
              onChange={(value) => {
                const updatedData = { ...formDataRef.current, [currentQ.key]: value };
                setFormData(updatedData);
                formDataRef.current = updatedData;
              }}
              onAutoSave={(value) => {
                const currentSurveyId = surveyIdRef.current;
                if (currentSurveyId && value.trim()) {
                  saveProgress.mutate({
                    surveyId: currentSurveyId,
                    data: { ...formDataRef.current, [currentQ.key]: value },
                    currentSection: currentQuestion + 1
                  });
                }
              }}
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
              disabled={!canProceed}
            >
              Próximo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
