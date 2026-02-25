import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { useBranches } from '../hooks/useBranches';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useValidateWeekLock } from '@/hooks/useScheduleWeekLocks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface AddSurgeryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWithDate?: boolean;
}

export function AddSurgeryDialog({ open, onOpenChange, defaultWithDate = true }: AddSurgeryDialogProps) {
  const { createSurgery } = useClinicSurgeries();
  const { branches } = useBranches();
  const { validate } = useValidateWeekLock();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [procedure, setProcedure] = useState('');
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  const [doctorOnDuty, setDoctorOnDuty] = useState('');
  const [surgeryDate, setSurgeryDate] = useState<Date | undefined>(undefined);
  const [surgeryTime, setSurgeryTime] = useState('');
  const [withDate, setWithDate] = useState(defaultWithDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekLockMessage, setWeekLockMessage] = useState<string | null>(null);

  const procedures = [
    'CABELO',
    'BARBA',
    'SOBRANCELHA',
    'CABELO + BARBA',
    'CABELO + SOBRANCELHA',
    'SOBRANCELHA + BARBA',
    'SOBRANCELHA + BARBA + CABELO',
    'CABELO + BODY HAIR BARBA',
    'CABELO + BODY HAIR PEITO',
  ];

  const categories = [
    { value: 'CATEGORIA A - MÉDICO SÊNIOR', label: 'Cat A - Médico Sênior' },
    { value: 'CATEGORIA B - MÉDICO DA EQUIPE', label: 'Cat B - Médico da Equipe' },
    { value: 'CATEGORIA C - PACIENTE MODELO VIP', label: 'Cat C - Modelo VIP' },
    { value: 'CATEGORIA D - PACIENTE MODELO NORMAL', label: 'Cat D - Modelo Normal' },
    { value: 'RETOUCHING', label: 'Retouching' },
    { value: 'A DEFINIR', label: 'A Definir' },
    { value: 'RETOQUE DE BARBA', label: 'Retoque de Barba' },
  ];

  const resetForm = () => {
    setPatientName('');
    setPatientPhone('');
    setProcedure('');
    setBranch('');
    setCategory('');
    setDoctorOnDuty('');
    setSurgeryDate(undefined);
    setSurgeryTime('');
    setWithDate(defaultWithDate);
    setWeekLockMessage(null);
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !procedure.trim() || !branch) {
      toast.error('Preencha os campos obrigatórios: Nome, Procedimento e Filial.');
      return;
    }

    if (withDate && !surgeryDate) {
      toast.error('Selecione uma data para a cirurgia.');
      return;
    }

    if (withDate && !doctorOnDuty) {
      toast.error('Selecione o médico responsável.');
      return;
    }

    setIsSubmitting(true);
    setWeekLockMessage(null);

    // Validate week lock if date and branch and doctor are set
    if (withDate && surgeryDate && branch && doctorOnDuty) {
      try {
        // Map form category + doctor to the lock's doctor field
        // Lock categories: "Categoria A - Hygor", "Categoria A - Patrick", "Categoria B", "Categoria C", "Categoria D"
        let lockDoctor = doctorOnDuty.trim();
        if (category) {
          if (category.startsWith('CATEGORIA A')) {
            lockDoctor = `Categoria A - ${doctorOnDuty.trim()}`;
          } else if (category.startsWith('CATEGORIA B')) {
            lockDoctor = 'Categoria B';
          } else if (category.startsWith('CATEGORIA C')) {
            lockDoctor = 'Categoria C';
          } else if (category.startsWith('CATEGORIA D')) {
            lockDoctor = 'Categoria D';
          }
        }

        const lockResult = await validate({
          date: format(surgeryDate, 'yyyy-MM-dd'),
          branch,
          doctor: lockDoctor,
          agenda: 'Agenda Cirúrgica',
        });
        if (!lockResult.permitido) {
          setWeekLockMessage(lockResult.mensagem);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('Week lock validation error:', err);
      }
    }

    try {
      // First, create or find the patient
      const { data: existingPatient } = await supabase
        .from('clinic_patients')
        .select('id')
        .eq('full_name', patientName.trim())
        .maybeSingle();

      let patientId = existingPatient?.id;

      if (!patientId) {
        const { data: newPatient, error: patientError } = await supabase
          .from('clinic_patients')
          .insert({
            full_name: patientName.trim(),
            phone: patientPhone.trim() || null,
          })
          .select('id')
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // Create the surgery
      createSurgery.mutate({
        patientId,
        branch,
        procedure: procedure.trim(),
        category: category || undefined,
        doctorOnDuty: doctorOnDuty.trim() || undefined,
        surgeryDate: withDate && surgeryDate ? format(surgeryDate, 'yyyy-MM-dd') : undefined,
        surgeryTime: withDate && surgeryTime ? surgeryTime : undefined,
      }, {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
        onError: () => {
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      toast.error('Erro ao criar paciente.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Paciente na Agenda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient Name */}
          <div className="space-y-1.5">
            <Label htmlFor="patientName">Nome do Paciente *</Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="patientPhone">Telefone</Label>
            <Input
              id="patientPhone"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Procedure */}
          <div className="space-y-1.5">
            <Label>Procedimento *</Label>
            <Select value={procedure} onValueChange={setProcedure}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-1.5">
            <Label>Filial *</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a filial" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor */}
          <div className="space-y-1.5">
            <Label>Médico Responsável {withDate ? '*' : ''}</Label>
            <Select value={doctorOnDuty} onValueChange={setDoctorOnDuty}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o médico" />
              </SelectTrigger>
              <SelectContent>
                {['Hygor', 'Patrick', 'Márcia'].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date toggle */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant={withDate ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithDate(true)}
              className="text-xs"
            >
              Com data definida
            </Button>
            <Button
              type="button"
              variant={!withDate ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setWithDate(false); setSurgeryDate(undefined); setSurgeryTime(''); }}
              className="text-xs"
            >
              Sem data definida
            </Button>
          </div>

          {/* Date & Time */}
          {withDate && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data da Cirurgia *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !surgeryDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {surgeryDate ? format(surgeryDate, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={surgeryDate}
                      onSelect={setSurgeryDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={surgeryTime}
                  onChange={(e) => setSurgeryTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {weekLockMessage && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{weekLockMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
