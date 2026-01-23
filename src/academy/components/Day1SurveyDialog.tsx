import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useDay1Survey, Day1SurveyFormData } from '../hooks/useDay1Survey';

interface Day1SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onComplete?: () => void;
}

const TOTAL_SECTIONS = 7;

const SECTION_TITLES = [
  'Satisfação Geral',
  'Aula Dr. Hygor Guerreiro',
  'Aula Dr. Patrick Penaforte',
  'Avaliação Geral do Evento',
  'Feedback Aberto',
  'Diagnóstico de Início de Curso',
  'Avaliação dos Monitores',
];

export function Day1SurveyDialog({ open, onOpenChange, classId, onComplete }: Day1SurveyDialogProps) {
  const { surveyResponse, hasCompleted, isLoading, startSurvey, saveProgress, submitSurvey, isSaving, isSubmitting } = useDay1Survey(classId);
  
  const [currentSection, setCurrentSection] = useState(1);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Day1SurveyFormData>>({});
  
  useEffect(() => {
    if (open && !surveyId && !hasCompleted) {
      startSurvey(classId || null).then((survey) => {
        setSurveyId(survey.id);
        setCurrentSection(survey.current_section || 1);
        setFormData(survey as Partial<Day1SurveyFormData>);
      });
    }
  }, [open, surveyId, hasCompleted, classId, startSurvey]);
  
  useEffect(() => {
    if (!open) {
      setSurveyId(null);
      setCurrentSection(1);
      setFormData({});
    }
  }, [open]);
  
  const updateField = <K extends keyof Day1SurveyFormData>(key: K, value: Day1SurveyFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleNext = async () => {
    if (surveyId) {
      await saveProgress({ surveyId, data: formData, currentSection: currentSection + 1 });
    }
    setCurrentSection(prev => Math.min(prev + 1, TOTAL_SECTIONS));
  };
  
  const handleBack = () => {
    setCurrentSection(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async () => {
    if (surveyId) {
      await submitSurvey({ surveyId, data: formData });
      onComplete?.();
      onOpenChange(false);
    }
  };
  
  const progress = (currentSection / TOTAL_SECTIONS) * 100;
  
  if (hasCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Pesquisa já respondida
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Você já respondeu à pesquisa de satisfação do Dia 1. Obrigado pelo feedback!
          </p>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 Pesquisa de Satisfação - Dia 1</DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Seção {currentSection} de {TOTAL_SECTIONS}</span>
              <span>{SECTION_TITLES[currentSection - 1]}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Section 1: Satisfação Geral */}
            {currentSection === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Satisfação Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-medium">1. No geral, qual é o seu nível de satisfação com o curso, até agora?</Label>
                    <RadioGroup 
                      value={formData.q1_satisfaction_level || ''} 
                      onValueChange={(v) => updateField('q1_satisfaction_level', v)}
                    >
                      {['Muito insatisfeito', 'Insatisfeito', 'Neutro', 'Satisfeito', 'Muito satisfeito'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q1-${option}`} />
                          <Label htmlFor={`q1-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">2. Esta é a primeira vez que você participa de um curso de Transplante Capilar?</Label>
                    <RadioGroup 
                      value={formData.q2_first_time_course === true ? 'sim' : formData.q2_first_time_course === false ? 'nao' : ''} 
                      onValueChange={(v) => updateField('q2_first_time_course', v === 'sim')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="q2-sim" />
                        <Label htmlFor="q2-sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="q2-nao" />
                        <Label htmlFor="q2-nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Section 2: Aula Dr. Hygor */}
            {currentSection === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aula Dr. Hygor Guerreiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-medium">3. O tema abordado atendeu às suas expectativas?</Label>
                    <RadioGroup 
                      value={formData.q3_hygor_expectations || ''} 
                      onValueChange={(v) => updateField('q3_hygor_expectations', v)}
                    >
                      {['Não atendeu', 'Atendeu parcialmente', 'Atendeu totalmente'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q3-${option}`} />
                          <Label htmlFor={`q3-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">4. O professor conseguiu explicar os conceitos de forma clara e compreensível?</Label>
                    <RadioGroup 
                      value={formData.q4_hygor_clarity || ''} 
                      onValueChange={(v) => updateField('q4_hygor_clarity', v)}
                    >
                      {['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q4-${option}`} />
                          <Label htmlFor={`q4-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">5. Você sentiu que o tempo da aula foi suficiente para abordar o tema?</Label>
                    <RadioGroup 
                      value={formData.q5_hygor_time || ''} 
                      onValueChange={(v) => updateField('q5_hygor_time', v)}
                    >
                      {['Insuficiente', 'Adequado', 'Mais do que suficiente'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q5-${option}`} />
                          <Label htmlFor={`q5-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">6. O que você mais gostou na aula do Dr. Hygor Guerreiro?</Label>
                    <Textarea 
                      value={formData.q6_hygor_liked_most || ''} 
                      onChange={(e) => updateField('q6_hygor_liked_most', e.target.value)}
                      placeholder="Sua resposta..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">7. O que poderia melhorar na aula do Dr. Hygor Guerreiro?</Label>
                    <Textarea 
                      value={formData.q7_hygor_improve || ''} 
                      onChange={(e) => updateField('q7_hygor_improve', e.target.value)}
                      placeholder="Sua resposta..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Section 3: Aula Dr. Patrick */}
            {currentSection === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aula Dr. Patrick Penaforte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-medium">8. O tema abordado atendeu às suas expectativas?</Label>
                    <RadioGroup 
                      value={formData.q8_patrick_expectations || ''} 
                      onValueChange={(v) => updateField('q8_patrick_expectations', v)}
                    >
                      {['Não atendeu', 'Atendeu parcialmente', 'Atendeu totalmente'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q8-${option}`} />
                          <Label htmlFor={`q8-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">9. O professor conseguiu explicar os conceitos de forma clara e compreensível?</Label>
                    <RadioGroup 
                      value={formData.q9_patrick_clarity || ''} 
                      onValueChange={(v) => updateField('q9_patrick_clarity', v)}
                    >
                      {['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q9-${option}`} />
                          <Label htmlFor={`q9-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">10. Você sentiu que o tempo da aula foi suficiente para abordar o tema?</Label>
                    <RadioGroup 
                      value={formData.q10_patrick_time || ''} 
                      onValueChange={(v) => updateField('q10_patrick_time', v)}
                    >
                      {['Insuficiente', 'Adequado', 'Mais do que suficiente'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q10-${option}`} />
                          <Label htmlFor={`q10-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">11. O que você mais gostou na aula do Dr. Patrick Penaforte?</Label>
                    <Textarea 
                      value={formData.q11_patrick_liked_most || ''} 
                      onChange={(e) => updateField('q11_patrick_liked_most', e.target.value)}
                      placeholder="Sua resposta..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">12. O que poderia melhorar na aula do Dr. Patrick Penaforte?</Label>
                    <Textarea 
                      value={formData.q12_patrick_improve || ''} 
                      onChange={(e) => updateField('q12_patrick_improve', e.target.value)}
                      placeholder="Sua resposta..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Section 4: Avaliação Geral do Evento */}
            {currentSection === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avaliação Geral do Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: 'q13_organization', label: '13. Organização geral do evento' },
                    { key: 'q14_content_relevance', label: '14. Clareza e relevância dos conteúdos apresentados' },
                    { key: 'q15_teacher_competence', label: '15. Competência e didática dos professores' },
                    { key: 'q16_material_quality', label: '16. Qualidade dos materiais de apoio' },
                    { key: 'q17_punctuality', label: '17. Pontualidade no início e término das atividades' },
                    { key: 'q18_infrastructure', label: '18. Infraestrutura do local' },
                    { key: 'q19_support_team', label: '19. Atendimento e suporte da equipe organizadora' },
                    { key: 'q20_coffee_break', label: '20. Qualidade do Coffee Break' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <Label className="font-medium">{label}</Label>
                      <RadioGroup 
                        value={(formData as Record<string, unknown>)[key] as string || ''} 
                        onValueChange={(v) => updateField(key as keyof Day1SurveyFormData, v)}
                        className="flex flex-wrap gap-4"
                      >
                        {['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${key}-${option}`} />
                            <Label htmlFor={`${key}-${option}`} className="font-normal text-sm">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {/* Section 5: Feedback Aberto */}
            {currentSection === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feedback Aberto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-medium">21. O que você mais gostou no curso hoje?</Label>
                    <Textarea 
                      value={formData.q21_liked_most_today || ''} 
                      onChange={(e) => updateField('q21_liked_most_today', e.target.value)}
                      placeholder="Sua resposta..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">22. Se pudesse mudar ou acrescentar algo para os próximos dias, o que seria?</Label>
                    <Textarea 
                      value={formData.q22_suggestions || ''} 
                      onChange={(e) => updateField('q22_suggestions', e.target.value)}
                      placeholder="Sua resposta..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Section 6: Diagnóstico de Início */}
            {currentSection === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diagnóstico de Início de Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-medium">23. Você pretende iniciar imediatamente ou prefere ir mais lento?</Label>
                    <RadioGroup 
                      value={formData.q23_start_preference || ''} 
                      onValueChange={(v) => updateField('q23_start_preference', v)}
                    >
                      {['Iniciar imediatamente', 'Ir mais lento'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q23-${option}`} />
                          <Label htmlFor={`q23-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">24. Qual seu nível de fome por resultado agora?</Label>
                    <RadioGroup 
                      value={formData.q24_hunger_level || ''} 
                      onValueChange={(v) => updateField('q24_hunger_level', v)}
                    >
                      {['Baixa', 'Média', 'Alta'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q24-${option}`} />
                          <Label htmlFor={`q24-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">25. Qual sua urgência para iniciar na área?</Label>
                    <RadioGroup 
                      value={formData.q25_urgency_level || ''} 
                      onValueChange={(v) => updateField('q25_urgency_level', v)}
                    >
                      {['Sem urgência', 'Média urgência', 'Alta urgência'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q25-${option}`} />
                          <Label htmlFor={`q25-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">26. Quanto você está disposto a investir neste momento?</Label>
                    <RadioGroup 
                      value={formData.q26_investment_level || ''} 
                      onValueChange={(v) => updateField('q26_investment_level', v)}
                    >
                      {['Até R$ 10 mil', 'De R$ 10 mil a R$ 30 mil', 'Acima de R$ 30 mil'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q26-${option}`} />
                          <Label htmlFor={`q26-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">27. Quanto tempo disponível você tem para se dedicar semanalmente?</Label>
                    <RadioGroup 
                      value={formData.q27_weekly_time || ''} 
                      onValueChange={(v) => updateField('q27_weekly_time', v)}
                    >
                      {['Até 5 horas', 'De 5 a 10 horas', 'Mais de 10 horas'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q27-${option}`} />
                          <Label htmlFor={`q27-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">28. Qual alternativa melhor representa sua realidade hoje?</Label>
                    <RadioGroup 
                      value={formData.q28_current_reality || ''} 
                      onValueChange={(v) => updateField('q28_current_reality', v)}
                    >
                      {[
                        'Baixo tempo e baixo investimento',
                        'Baixo tempo e alto investimento',
                        'Alto tempo e baixo investimento',
                        'Alto tempo e alto investimento',
                      ].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q28-${option}`} />
                          <Label htmlFor={`q28-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Section 7: Avaliação dos Monitores */}
            {currentSection === 7 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avaliação dos Monitores - Dia 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="font-medium">29. Qual monitor você está avaliando?</Label>
                    <RadioGroup 
                      value={formData.q29_monitor_name || ''} 
                      onValueChange={(v) => updateField('q29_monitor_name', v)}
                    >
                      {['Dr Elenilton', 'Dra Gleyldes', 'Dr Elder', 'Dr Patrick'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q29-${option}`} />
                          <Label htmlFor={`q29-${option}`} className="font-normal">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  {[
                    { key: 'q30_monitor_technical', label: '30. Avalie o domínio técnico do monitor' },
                    { key: 'q31_monitor_interest', label: '31. Interesse do monitor em ensinar e orientar' },
                    { key: 'q32_monitor_engagement', label: '32. Engajamento do monitor com a turma' },
                    { key: 'q33_monitor_posture', label: '33. Postura profissional do monitor' },
                    { key: 'q34_monitor_communication', label: '34. Comunicação com os alunos' },
                    { key: 'q35_monitor_contribution', label: '35. Contribuição do monitor para sua experiência no curso' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-3">
                      <Label className="font-medium">{label}</Label>
                      <RadioGroup 
                        value={(formData as Record<string, unknown>)[key] as string || ''} 
                        onValueChange={(v) => updateField(key as keyof Day1SurveyFormData, v)}
                        className="flex flex-wrap gap-4"
                      >
                        {['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${key}-${option}`} />
                            <Label htmlFor={`${key}-${option}`} className="font-normal text-sm">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  
                  <div className="space-y-3">
                    <Label className="font-medium">36. Qual foi o principal ponto forte desse monitor?</Label>
                    <Textarea 
                      value={formData.q36_monitor_strength || ''} 
                      onChange={(e) => updateField('q36_monitor_strength', e.target.value)}
                      placeholder="Sua resposta..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="font-medium">37. O que esse monitor pode melhorar para as próximas turmas?</Label>
                    <Textarea 
                      value={formData.q37_monitor_improve || ''} 
                      onChange={(e) => updateField('q37_monitor_improve', e.target.value)}
                      placeholder="Sua resposta..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={currentSection === 1 || isSaving}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              {currentSection < TOTAL_SECTIONS ? (
                <Button onClick={handleNext} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} variant="default">
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Enviar Pesquisa
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
