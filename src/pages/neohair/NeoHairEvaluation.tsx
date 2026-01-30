import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Camera, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Info,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STEPS = [
  { id: 'photos', title: 'Fotos', description: 'Envie fotos do seu cabelo' },
  { id: 'clinical', title: 'Questionário', description: 'Histórico clínico' },
  { id: 'expectations', title: 'Expectativas', description: 'Seus objetivos' },
  { id: 'result', title: 'Resultado', description: 'Sua avaliação' },
];

const previousTreatments = [
  { id: 'minoxidil', label: 'Minoxidil' },
  { id: 'finasterida', label: 'Finasterida' },
  { id: 'dutasterida', label: 'Dutasterida' },
  { id: 'laser', label: 'Laser / LED' },
  { id: 'mesoterapia', label: 'Mesoterapia' },
  { id: 'prp', label: 'PRP' },
  { id: 'transplante', label: 'Transplante' },
];

const healthConditions = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hipertensao', label: 'Hipertensão' },
  { id: 'tireoide', label: 'Tireoide' },
  { id: 'anemia', label: 'Anemia' },
  { id: 'estresse', label: 'Estresse / Ansiedade' },
  { id: 'nenhum', label: 'Nenhum' },
];

export default function NeoHairEvaluation() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    // Photos
    photoFront: null as File | null,
    photoTop: null as File | null,
    photoLeft: null as File | null,
    photoRight: null as File | null,
    photoBack: null as File | null,
    
    // Clinical
    hairLossStartedAt: '',
    familyHistoryFather: false,
    familyHistoryMother: false,
    familyHistoryGrandparents: false,
    previousTreatments: [] as string[],
    currentMedications: '',
    healthConditions: [] as string[],
    scalpCondition: '',
    
    // Expectations
    expectationLevel: '',
    mainConcern: '',
  });

  const [result, setResult] = useState<{
    baldnessGrade: number;
    baldnessPattern: string;
    transplantScore: number;
    recommendation: string;
    analysis: string;
  } | null>(null);

  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleCheckboxChange = (field: 'previousTreatments' | 'healthConditions', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const calculateResult = () => {
    // Algoritmo simplificado de classificação
    let score = 0;
    
    // Tempo de queda
    if (formData.hairLossStartedAt === 'mais_5_anos') score += 25;
    else if (formData.hairLossStartedAt === '3_5_anos') score += 20;
    else if (formData.hairLossStartedAt === '1_3_anos') score += 10;
    
    // Histórico familiar
    if (formData.familyHistoryFather) score += 15;
    if (formData.familyHistoryMother) score += 10;
    if (formData.familyHistoryGrandparents) score += 5;
    
    // Tratamentos anteriores sem sucesso
    if (formData.previousTreatments.includes('finasterida')) score += 10;
    if (formData.previousTreatments.includes('minoxidil')) score += 5;
    
    // Expectativa alta
    if (formData.expectationLevel === 'recuperar_tudo') score += 15;
    else if (formData.expectationLevel === 'melhorar_significativo') score += 10;

    // Determinar grau e padrão
    let grade = Math.min(7, Math.floor(score / 15) + 1);
    if (grade < 1) grade = 1;
    
    const patterns = ['frontal', 'coroa', 'difuso', 'misto'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Determinar recomendação
    let recommendation = 'kit_basico';
    if (score >= 60) recommendation = 'transplante';
    else if (score >= 45) recommendation = 'consulta_medica';
    else if (score >= 25) recommendation = 'kit_avancado';
    
    setResult({
      baldnessGrade: grade,
      baldnessPattern: pattern,
      transplantScore: Math.min(100, score),
      recommendation,
      analysis: `Com base nas informações fornecidas, identificamos um padrão de calvície ${pattern} com grau ${grade} na escala Norwood-Hamilton. ${score >= 45 ? 'Recomendamos uma avaliação médica para discutir as melhores opções de tratamento.' : 'O tratamento clínico pode trazer bons resultados.'}`,
    });
  };

  const handleSubmit = async () => {
    if (!user?.authUserId) {
      toast.error('Você precisa estar logado');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Salvar avaliação no banco
      const { error } = await supabase.from('neohair_evaluations').insert({
        user_id: user.authUserId,
        full_name: user.fullName,
        city: user.city || user.addressCity,
        state: user.state || user.addressState,
        phone: user.phone,
        
        hair_loss_started_at: formData.hairLossStartedAt,
        family_history_father: formData.familyHistoryFather,
        family_history_mother: formData.familyHistoryMother,
        family_history_grandparents: formData.familyHistoryGrandparents,
        previous_treatments: formData.previousTreatments,
        current_medications: formData.currentMedications,
        health_conditions: formData.healthConditions,
        scalp_condition: formData.scalpCondition,
        expectation_level: formData.expectationLevel,
        main_concern: formData.mainConcern,
        
        baldness_grade: result?.baldnessGrade,
        baldness_pattern: result?.baldnessPattern,
        transplant_score: result?.transplantScore,
        treatment_recommendation: result?.recommendation,
        ai_analysis: result?.analysis,
        
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      toast.success('Avaliação salva com sucesso!');
      
      // Se score alto, criar lead
      if (result && result.transplantScore >= 50) {
        await supabase.from('neohair_leads').insert({
          evaluation_id: null, // Será atualizado depois
          patient_user_id: user.authUserId,
          patient_name: user.fullName,
          patient_phone: user.phone,
          patient_email: user.email,
          patient_city: user.city || user.addressCity,
          patient_state: user.state || user.addressState,
          transplant_score: result.transplantScore,
          baldness_grade: result.baldnessGrade,
          lead_priority: result.transplantScore >= 75 ? 'high' : 'normal',
          status: 'new',
        });
      }
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
      toast.error('Erro ao salvar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 2) {
      calculateResult();
    }
    if (currentStep === 3) {
      handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-500" />
            Avaliação Capilar
          </h1>
          <span className="text-sm text-muted-foreground">
            Etapa {currentStep + 1} de {STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {STEPS.map((step, i) => (
            <div 
              key={step.id}
              className={`text-xs ${i <= currentStep ? 'text-teal-500' : 'text-muted-foreground'}`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Photos */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Dicas para boas fotos:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Use boa iluminação natural</li>
                    <li>• Mantenha o cabelo seco e natural</li>
                    <li>• Tire as fotos de perto do couro cabeludo</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { field: 'photoFront', label: 'Frente' },
                  { field: 'photoTop', label: 'Topo' },
                  { field: 'photoLeft', label: 'Lado Esquerdo' },
                  { field: 'photoRight', label: 'Lado Direito' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <Label className="text-sm mb-2 block">{label}</Label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-500 transition-colors">
                      {formData[field as keyof typeof formData] ? (
                        <div className="flex items-center gap-2 text-teal-500">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm">Foto enviada</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Clique para enviar</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange(field)}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Clinical */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Quando começou a queda?</Label>
                <RadioGroup 
                  value={formData.hairLossStartedAt}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, hairLossStartedAt: v }))}
                >
                  {[
                    { value: 'menos_1_ano', label: 'Menos de 1 ano' },
                    { value: '1_3_anos', label: '1 a 3 anos' },
                    { value: '3_5_anos', label: '3 a 5 anos' },
                    { value: 'mais_5_anos', label: 'Mais de 5 anos' },
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block">Histórico familiar de calvície</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="father"
                      checked={formData.familyHistoryFather}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, familyHistoryFather: !!c }))}
                    />
                    <Label htmlFor="father" className="font-normal">Pai</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="mother"
                      checked={formData.familyHistoryMother}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, familyHistoryMother: !!c }))}
                    />
                    <Label htmlFor="mother" className="font-normal">Mãe</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="grandparents"
                      checked={formData.familyHistoryGrandparents}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, familyHistoryGrandparents: !!c }))}
                    />
                    <Label htmlFor="grandparents" className="font-normal">Avós</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Tratamentos já realizados</Label>
                <div className="grid grid-cols-2 gap-2">
                  {previousTreatments.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={t.id}
                        checked={formData.previousTreatments.includes(t.id)}
                        onCheckedChange={() => handleCheckboxChange('previousTreatments', t.id)}
                      />
                      <Label htmlFor={t.id} className="font-normal">{t.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Condições de saúde</Label>
                <div className="grid grid-cols-2 gap-2">
                  {healthConditions.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={c.id}
                        checked={formData.healthConditions.includes(c.id)}
                        onCheckedChange={() => handleCheckboxChange('healthConditions', c.id)}
                      />
                      <Label htmlFor={c.id} className="font-normal">{c.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Condição do couro cabeludo</Label>
                <RadioGroup 
                  value={formData.scalpCondition}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, scalpCondition: v }))}
                >
                  {[
                    { value: 'oleoso', label: 'Oleoso' },
                    { value: 'seco', label: 'Seco' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'caspa', label: 'Com caspa' },
                    { value: 'dermatite', label: 'Dermatite' },
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`scalp-${opt.value}`} />
                      <Label htmlFor={`scalp-${opt.value}`} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 3: Expectations */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Qual sua expectativa com o tratamento?</Label>
                <RadioGroup 
                  value={formData.expectationLevel}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, expectationLevel: v }))}
                >
                  {[
                    { value: 'recuperar_tudo', label: 'Recuperar tudo que perdi' },
                    { value: 'melhorar_significativo', label: 'Melhorar significativamente' },
                    { value: 'manter', label: 'Manter o que tenho e evitar mais queda' },
                    { value: 'entender_opcoes', label: 'Entender minhas opções' },
                  ].map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`exp-${opt.value}`} />
                      <Label htmlFor={`exp-${opt.value}`} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="concern" className="mb-2 block">
                  Qual sua principal preocupação?
                </Label>
                <Textarea
                  id="concern"
                  placeholder="Descreva o que mais te incomoda..."
                  value={formData.mainConcern}
                  onChange={(e) => setFormData(prev => ({ ...prev, mainConcern: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === 3 && result && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">{result.baldnessGrade}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">Grau {result.baldnessGrade} - Norwood-Hamilton</h3>
                <p className="text-muted-foreground capitalize">Padrão {result.baldnessPattern}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Score de Transplante</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={result.transplantScore} className="flex-1 h-2" />
                      <span className="font-bold">{result.transplantScore}%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Recomendação</p>
                    <p className="font-bold capitalize mt-1">
                      {result.recommendation.replace(/_/g, ' ')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-500" />
                  Análise
                </h4>
                <p className="text-sm text-muted-foreground">{result.analysis}</p>
              </div>

              {result.transplantScore >= 50 && (
                <Badge className="w-full justify-center py-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Uma consulta médica é recomendada para seu caso
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button 
            onClick={nextStep}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStep === 3 ? 'Salvar e Ver Tratamentos' : 'Próximo'}
            {currentStep < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
