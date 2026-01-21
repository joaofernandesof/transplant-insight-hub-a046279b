import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, Clock, ArrowLeft, ArrowRight, 
  Check, Loader2, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { useDoctors, useAvailableSlots } from '@/neohub/hooks/useDoctors';

interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  color: string;
}

const appointmentTypes: AppointmentType[] = [
  { id: '1', name: 'Consulta Inicial', description: 'Primeira avaliação e diagnóstico', duration_minutes: 60, color: 'hsl(var(--primary))' },
  { id: '2', name: 'Retorno', description: 'Consulta de acompanhamento', duration_minutes: 30, color: 'hsl(var(--accent))' },
  { id: '3', name: 'Procedimento', description: 'Realização de procedimento', duration_minutes: 120, color: 'hsl(var(--warning))' },
  { id: '4', name: 'Avaliação Pré-Operatória', description: 'Avaliação antes do procedimento', duration_minutes: 45, color: 'hsl(var(--secondary))' },
];

export default function NeoCareNewAppointment() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch doctors
  const { data: doctors = [], isLoading: loadingDoctors } = useDoctors();
  
  // Fetch available slots for selected doctor and date
  const { data: availableSlots = [], isLoading: loadingSlots } = useAvailableSlots(
    selectedDoctor || '', 
    selectedDate || new Date()
  );

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (date > addDays(new Date(), 60)) return true;
    if (date.getDay() === 0) return true;
    return false;
  };

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  const handleSubmit = async () => {
    if (!selectedType || !selectedDate || !selectedTime || !user) return;

    setIsLoading(true);

    // Buscar ou criar portal_user vinculado ao neohub_user
    let { data: portalUser } = await supabase
      .from('portal_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!portalUser) {
      // Criar portal_user se não existir
      const { data: newPortalUser, error: createUserError } = await supabase
        .from('portal_users')
        .insert({
          user_id: user.userId,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          cpf: user.cpf,
        })
        .select('id')
        .single();

      if (createUserError || !newPortalUser) {
        toast.error('Erro ao vincular usuário');
        setIsLoading(false);
        return;
      }
      portalUser = newPortalUser;
    }

    // Buscar ou criar portal_patient
    let { data: patient } = await supabase
      .from('portal_patients')
      .select('id')
      .eq('portal_user_id', portalUser.id)
      .single();

    if (!patient) {
      const { data: newPatient, error: createPatientError } = await supabase
        .from('portal_patients')
        .insert({ portal_user_id: portalUser.id })
        .select('id')
        .single();

      if (createPatientError || !newPatient) {
        toast.error('Erro ao criar registro de paciente');
        setIsLoading(false);
        return;
      }
      patient = newPatient;
    }

    // Criar agendamento
    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const { error } = await supabase
      .from('portal_appointments')
      .insert({
        patient_id: patient.id,
        doctor_id: selectedDoctor || null,
        appointment_type: selectedType.name,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: selectedType.duration_minutes,
        notes: notes.trim() || null,
        status: 'scheduled'
      });

    setIsLoading(false);

    if (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao agendar consulta. Tente novamente.');
      return;
    }

    toast.success('Consulta agendada com sucesso!');
    navigate('/neocare/appointments');
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/neocare')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Agendamento</h1>
          <p className="text-muted-foreground">Escolha o tipo, data e horário da sua consulta</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <React.Fragment key={s}>
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors",
                step >= s 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 5 && (
              <div className={cn(
                "w-8 h-1 mx-1",
                step > s ? "bg-primary" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Consulta</CardTitle>
            <CardDescription>Selecione o tipo de atendimento desejado</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {appointmentTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedType?.id === type.id ? "default" : "outline"}
                className={cn(
                  "h-auto p-4 justify-start text-left",
                  selectedType?.id === type.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedType(type)}
              >
                <div 
                  className="w-4 h-4 rounded-full mr-4 flex-shrink-0"
                  style={{ backgroundColor: type.color }}
                />
                <div className="flex-1">
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm opacity-80">{type.description}</p>
                  <p className="text-xs opacity-60 mt-1">
                    Duração: {type.duration_minutes} minutos
                  </p>
                </div>
              </Button>
            ))}

            <div className="flex justify-end mt-4">
              <Button onClick={() => setStep(2)} disabled={!selectedType}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Doctor */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Escolha o Profissional
            </CardTitle>
            <CardDescription>Selecione o médico para sua consulta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDoctors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum profissional disponível
              </p>
            ) : (
              doctors.map((doctor) => (
                <Button
                  key={doctor.id}
                  variant={selectedDoctor === doctor.id ? "default" : "outline"}
                  className={cn(
                    "w-full h-auto p-4 justify-start text-left",
                    selectedDoctor === doctor.id && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    setSelectedDoctor(doctor.id);
                    setSelectedTime(null);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doctor.full_name}</p>
                      <p className="text-sm opacity-80">{doctor.specialty}</p>
                      {doctor.crm && (
                        <p className="text-xs opacity-60">CRM: {doctor.crm}/{doctor.crm_state}</p>
                      )}
                    </div>
                  </div>
                </Button>
              ))
            )}
          </CardContent>
          <CardContent className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setStep(3)} disabled={!selectedDoctor}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Date */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Escolha a Data
            </CardTitle>
            <CardDescription>Selecione uma data disponível</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              disabled={isDateDisabled}
              locale={ptBR}
              className="rounded-md border pointer-events-auto"
            />
          </CardContent>
          <CardContent className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setStep(4)} disabled={!selectedDate}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Select Time */}
      {step === 4 && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Escolha o Horário
            </CardTitle>
            <CardDescription>
              Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              {selectedDoctorData && ` com ${selectedDoctorData.full_name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum horário disponível para esta data
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    className="h-12"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
          <CardContent className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setStep(5)} disabled={!selectedTime}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && selectedType && selectedDate && selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Confirmar Agendamento
            </CardTitle>
            <CardDescription>Revise os dados e confirme sua consulta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{selectedType.name}</span>
              </div>
              {selectedDoctorData && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium">{selectedDoctorData.full_name}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">
                  {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{selectedType.duration_minutes} minutos</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Alguma informação adicional para a clínica..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardContent className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Agendamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
