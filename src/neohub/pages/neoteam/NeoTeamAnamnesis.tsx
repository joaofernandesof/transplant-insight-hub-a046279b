import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, 
  Save, 
  ChevronLeft,
  User,
  Stethoscope,
  Heart,
  Brain,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const interestRegions = [
  { id: 'couro_cabeludo', label: 'Couro Cabeludo' },
  { id: 'barba', label: 'Barba' },
  { id: 'sobrancelhas', label: 'Sobrancelhas' },
  { id: 'outras', label: 'Outras' },
];

const baldnessGrades = [1, 2, 3, 4, 5, 6, 7];

export function NeoTeamAnamnesis() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_name: '',
    health_insurance: '',
    health_insurance_type: '',
    profession: '',
    age: '',
    interest_regions: [] as string[],
    baldness_grade: null as number | null,
    hair_loss_evolution: '',
    main_complaint: '',
    previous_clinical_treatment: '',
    previous_transplant: '',
    continuous_medications: '',
    chronic_diseases: '',
    known_allergies: '',
    previous_surgeries: '',
    blood_pressure: '',
    family_baldness: '',
    recent_exams: '',
    current_feeling: '',
    how_found_clinic: '',
    follows_neofolic: '',
    seen_other_results: '',
    visited_other_clinics: '',
    urgency_level: 5,
    important_event: '',
    best_time_procedure: '',
    price_awareness: '',
    decision_factors: '',
    additional_info: '',
  });

  const handleInputChange = (field: string, value: string | number | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegionToggle = (regionId: string) => {
    setFormData(prev => ({
      ...prev,
      interest_regions: prev.interest_regions.includes(regionId)
        ? prev.interest_regions.filter(r => r !== regionId)
        : [...prev.interest_regions, regionId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.patient_name) {
      toast.error('Nome do paciente é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('neoteam_anamnesis')
        .insert({
          patient_name: formData.patient_name,
          health_insurance: formData.health_insurance || null,
          health_insurance_type: formData.health_insurance_type || null,
          profession: formData.profession || null,
          age: formData.age ? parseInt(formData.age) : null,
          interest_regions: formData.interest_regions,
          baldness_grade: formData.baldness_grade,
          hair_loss_evolution: formData.hair_loss_evolution || null,
          main_complaint: formData.main_complaint || null,
          previous_clinical_treatment: formData.previous_clinical_treatment || null,
          previous_transplant: formData.previous_transplant || null,
          continuous_medications: formData.continuous_medications || null,
          chronic_diseases: formData.chronic_diseases || null,
          known_allergies: formData.known_allergies || null,
          previous_surgeries: formData.previous_surgeries || null,
          blood_pressure: formData.blood_pressure || null,
          family_baldness: formData.family_baldness || null,
          recent_exams: formData.recent_exams || null,
          current_feeling: formData.current_feeling || null,
          how_found_clinic: formData.how_found_clinic || null,
          follows_neofolic: formData.follows_neofolic || null,
          seen_other_results: formData.seen_other_results || null,
          visited_other_clinics: formData.visited_other_clinics || null,
          urgency_level: formData.urgency_level,
          important_event: formData.important_event || null,
          best_time_procedure: formData.best_time_procedure || null,
          price_awareness: formData.price_awareness || null,
          decision_factors: formData.decision_factors || null,
          additional_info: formData.additional_info || null,
          created_by: user?.id,
          status: 'completed'
        });

      if (error) throw error;

      toast.success('Anamnese salva com sucesso!');
      navigate('/neoteam/patients');
    } catch (error: any) {
      console.error('Error saving anamnesis:', error);
      toast.error('Erro ao salvar anamnese');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="p-4 pt-16 lg:pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                Anamnese
              </h1>
              <p className="text-sm text-muted-foreground">
                Checklist para inclusão em prontuário
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-6 pr-4">
            {/* Seção 1: Dados do Paciente */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Dados do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_name">
                      Nome do Paciente <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="patient_name"
                      value={formData.patient_name}
                      onChange={(e) => handleInputChange('patient_name', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Idade</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Ex: 35"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profissão</Label>
                    <Input
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      placeholder="Ex: Engenheiro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="health_insurance">Plano de Saúde</Label>
                    <Input
                      id="health_insurance"
                      value={formData.health_insurance}
                      onChange={(e) => handleInputChange('health_insurance', e.target.value)}
                      placeholder="Ex: Unimed, Hapvida, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health_insurance_type">
                    (Se Unimed ou Hapvida) Qual tipo do plano?
                  </Label>
                  <Input
                    id="health_insurance_type"
                    value={formData.health_insurance_type}
                    onChange={(e) => handleInputChange('health_insurance_type', e.target.value)}
                    placeholder="Ex: Empresarial, Individual, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção 2: Avaliação Capilar */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Avaliação Capilar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Região de Interesse <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-3">
                    {interestRegions.map((region) => (
                      <div key={region.id} className="flex items-center gap-2">
                        <Checkbox
                          id={region.id}
                          checked={formData.interest_regions.includes(region.id)}
                          onCheckedChange={() => handleRegionToggle(region.id)}
                        />
                        <Label htmlFor={region.id} className="cursor-pointer text-sm">
                          {region.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Grau de Calvície</Label>
                  <div className="flex flex-wrap gap-2">
                    {baldnessGrades.map((grade) => (
                      <Button
                        key={grade}
                        type="button"
                        variant={formData.baldness_grade === grade ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleInputChange('baldness_grade', grade)}
                        className="w-16"
                      >
                        Grau {grade}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hair_loss_evolution">Tempo de Evolução da Queda/Rarefação</Label>
                  <Textarea
                    id="hair_loss_evolution"
                    value={formData.hair_loss_evolution}
                    onChange={(e) => handleInputChange('hair_loss_evolution', e.target.value)}
                    placeholder="Descreva o tempo de evolução..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="main_complaint">Queixa Principal (Área e Intensidade)</Label>
                  <Textarea
                    id="main_complaint"
                    value={formData.main_complaint}
                    onChange={(e) => handleInputChange('main_complaint', e.target.value)}
                    placeholder="Descreva a queixa principal..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_clinical_treatment">
                    Já fez algum tratamento clínico? (Minoxidil, Finasterida, PRP, Laser etc...)
                  </Label>
                  <Textarea
                    id="previous_clinical_treatment"
                    value={formData.previous_clinical_treatment}
                    onChange={(e) => handleInputChange('previous_clinical_treatment', e.target.value)}
                    placeholder="Descreva os tratamentos anteriores..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_transplant">
                    Já realizou transplante capilar antes? (Se sim, onde?)
                  </Label>
                  <Textarea
                    id="previous_transplant"
                    value={formData.previous_transplant}
                    onChange={(e) => handleInputChange('previous_transplant', e.target.value)}
                    placeholder="Descreva transplantes anteriores..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção 3: Histórico Médico */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Histórico Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="continuous_medications">
                    Uso de medicamentos contínuos? (Quais e para quê?)
                  </Label>
                  <Textarea
                    id="continuous_medications"
                    value={formData.continuous_medications}
                    onChange={(e) => handleInputChange('continuous_medications', e.target.value)}
                    placeholder="Liste os medicamentos em uso..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chronic_diseases">
                    Possui doenças crônicas? (Diabetes, Hipertensão, Doenças autoimunes, etc)
                  </Label>
                  <Textarea
                    id="chronic_diseases"
                    value={formData.chronic_diseases}
                    onChange={(e) => handleInputChange('chronic_diseases', e.target.value)}
                    placeholder="Liste as doenças crônicas..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="known_allergies">Alergias conhecidas?</Label>
                  <Textarea
                    id="known_allergies"
                    value={formData.known_allergies}
                    onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                    placeholder="Liste as alergias..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_surgeries">
                    Cirurgias prévias? (Quais e quando ocorreram?)
                  </Label>
                  <Textarea
                    id="previous_surgeries"
                    value={formData.previous_surgeries}
                    onChange={(e) => handleInputChange('previous_surgeries', e.target.value)}
                    placeholder="Liste as cirurgias anteriores..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blood_pressure">Pressão Arterial</Label>
                    <Input
                      id="blood_pressure"
                      value={formData.blood_pressure}
                      onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
                      placeholder="Ex: 120x80"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="family_baldness">
                      Presença de calvície na família? (Materna, Paterna, Ambas?)
                    </Label>
                    <Input
                      id="family_baldness"
                      value={formData.family_baldness}
                      onChange={(e) => handleInputChange('family_baldness', e.target.value)}
                      placeholder="Ex: Paterna"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recent_exams">
                    Realizou exames recentes? (Sangue, coração, etc)
                  </Label>
                  <Textarea
                    id="recent_exams"
                    value={formData.recent_exams}
                    onChange={(e) => handleInputChange('recent_exams', e.target.value)}
                    placeholder="Liste os exames recentes..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção 4: Percepção e Expectativas */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Percepção e Expectativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_feeling">
                    Como você se sente hoje em relação ao seu cabelo/barba/sobrancelha em comparação a alguns anos atrás?
                  </Label>
                  <Textarea
                    id="current_feeling"
                    value={formData.current_feeling}
                    onChange={(e) => handleInputChange('current_feeling', e.target.value)}
                    placeholder="Descreva seus sentimentos..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="how_found_clinic">Como você conheceu nossa clínica?</Label>
                  <Textarea
                    id="how_found_clinic"
                    value={formData.how_found_clinic}
                    onChange={(e) => handleInputChange('how_found_clinic', e.target.value)}
                    placeholder="Instagram, indicação, Google..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="follows_neofolic">
                    Você já acompanha o trabalho da NeoFolic e do Doutor?
                  </Label>
                  <Textarea
                    id="follows_neofolic"
                    value={formData.follows_neofolic}
                    onChange={(e) => handleInputChange('follows_neofolic', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seen_other_results">
                    Você já chegou a ver algum resultado de paciente que fez o procedimento com a gente ou com outro médico?
                  </Label>
                  <Textarea
                    id="seen_other_results"
                    value={formData.seen_other_results}
                    onChange={(e) => handleInputChange('seen_other_results', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visited_other_clinics">
                    Chegou a pesquisar ou visitar outra clínica antes?
                  </Label>
                  <Textarea
                    id="visited_other_clinics"
                    value={formData.visited_other_clinics}
                    onChange={(e) => handleInputChange('visited_other_clinics', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <Label>
                    De 0 a 10, sendo 0 apenas entender como funciona e 10 querendo fazer o transplante o mais rápido possível, onde você encontra agora?
                  </Label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">0</span>
                    <Slider
                      value={[formData.urgency_level]}
                      onValueChange={(value) => handleInputChange('urgency_level', value[0])}
                      max={10}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-6">10</span>
                    <Badge variant="secondary" className="ml-2 min-w-[40px] justify-center">
                      {formData.urgency_level}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="important_event">
                    Tem algum evento ou momento importante que você gostaria de estar com esse resultado já pronto?
                  </Label>
                  <Textarea
                    id="important_event"
                    value={formData.important_event}
                    onChange={(e) => handleInputChange('important_event', e.target.value)}
                    placeholder="Ex: casamento, formatura..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="best_time_procedure">
                    Quando imagina que seria o melhor momento para fazer o procedimento? (Dia... Mês... Ano)
                  </Label>
                  <Textarea
                    id="best_time_procedure"
                    value={formData.best_time_procedure}
                    onChange={(e) => handleInputChange('best_time_procedure', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_awareness">
                    Já viu ou ouviu falar quanto custa, mais ou menos, esse tipo de procedimento?
                  </Label>
                  <Textarea
                    id="price_awareness"
                    value={formData.price_awareness}
                    onChange={(e) => handleInputChange('price_awareness', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decision_factors">
                    Quando pensa em escolher a clínica, o que mais pesa para você sentir confiança na decisão?
                  </Label>
                  <Textarea
                    id="decision_factors"
                    value={formData.decision_factors}
                    onChange={(e) => handleInputChange('decision_factors', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção 5: Informações Adicionais */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="additional_info">Observações adicionais</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) => handleInputChange('additional_info', e.target.value)}
                    placeholder="Adicione qualquer informação relevante..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button at bottom */}
            <div className="flex justify-end pb-4">
              <Button onClick={handleSubmit} disabled={isSaving} size="lg" className="gap-2">
                <Save className="h-5 w-5" />
                {isSaving ? 'Salvando...' : 'Salvar Anamnese'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default NeoTeamAnamnesis;
