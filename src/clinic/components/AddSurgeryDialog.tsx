import React, { useState, useEffect, useCallback } from 'react';
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
import { CalendarIcon, Plus, Lock, AlertCircle, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { useBranches } from '../hooks/useBranches';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { useWeekLockAvailability } from '../hooks/useWeekLockAvailability';
import { PatientAutocomplete } from '@/neohub/components/PatientAutocomplete';
import { useNavigate } from 'react-router-dom';

interface AddSurgeryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWithDate?: boolean;
  /** When true, blocks inline patient creation — requires selecting an existing patient */
  requireExistingPatient?: boolean;
  /** Pre-fill with existing patient data */
  prefilledPatient?: { id: string; name: string };
}

export function AddSurgeryDialog({ 
  open, 
  onOpenChange, 
  defaultWithDate = true,
  requireExistingPatient = false,
  prefilledPatient,
}: AddSurgeryDialogProps) {
  const { createSurgery } = useClinicSurgeries();
  const { branches } = useBranches();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  
  const [surgeryDate, setSurgeryDate] = useState<Date | undefined>(undefined);
  const [surgeryTime, setSurgeryTime] = useState('');
  const [withDate, setWithDate] = useState(defaultWithDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekLockMessage, setWeekLockMessage] = useState<string | null>(null);

  const { isCategoryBlocked, getBlockedCategories, isLoading: locksLoading } = useWeekLockAvailability(
    withDate ? surgeryDate : undefined,
    branch
  );

  const procedures = [
    'CABELO',
    'BARBA',
    'SOBRANCELHA',
    'BODY HAIR BARBA',
    'BODY HAIR PEITO',
  ];

  const toggleProcedure = useCallback((p: string) => {
    setSelectedProcedures(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }, []);

  const procedure = selectedProcedures.join(' + ');

  const categories = [
    { value: 'Categoria A - Hygor', label: 'Categoria A - Hygor' },
    { value: 'Categoria A - Patrick', label: 'Categoria A - Patrick' },
    { value: 'Categoria B', label: 'Categoria B' },
    { value: 'Categoria C', label: 'Categoria C' },
    { value: 'Categoria D', label: 'Categoria D' },
    { value: 'A DEFINIR', label: 'A DEFINIR' },
    { value: 'RETOUCHING', label: 'RETOUCHING' },
  ];

  // Apply prefilled patient when dialog opens
  useEffect(() => {
    if (open && prefilledPatient) {
      setPatientName(prefilledPatient.name);
      setSelectedPatientId(prefilledPatient.id);
    }
  }, [open, prefilledPatient]);

  // Clear category/doctor if they become blocked after date/branch change
  useEffect(() => {
    if (withDate && surgeryDate && branch && category) {
      if (isCategoryBlocked(category)) {
        setCategory('');
        setWeekLockMessage(null);
      }
    }
  }, [surgeryDate, branch]);

  const resetForm = () => {
    setPatientName('');
    setPatientPhone('');
    setSelectedPatientId(null);
    setSelectedProcedures([]);
    setBranch('');
    setCategory('');
    
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

    // In requireExistingPatient mode, must have selected a patient
    if (requireExistingPatient && !selectedPatientId) {
      toast.error('Selecione um paciente já cadastrado. Se o paciente não existe, cadastre-o primeiro no módulo Pacientes.');
      return;
    }

    if (withDate && !surgeryDate) {
      toast.error('Selecione uma data para a cirurgia.');
      return;
    }

    // Final block check before submitting
    if (withDate && surgeryDate && branch && category && isCategoryBlocked(category)) {
      const blocked = getBlockedCategories();
      setWeekLockMessage(`Categoria bloqueada para esta semana/filial. Bloqueados: ${blocked.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setWeekLockMessage(null);

    try {
      let patientId = selectedPatientId;

      if (!patientId) {
        // Only allow inline creation when NOT in requireExistingPatient mode
        const { data: existingPatient } = await supabase
          .from('clinic_patients')
          .select('id')
          .eq('full_name', patientName.trim())
          .maybeSingle();

        patientId = existingPatient?.id || null;

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
      }

      // Create the surgery
      createSurgery.mutate({
        patientId: patientId!,
        branch,
        procedure: procedure.trim(),
        category: category || undefined,
        doctorOnDuty: undefined,
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

  const blockedCategories = getBlockedCategories();
  const hasLockInfo = withDate && surgeryDate && branch && blockedCategories.length > 0;

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
            {requireExistingPatient ? (
              <>
                {prefilledPatient ? (
                  <Input
                    value={patientName}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <PatientAutocomplete
                    value={patientName}
                    onChange={(value) => {
                      setPatientName(value);
                      // Clear selected patient if user types manually
                      setSelectedPatientId(null);
                    }}
                    onSelectPatient={(patient) => {
                      setPatientName(patient.full_name);
                      setSelectedPatientId(patient.id);
                      if (patient.phone) setPatientPhone(patient.phone);
                    }}
                    placeholder="Buscar paciente cadastrado..."
                  />
                )}
                {!selectedPatientId && patientName.length >= 2 && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Selecione um paciente da lista. Caso não encontre,{' '}
                      <button
                        type="button"
                        className="underline font-medium text-primary hover:text-primary/80"
                        onClick={() => {
                          onOpenChange(false);
                          resetForm();
                          navigate('/neoteam/patients');
                        }}
                      >
                        cadastre-o no módulo Pacientes
                      </button>.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nome completo"
              />
            )}
          </div>

          {/* Phone - hide when prefilled or in requireExisting mode with selected patient */}
          {!(requireExistingPatient && selectedPatientId) && !prefilledPatient && (
            <div className="space-y-1.5">
              <Label htmlFor="patientPhone">Telefone</Label>
              <Input
                id="patientPhone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          )}

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

          {/* Lock availability info */}
          {hasLockInfo && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <span className="font-medium">Categorias bloqueadas nesta semana:</span>{' '}
                {blockedCategories.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Category - show lock status */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(val) => { setCategory(val); setWeekLockMessage(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => {
                  let blocked = false;
                  if (withDate && surgeryDate && branch) {
                    blocked = isCategoryBlocked(c.value);
                  }
                  return (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      disabled={blocked}
                      className={cn(blocked && 'opacity-50')}
                    >
                      <span className="flex items-center gap-2">
                        {blocked && <Lock className="h-3 w-3 text-destructive" />}
                        {c.label}
                        {blocked && <span className="text-xs text-destructive">(bloqueada)</span>}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Procedure - Multi-select */}
          <div className="space-y-1.5">
            <Label>Procedimento *</Label>
            <div className="border rounded-md p-3 space-y-2">
              {procedures.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 -mx-2">
                  <Checkbox
                    checked={selectedProcedures.includes(p)}
                    onCheckedChange={() => toggleProcedure(p)}
                  />
                  <span className="text-sm">{p}</span>
                </label>
              ))}
            </div>
            {selectedProcedures.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selecionado: {procedure}
              </p>
            )}
          </div>

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
          <Button onClick={handleSubmit} disabled={isSubmitting || (requireExistingPatient && !selectedPatientId)}>
            {isSubmitting ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
