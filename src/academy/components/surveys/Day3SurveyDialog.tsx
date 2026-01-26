import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Award } from 'lucide-react';
import { useDay3Survey, Day3SurveyFormData } from '@/academy/hooks/useDay3Survey';
import { cn } from '@/lib/utils';
import { SurveyErrors } from '@/lib/errorReporting';
import { toast } from 'sonner';

interface Day3SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onComplete?: () => void;
}

type QuestionType = 'radio' | 'text';

interface QuestionOption {
  value: string;
  label: string;
  emoji?: string;
}

interface Question {
  id: keyof Day3SurveyFormData;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  placeholder?: string;
}

interface Section {
  id: number;
  title: string;
  icon: string;
  questions: Question[];
}

const SECTIONS: Section[] = [
  {
    id: 1,
    title: 'Satisfação e Promessa',
    icon: '🎯',
    questions: [
      {
        id: 'q1_satisfaction_level',
        type: 'radio',
        title: 'Como você avalia sua satisfação geral com o curso?',
        options: [
          { value: 'muito_insatisfeito', label: 'Muito insatisfeito', emoji: '😡' },
          { value: 'insatisfeito', label: 'Insatisfeito', emoji: '😕' },
          { value: 'neutro', label: 'Neutro', emoji: '😐' },
          { value: 'satisfeito', label: 'Satisfeito', emoji: '🙂' },
          { value: 'muito_satisfeito', label: 'Muito satisfeito', emoji: '🤩' },
        ],
      },
      {
        id: 'q2_promise_met',
        type: 'radio',
        title: 'O curso correspondeu ao que foi prometido?',
        options: [
          { value: 'muito_abaixo', label: 'Muito abaixo do prometido', emoji: '❌' },
          { value: 'abaixo', label: 'Abaixo do prometido', emoji: '⚠️' },
          { value: 'dentro', label: 'Dentro do prometido', emoji: '✅' },
          { value: 'acima', label: 'Acima do prometido', emoji: '✨' },
          { value: 'muito_acima', label: 'Muito acima do prometido', emoji: '🔥' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Conteúdo Técnico e Prático',
    icon: '🔬',
    questions: [
      {
        id: 'q3_technical_foundations',
        type: 'radio',
        title: 'Como você avalia os fundamentos técnicos e cirúrgicos?',
        options: [
          { value: 'muito_fracos', label: 'Muito fracos', emoji: '❌' },
          { value: 'fracos', label: 'Fracos', emoji: '⚠️' },
          { value: 'adequados', label: 'Adequados', emoji: '✅' },
          { value: 'bons', label: 'Bons', emoji: '👍' },
          { value: 'excelentes', label: 'Excelentes', emoji: '🧠' },
        ],
      },
      {
        id: 'q4_practical_load',
        type: 'radio',
        title: 'A carga prática foi suficiente?',
        options: [
          { value: 'muito_insuficiente', label: 'Muito insuficiente', emoji: '🟥' },
          { value: 'insuficiente', label: 'Insuficiente', emoji: '🟧' },
          { value: 'adequada', label: 'Adequada', emoji: '🟨' },
          { value: 'boa', label: 'Boa', emoji: '🟩' },
          { value: 'excelente', label: 'Excelente', emoji: '🟦' },
        ],
      },
      {
        id: 'q5_theory_practice_balance',
        type: 'radio',
        title: 'O equilíbrio entre teoria e prática foi…',
        options: [
          { value: 'muito_teorico', label: 'Muito teórico', emoji: '📚' },
          { value: 'mais_teoria', label: 'Mais teoria do que prática', emoji: '📘' },
          { value: 'equilibrado', label: 'Bem equilibrado', emoji: '⚖️' },
          { value: 'mais_pratica', label: 'Mais prática do que teoria', emoji: '🛠️' },
          { value: 'muito_pratico', label: 'Muito prático, faltou teoria', emoji: '🧪' },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Clareza, Execução e Confiança',
    icon: '💡',
    questions: [
      {
        id: 'q6_execution_clarity',
        type: 'radio',
        title: 'O curso te deu clareza para executar na prática?',
        options: [
          { value: 'nenhuma', label: 'Nenhuma clareza', emoji: '🚫' },
          { value: 'pouca', label: 'Pouca clareza', emoji: '😕' },
          { value: 'razoavel', label: 'Razoável', emoji: '🤔' },
          { value: 'boa', label: 'Boa clareza', emoji: '🙂' },
          { value: 'total', label: 'Total clareza', emoji: '🔍' },
        ],
      },
      {
        id: 'q7_confidence_level',
        type: 'radio',
        title: 'Qual seu nível de confiança para aplicar o que aprendeu?',
        options: [
          { value: 'nenhuma', label: 'Nenhuma', emoji: '😬' },
          { value: 'baixa', label: 'Baixa', emoji: '😟' },
          { value: 'moderada', label: 'Moderada', emoji: '😐' },
          { value: 'boa', label: 'Boa', emoji: '🙂' },
          { value: 'alta', label: 'Alta', emoji: '💪' },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'Gestão, Jurídico e Visão de Negócio',
    icon: '📊',
    questions: [
      {
        id: 'q8_management_classes',
        type: 'radio',
        title: 'As aulas de gestão e expansão foram…',
        options: [
          { value: 'nada_relevantes', label: 'Nada relevantes', emoji: '❌' },
          { value: 'pouco_relevantes', label: 'Pouco relevantes', emoji: '⚠️' },
          { value: 'relevantes', label: 'Relevantes', emoji: '✅' },
          { value: 'muito_relevantes', label: 'Muito relevantes', emoji: '💡' },
          { value: 'essenciais', label: 'Essenciais', emoji: '🚀' },
        ],
      },
      {
        id: 'q9_legal_security',
        type: 'radio',
        title: 'O conteúdo jurídico trouxe mais segurança para você?',
        options: [
          { value: 'nenhuma', label: 'Nenhuma', emoji: '🚫' },
          { value: 'pouca', label: 'Pouca', emoji: '⚠️' },
          { value: 'razoavel', label: 'Razoável', emoji: '😐' },
          { value: 'boa', label: 'Boa', emoji: '🙂' },
          { value: 'muita', label: 'Muita', emoji: '🔐' },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'Experiência e Suporte',
    icon: '🏆',
    questions: [
      {
        id: 'q10_organization',
        type: 'radio',
        title: 'Como você avalia a organização e o cronograma do curso?',
        options: [
          { value: 'muito_ruim', label: 'Muito ruim', emoji: '❌' },
          { value: 'ruim', label: 'Ruim', emoji: '⚠️' },
          { value: 'regular', label: 'Regular', emoji: '😐' },
          { value: 'boa', label: 'Boa', emoji: '🙂' },
          { value: 'excelente', label: 'Excelente', emoji: '🏆' },
        ],
      },
      {
        id: 'q11_support_quality',
        type: 'radio',
        title: 'Como foi o suporte para dúvidas e orientação?',
        options: [
          { value: 'muito_fraco', label: 'Muito fraco', emoji: '😩' },
          { value: 'fraco', label: 'Fraco', emoji: '😕' },
          { value: 'adequado', label: 'Adequado', emoji: '😐' },
          { value: 'bom', label: 'Bom', emoji: '🙂' },
          { value: 'excelente', label: 'Excelente', emoji: '👏' },
        ],
      },
      {
        id: 'q12_improvements',
        type: 'text',
        title: 'O que você acredita que precisa ser melhorado na Formação 360?',
        description: 'Conte tudo que poderia ter sido mais claro, prático, organizado, envolvente ou bem estruturado. Sua sinceridade é essencial.',
        placeholder: 'Descreva aqui suas sugestões de melhoria...',
      },
      {
        id: 'q13_highlights',
        type: 'text',
        title: 'O que você acredita que mais acertamos na Formação 360?',
        description: 'Fale sobre o que mais te impactou, surpreendeu ou marcou. Pode ser um momento, pessoa, conteúdo ou detalhe.',
        placeholder: 'Descreva aqui os pontos positivos...',
      },
    ],
  },
  {
    id: 6,
    title: 'Avaliação dos Monitores',
    icon: '👨‍⚕️',
    questions: [
      {
        id: 'q14_best_technical_monitor',
        type: 'radio',
        title: 'Qual monitor(a) demonstrou maior domínio técnico e segurança nos conteúdos?',
        options: [
          { value: 'elenilton', label: 'Dr. Elenilton', emoji: '👨‍⚕️' },
          { value: 'patrick', label: 'Dr. Patrick', emoji: '👨‍⚕️' },
          { value: 'eder', label: 'Dr. Eder', emoji: '👨‍⚕️' },
          { value: 'gleyldes', label: 'Dra. Gleyldes', emoji: '👩‍⚕️' },
        ],
      },
      {
        id: 'q15_best_caring_monitor',
        type: 'radio',
        title: 'Qual monitor(a) demonstrou mais atenção e cuidado com os alunos?',
        options: [
          { value: 'elenilton', label: 'Dr. Elenilton', emoji: '👨‍⚕️' },
          { value: 'patrick', label: 'Dr. Patrick', emoji: '👨‍⚕️' },
          { value: 'eder', label: 'Dr. Eder', emoji: '👨‍⚕️' },
          { value: 'gleyldes', label: 'Dra. Gleyldes', emoji: '👩‍⚕️' },
        ],
      },
      {
        id: 'q16_monitor_comments',
        type: 'text',
        title: 'Deixe aqui elogios, comentários ou sugestões sobre os monitores.',
        description: 'Se algo te chamou atenção positivamente ou se tem alguma sugestão de melhoria, esse é o espaço.',
        placeholder: 'Seus comentários sobre os monitores...',
      },
    ],
  },
];

export function Day3SurveyDialog({ open, onOpenChange, classId, onComplete }: Day3SurveyDialogProps) {
  const {
    surveyResponse,
    startSurvey,
    saveProgress,
    submitSurvey,
    isStarting,
    isSaving,
    isSubmitting,
    isLoading,
    hasCompleted,
    refetch,
  } = useDay3Survey(classId);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<Day3SurveyFormData>>({});
  const [startTime] = useState(Date.now());
  const [showCompletion, setShowCompletion] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Survey ID from response
  const surveyId = surveyResponse?.id;

  // Initialize survey
  useEffect(() => {
    if (!open || isLoading) return;
    
    if (surveyResponse) {
      // Load saved data
      const savedData: Partial<Day3SurveyFormData> = {};
      SECTIONS.forEach(section => {
        section.questions.forEach(q => {
          const value = surveyResponse[q.id as keyof typeof surveyResponse];
          if (value) {
            (savedData as any)[q.id] = value;
          }
        });
      });
      setFormData(savedData);
      
      // Find first unanswered question
      for (let sIdx = 0; sIdx < SECTIONS.length; sIdx++) {
        const section = SECTIONS[sIdx];
        for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
          const q = section.questions[qIdx];
          if (!savedData[q.id]) {
            setCurrentSectionIndex(sIdx);
            setCurrentQuestionIndex(qIdx);
            setIsInitialized(true);
            return;
          }
        }
      }
      setIsInitialized(true);
    } else if (!isInitialized) {
      // Create new survey
      startSurvey(classId || null)
        .then(() => {
          refetch();
          setIsInitialized(true);
        })
        .catch((error) => SurveyErrors.initFailed(error));
    }
  }, [open, surveyResponse, isLoading, classId, isInitialized, startSurvey, refetch]);

  const currentSection = SECTIONS[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  
  const totalQuestions = SECTIONS.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredQuestions = Object.keys(formData).filter(k => formData[k as keyof Day3SurveyFormData]).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const handleAnswer = useCallback((value: string) => {
    if (!currentQuestion) return;
    
    const newData = { ...formData, [currentQuestion.id]: value };
    setFormData(newData);
    
    // Auto-advance for radio questions
    if (currentQuestion.type === 'radio' && surveyId) {
      setTimeout(() => {
        goToNext(newData);
      }, 250);
    }
  }, [currentQuestion, formData, surveyId]);

  const goToNext = useCallback((dataToSave?: Partial<Day3SurveyFormData>) => {
    const data = dataToSave || formData;
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Last question - submit
      handleSubmit(data);
      return;
    }
    
    // Save progress
    if (surveyId) {
      saveProgress({
        surveyId,
        data,
        currentSection: currentSectionIndex + 1,
      }).catch((error) => SurveyErrors.saveFailed('day3_progress', error));
    }
  }, [currentQuestionIndex, currentSectionIndex, currentSection, formData, surveyId, saveProgress]);

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = SECTIONS[currentSectionIndex - 1];
      setCurrentSectionIndex(prev => prev - 1);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
  };

  const handleSubmit = async (dataToSubmit?: Partial<Day3SurveyFormData>) => {
    const data = dataToSubmit || formData;
    if (!surveyId) {
      SurveyErrors.noSurveyId();
      return;
    }
    
    const effectiveTime = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await submitSurvey({
        surveyId,
        data,
        effectiveTimeSeconds: effectiveTime,
      });
      setShowCompletion(true);
    } catch (error) {
      SurveyErrors.submitFailed(error);
    }
  };

  const handleClose = () => {
    if (showCompletion) {
      onComplete?.();
    }
    onOpenChange(false);
  };

  if (showCompletion) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-100 p-4 mb-4">
              <Award className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Pesquisa Concluída!
            </h2>
            <p className="text-muted-foreground mb-6">
              Obrigado por compartilhar sua experiência na Formação 360. Seu feedback é essencial para continuarmos evoluindo.
            </p>
            <Button onClick={handleClose} className="w-full max-w-xs">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show loading if survey is not ready yet
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentSection?.icon}</span>
            <span>Pesquisa Final — Formação 360</span>
          </DialogTitle>
        </DialogHeader>

        {(isStarting || !surveyId) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentSection?.title}</span>
                <span>{answeredQuestions}/{totalQuestions} respondidas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Section indicators */}
            <div className="flex justify-center gap-2">
              {SECTIONS.map((section, idx) => (
                <div
                  key={section.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                    idx < currentSectionIndex
                      ? "bg-emerald-500 text-white"
                      : idx === currentSectionIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {idx < currentSectionIndex ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    section.icon
                  )}
                </div>
              ))}
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{currentQuestion.title}</h3>
                  {currentQuestion.description && (
                    <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
                  )}
                </div>

                {currentQuestion.type === 'radio' && currentQuestion.options && (
                  <RadioGroup
                    value={formData[currentQuestion.id] as string || ''}
                    onValueChange={handleAnswer}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all hover:border-primary",
                          formData[currentQuestion.id] === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                        onClick={() => handleAnswer(option.value)}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer flex items-center gap-2">
                          {option.emoji && <span className="text-xl">{option.emoji}</span>}
                          <span>{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'text' && (
                  <Textarea
                    value={formData[currentQuestion.id] as string || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, [currentQuestion.id]: newValue });
                    }}
                    onBlur={() => {
                      // Save on blur
                      if (surveyId) {
                        saveProgress({
                          surveyId,
                          data: formData,
                          currentSection: currentSectionIndex + 1,
                        }).catch((error) => SurveyErrors.saveFailed(currentQuestion.id, error));
                      }
                    }}
                    placeholder={currentQuestion.placeholder || 'Digite sua resposta...'}
                    className="min-h-[120px]"
                  />
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              {currentQuestion?.type === 'text' && (
                <Button
                  onClick={() => goToNext()}
                  disabled={isSaving || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <>
                      {currentSectionIndex === SECTIONS.length - 1 && 
                       currentQuestionIndex === currentSection.questions.length - 1
                        ? 'Finalizar'
                        : 'Próxima'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
