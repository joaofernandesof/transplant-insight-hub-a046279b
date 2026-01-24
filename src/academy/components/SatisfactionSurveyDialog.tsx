import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Loader2, Camera, CheckCircle } from 'lucide-react';
import { useSatisfactionSurvey, SurveyFormData } from '../hooks/useSatisfactionSurvey';
import { cn } from '@/lib/utils';

interface SatisfactionSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onComplete?: () => void;
  showPhotosMessage?: boolean;
}

const TOTAL_BLOCKS = 8;

export function SatisfactionSurveyDialog({
  open,
  onOpenChange,
  classId,
  onComplete,
  showPhotosMessage = false,
}: SatisfactionSurveyDialogProps) {
  const {
    surveyResponse,
    hasCompleted,
    startSurvey,
    saveProgress,
    submitSurvey,
    isStarting,
    isSaving,
    isSubmitting,
  } = useSatisfactionSurvey(classId);
  
  const [currentBlock, setCurrentBlock] = useState(1);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SurveyFormData>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Track effective time (only when page is visible)
  const effectiveTimeRef = useRef(0);
  const lastVisibleTimeRef = useRef<number | null>(null);
  
  // Start/stop tracking visibility
  const updateEffectiveTime = useCallback(() => {
    if (lastVisibleTimeRef.current !== null) {
      effectiveTimeRef.current += Math.round((Date.now() - lastVisibleTimeRef.current) / 1000);
    }
    lastVisibleTimeRef.current = document.visibilityState === 'visible' ? Date.now() : null;
  }, []);
  
  // Track page visibility
  useEffect(() => {
    if (!open) return;
    
    // Start tracking when dialog opens
    if (document.visibilityState === 'visible') {
      lastVisibleTimeRef.current = Date.now();
    }
    
    const handleVisibilityChange = () => {
      updateEffectiveTime();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Capture final time when unmounting
      updateEffectiveTime();
    };
  }, [open, updateEffectiveTime]);
  
  // Get current effective time
  const getEffectiveTime = useCallback(() => {
    if (lastVisibleTimeRef.current !== null && document.visibilityState === 'visible') {
      return effectiveTimeRef.current + Math.round((Date.now() - lastVisibleTimeRef.current) / 1000);
    }
    return effectiveTimeRef.current;
  }, []);
  
  // Initialize survey when dialog opens
  useEffect(() => {
    if (open && !hasCompleted && !surveyId) {
      setIsInitializing(true);
      startSurvey(classId)
        .then((response) => {
          setSurveyId(response.id);
          setCurrentBlock(response.current_block || 1);
          if (response.partial_data) {
            setFormData(response.partial_data as Partial<SurveyFormData>);
          }
        })
        .finally(() => setIsInitializing(false));
    }
  }, [open, hasCompleted, classId, startSurvey, surveyId]);
  
  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSurveyId(null);
      setFormData({});
      setCurrentBlock(1);
      // Reset effective time tracking
      effectiveTimeRef.current = 0;
      lastVisibleTimeRef.current = null;
    }
  }, [open]);
  
  const updateField = <K extends keyof SurveyFormData>(field: K, value: SurveyFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNext = async () => {
    if (surveyId) {
      await saveProgress({ surveyId, data: formData, currentBlock: currentBlock + 1 });
    }
    setCurrentBlock(prev => Math.min(prev + 1, TOTAL_BLOCKS));
  };
  
  const handleBack = () => {
    setCurrentBlock(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async () => {
    if (!surveyId) return;
    
    // Capture final effective time
    updateEffectiveTime();
    const effectiveTime = getEffectiveTime();
    
    await submitSurvey({ surveyId, data: formData, effectiveTimeSeconds: effectiveTime });
    onComplete?.();
    onOpenChange(false);
  };
  
  const progress = (currentBlock / TOTAL_BLOCKS) * 100;
  
  // Prevent closing if not completed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !hasCompleted && showPhotosMessage) {
      // Don't allow closing without completing
      return;
    }
    onOpenChange(newOpen);
  };
  
  if (hasCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Pesquisa já respondida
            </DialogTitle>
            <DialogDescription>
              Obrigado pela sua contribuição! Sua pesquisa já foi enviada.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => showPhotosMessage && e.preventDefault()}
        onEscapeKeyDown={(e) => showPhotosMessage && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Pesquisa de Satisfação e Perfil</DialogTitle>
          {showPhotosMessage && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2 text-foreground">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  Para acessar as fotos do curso, precisamos que você responda rapidamente esta pesquisa. 
                  <span className="text-muted-foreground"> Leva menos de 8 minutos e nos ajuda a evoluir ainda mais a formação.</span>
                </p>
              </div>
            </div>
          )}
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Bloco {currentBlock} de {TOTAL_BLOCKS}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {isInitializing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="py-4">
            {/* Block 1: Identification */}
            {currentBlock === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Identificação e Perfil Básico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Qual é o seu nome completo? *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name || ''}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Há quantos anos você exerce a medicina? *</Label>
                    <RadioGroup
                      value={formData.years_practicing || ''}
                      onValueChange={(v) => updateField('years_practicing', v)}
                    >
                      {[
                        { value: 'menos_3', label: 'Menos de 3 anos' },
                        { value: '3_7', label: 'De 3 a 7 anos' },
                        { value: '7_12', label: 'De 7 a 12 anos' },
                        { value: 'acima_12', label: 'Acima de 12 anos' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <Label htmlFor={opt.value} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Hoje você atua predominantemente em qual formato? *</Label>
                    <RadioGroup
                      value={formData.practice_format || ''}
                      onValueChange={(v) => updateField('practice_format', v)}
                    >
                      {[
                        { value: 'consultorio', label: 'Consultório' },
                        { value: 'clinica', label: 'Clínica' },
                        { value: 'hospital', label: 'Hospital' },
                        { value: 'misto', label: 'Atendimento misto' },
                        { value: 'nao_atuo', label: 'Ainda não atuo diretamente' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`format_${opt.value}`} />
                          <Label htmlFor={`format_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 2: General Satisfaction */}
            {currentBlock === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Satisfação Geral com o Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>No geral, qual é o seu nível de satisfação com o curso até agora? *</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[formData.satisfaction_score || 5]}
                        onValueChange={([v]) => updateField('satisfaction_score', v)}
                        min={1}
                        max={10}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>1 - Insatisfeito</span>
                        <span className="font-semibold text-foreground text-lg">{formData.satisfaction_score || 5}</span>
                        <span>10 - Muito satisfeito</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>O conteúdo apresentado até o momento atendeu às suas expectativas? *</Label>
                    <RadioGroup
                      value={formData.expectations_met || ''}
                      onValueChange={(v) => updateField('expectations_met', v)}
                    >
                      {[
                        { value: 'nao_atendeu', label: 'Não atendeu' },
                        { value: 'parcialmente', label: 'Atendeu parcialmente' },
                        { value: 'atendeu_bem', label: 'Atendeu bem' },
                        { value: 'superou', label: 'Superou minhas expectativas' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`exp_${opt.value}`} />
                          <Label htmlFor={`exp_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Os professores conseguiram explicar os conceitos de forma clara, prática e aplicável? *</Label>
                    <RadioGroup
                      value={formData.clarity_teachers || ''}
                      onValueChange={(v) => updateField('clarity_teachers', v)}
                    >
                      {[
                        { value: 'discordo_totalmente', label: 'Discordo totalmente' },
                        { value: 'discordo', label: 'Discordo' },
                        { value: 'neutro', label: 'Neutro' },
                        { value: 'concordo', label: 'Concordo' },
                        { value: 'concordo_totalmente', label: 'Concordo totalmente' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`clarity_${opt.value}`} />
                          <Label htmlFor={`clarity_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="what_liked_most">O que você mais gostou no curso até agora?</Label>
                    <Textarea
                      id="what_liked_most"
                      value={formData.what_liked_most || ''}
                      onChange={(e) => updateField('what_liked_most', e.target.value)}
                      placeholder="Conte-nos o que mais te marcou..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="what_could_improve">O que você acredita que poderia melhorar no curso?</Label>
                    <Textarea
                      id="what_could_improve"
                      value={formData.what_could_improve || ''}
                      onChange={(e) => updateField('what_could_improve', e.target.value)}
                      placeholder="Suas sugestões são muito importantes..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 3: Strategic Clarity */}
            {currentBlock === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clareza e Maturidade Estratégica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Após as aulas, o quanto você sente que o curso te mostrou um caminho sólido de evolução no Transplante Capilar? *</Label>
                    <RadioGroup
                      value={formData.evolution_path_clarity || ''}
                      onValueChange={(v) => updateField('evolution_path_clarity', v)}
                    >
                      {[
                        { value: 'confuso', label: 'Ainda estou confuso' },
                        { value: 'algumas_ideias', label: 'Tenho algumas ideias, mas sem plano claro' },
                        { value: 'boa_nocao', label: 'Já tenho boa noção do caminho' },
                        { value: 'pronto_avancar', label: 'Me sinto pronto para avançar' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`evolution_${opt.value}`} />
                          <Label htmlFor={`evolution_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Hoje, você sabe exatamente qual deve ser o seu próximo passo prático? *</Label>
                    <RadioGroup
                      value={formData.knows_next_step || ''}
                      onValueChange={(v) => updateField('knows_next_step', v)}
                    >
                      {[
                        { value: 'nao_sei', label: 'Não sei ainda' },
                        { value: 'ideia_sem_seguranca', label: 'Tenho uma ideia, mas sem segurança' },
                        { value: 'sei_proximo', label: 'Sei qual é o próximo passo' },
                        { value: 'organizando', label: 'Já estou me organizando para executar' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`next_${opt.value}`} />
                          <Label htmlFor={`next_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 4: Current Moment */}
            {currentBlock === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Momento Atual, Fome e Velocidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Qual frase mais representa o seu momento profissional atual? *</Label>
                    <RadioGroup
                      value={formData.professional_moment || ''}
                      onValueChange={(v) => updateField('professional_moment', v)}
                    >
                      {[
                        { value: 'calma', label: 'Quero aprender com calma e aplicar aos poucos' },
                        { value: 'orientacao', label: 'Quero orientação para acelerar resultados' },
                        { value: 'sozinho_dificil', label: 'Já percebi que sozinho é mais difícil' },
                        { value: 'salto_nivel', label: 'Quero dar um salto de nível profissional' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`moment_${opt.value}`} />
                          <Label htmlFor={`moment_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>O quanto esse projeto de Transplante Capilar é prioridade para você hoje? *</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[formData.priority_score || 5]}
                        onValueChange={([v]) => updateField('priority_score', v)}
                        min={1}
                        max={10}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>1 - Baixa prioridade</span>
                        <span className="font-semibold text-foreground text-lg">{formData.priority_score || 5}</span>
                        <span>10 - Alta prioridade</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Em quanto tempo você gostaria de iniciar ou intensificar sua atuação prática na área? *</Label>
                    <RadioGroup
                      value={formData.start_timeline || ''}
                      onValueChange={(v) => updateField('start_timeline', v)}
                    >
                      {[
                        { value: 'imediatamente', label: 'Imediatamente' },
                        { value: '30_dias', label: 'Nos próximos 30 dias' },
                        { value: '2_3_meses', label: 'Entre 2 e 3 meses' },
                        { value: 'sem_pressa', label: 'Sem pressa, no meu tempo' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`timeline_${opt.value}`} />
                          <Label htmlFor={`timeline_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 5: Time and Investment */}
            {currentBlock === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tempo Disponível e Investimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Nos próximos 30 dias, quanto tempo por semana você consegue dedicar para aplicar o que está aprendendo? *</Label>
                    <RadioGroup
                      value={formData.weekly_hours || ''}
                      onValueChange={(v) => updateField('weekly_hours', v)}
                    >
                      {[
                        { value: 'menos_2', label: 'Menos de 2 horas' },
                        { value: '2_4', label: '2 a 4 horas' },
                        { value: '4_6', label: '4 a 6 horas' },
                        { value: 'mais_6', label: 'Mais de 6 horas' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`hours_${opt.value}`} />
                          <Label htmlFor={`hours_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Hoje, você sente que tem mais disponibilidade de tempo ou mais capacidade de investimento financeiro? *</Label>
                    <RadioGroup
                      value={formData.time_vs_money || ''}
                      onValueChange={(v) => updateField('time_vs_money', v)}
                    >
                      {[
                        { value: 'mais_tempo', label: 'Mais tempo do que dinheiro' },
                        { value: 'equilibrado', label: 'Tempo e dinheiro equilibrados' },
                        { value: 'mais_dinheiro', label: 'Mais dinheiro do que tempo' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`timemoney_${opt.value}`} />
                          <Label htmlFor={`timemoney_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Considerando sua realidade atual, quanto você se sente confortável em investir para acelerar sua evolução nessa área? *</Label>
                    <RadioGroup
                      value={formData.investment_comfort || ''}
                      onValueChange={(v) => updateField('investment_comfort', v)}
                    >
                      {[
                        { value: 'ate_2500', label: 'Até R$ 2.500' },
                        { value: '2500_5000', label: 'De R$ 2.500 a R$ 5.000' },
                        { value: '5000_10000', label: 'De R$ 5.000 a R$ 10.000' },
                        { value: 'acima_10000', label: 'Acima de R$ 10.000' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`invest_${opt.value}`} />
                          <Label htmlFor={`invest_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 6: Future Vision */}
            {currentBlock === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visão de Futuro e Posicionamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Onde você se vê profissionalmente daqui a 12 meses se aplicar tudo o que está aprendendo? *</Label>
                    <RadioGroup
                      value={formData.future_vision_12m || ''}
                      onValueChange={(v) => updateField('future_vision_12m', v)}
                    >
                      {[
                        { value: 'seguro_consistente', label: 'Mais seguro e consistente' },
                        { value: 'servico_proprio', label: 'Estruturando um serviço próprio' },
                        { value: 'referencia', label: 'Tornando-me referência na área' },
                        { value: 'liderando', label: 'Liderando projetos ou clínicas' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`future_${opt.value}`} />
                          <Label htmlFor={`future_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="success_result">Qual resultado faria você sentir que tomou a decisão certa ao entrar nesse mercado?</Label>
                    <Textarea
                      id="success_result"
                      value={formData.success_result || ''}
                      onChange={(e) => updateField('success_result', e.target.value)}
                      placeholder="Descreva o resultado que você deseja alcançar..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 7: Technology and Commercial */}
            {currentBlock === 7 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tecnologia, Comercial e Próximo Passo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Qual frase melhor representa sua relação com IA e automações aplicadas à medicina? *</Label>
                    <RadioGroup
                      value={formData.ai_relation || ''}
                      onValueChange={(v) => updateField('ai_relation', v)}
                    >
                      {[
                        { value: 'aplicar_logo', label: 'Quero aplicar o quanto antes' },
                        { value: 'curiosidade', label: 'Tenho curiosidade, mas ainda não aplico' },
                        { value: 'interessante_distante', label: 'Acho interessante, mas distante' },
                        { value: 'tradicional', label: 'Prefiro métodos tradicionais' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`ai_${opt.value}`} />
                          <Label htmlFor={`ai_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Hoje, você já tem algum plano estruturado para captação e conversão de pacientes? *</Label>
                    <RadioGroup
                      value={formData.has_captation_plan || ''}
                      onValueChange={(v) => updateField('has_captation_plan', v)}
                    >
                      {[
                        { value: 'sim_claro', label: 'Sim, já tenho um plano claro' },
                        { value: 'algumas_ideias', label: 'Tenho algumas ideias' },
                        { value: 'nao_pensei', label: 'Ainda não pensei nisso' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`captation_${opt.value}`} />
                          <Label htmlFor={`captation_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Você gostaria de ter uma conversa individual para alinhar e acelerar seu plano de crescimento? *</Label>
                    <RadioGroup
                      value={formData.wants_individual_talk || ''}
                      onValueChange={(v) => updateField('wants_individual_talk', v)}
                    >
                      {[
                        { value: 'sim', label: 'Sim, com certeza' },
                        { value: 'talvez', label: 'Talvez, dependendo do horário' },
                        { value: 'prefiro_continuar', label: 'Prefiro seguir aprendendo por enquanto' },
                      ].map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt.value} id={`talk_${opt.value}`} />
                          <Label htmlFor={`talk_${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Block 8: Final Feedback */}
            {currentBlock === 8 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feedback Final e Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="what_differentiates_best">Na sua visão, o que médicos que se destacam nessa área fazem de diferente?</Label>
                    <Textarea
                      id="what_differentiates_best"
                      value={formData.what_differentiates_best || ''}
                      onChange={(e) => updateField('what_differentiates_best', e.target.value)}
                      placeholder="Compartilhe sua percepção..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="memorable_phrase">Em uma frase, o que fez essa formação ser inesquecível para você?</Label>
                    <Textarea
                      id="memorable_phrase"
                      value={formData.memorable_phrase || ''}
                      onChange={(e) => updateField('memorable_phrase', e.target.value)}
                      placeholder="Sua frase..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentBlock === 1 || isSaving}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          {currentBlock < TOTAL_BLOCKS ? (
            <Button onClick={handleNext} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Enviar Pesquisa
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
