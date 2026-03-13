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
import { CalendarIcon, Plus, Lock, AlertCircle, Check, Scissors, Star, XCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { useBranches } from '../hooks/useBranches';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkDuplicateSurgery } from '../hooks/useDuplicateCheck';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import { useWeekLockAvailability } from '../hooks/useWeekLockAvailability';
import { PatientAutocomplete } from '@/neohub/components/PatientAutocomplete';
import { useNavigate } from 'react-router-dom';
import { ProcedureCheckboxField } from './ProcedureCheckboxField';

interface AddSurgeryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWithDate?: boolean;
  /** When true, blocks inline patient creation — requires selecting an existing patient */
  requireExistingPatient?: boolean;
  /** Pre-fill with existing patient data */
  prefilledPatient?: { id: string; name: string };
  /** Pre-fill date when adding from empty slot */
  defaultDate?: string;
}

export function AddSurgeryDialog({ 
  open, 
  onOpenChange, 
  defaultWithDate = true,
  requireExistingPatient = false,
  prefilledPatient,
  defaultDate,
}: AddSurgeryDialogProps) {
  const { createSurgery } = useClinicSurgeries();
  const { branches } = useBranches();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientGrade, setPatientGrade] = useState<number | null>(null);
  const [patientTrichotomy, setPatientTrichotomy] = useState<string | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  
  const [surgeryDate, setSurgeryDate] = useState<Date | undefined>(defaultDate ? new Date(defaultDate + 'T12:00:00') : undefined);
  const [surgeryTime, setSurgeryTime] = useState('');
  const [withDate, setWithDate] = useState(defaultWithDate);

  // Sync defaultDate when dialog opens with a new date
  useEffect(() => {
    if (open && defaultDate) {
      setSurgeryDate(new Date(defaultDate + 'T12:00:00'));
      setWithDate(true);
    }
  }, [open, defaultDate]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekLockMessage, setWeekLockMessage] = useState<string | null>(null);

  const { isCategoryBlocked, getBlockedCategories, isLoading: locksLoading } = useWeekLockAvailability(
    withDate ? surgeryDate : undefined,
    branch
  );

  const procedure = selectedProcedures.join(' + ');

  const categories = [
    { value: 'CATEGORIA A - DR HYGOR', label: 'Categoria A - Dr Hygor' },
    { value: 'CATEGORIA A - DR PATRICK', label: 'Categoria A - Dr Patrick' },
    { value: 'CATEGORIA B - MÉDICO DA EQUIPE', label: 'Categoria B - Médico da Equipe' },
    { value: 'CATEGORIA C - PACIENTE MODELO VIP', label: 'Categoria C - Paciente Modelo VIP' },
    { value: 'CATEGORIA D - PACIENTE MODELO NORMAL', label: 'Categoria D - Paciente Modelo Normal' },
    { value: 'A DEFINIR', label: 'A Definir' },
    { value: 'RETOUCHING', label: 'Retouching' },
  ];

  // Apply prefilled patient when dialog opens
  useEffect(() => {
    if (open && prefilledPatient) {
      setPatientName(prefilledPatient.name);
      setSelectedPatientId(prefilledPatient.id);
      // Fetch patient grade/trichotomy
      supabase
        .from('clinic_patients')
        .select('grade, trichotomy_datetime')
        .eq('id', prefilledPatient.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPatientGrade((data as any).grade ?? null);
            setPatientTrichotomy((data as any).trichotomy_datetime ?? null);
          }
        });
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
    setPatientGrade(null);
    setPatientTrichotomy(null);
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

      // Duplicate check
      const duplicateMsg = await checkDuplicateSurgery({
        patientId: patientId!,
        procedure: procedure.trim(),
        category: category || undefined,
      });
      if (duplicateMsg) {
        toast.error(duplicateMsg);
        setIsSubmitting(false);
        return;
      }

      // Create the surgery
      createSurgery.mutate({
        patientId: patientId!,
        patientName: patientName.trim(),
        branch,
        procedure: procedure.trim(),
        category: category || undefined,
        grade: patientGrade ?? undefined,
        trichotomyDatetime: patientTrichotomy ?? undefined,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Paciente na Agenda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto">
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
                    onSelectPatient={async (patient) => {
                      setPatientName(patient.full_name);
                      setSelectedPatientId(patient.id);
                      if (patient.phone) setPatientPhone(patient.phone);

                      // Fetch patient grade/trichotomy
                      supabase
                        .from('clinic_patients')
                        .select('grade, trichotomy_datetime')
                        .eq('id', patient.id)
                        .maybeSingle()
                        .then(({ data }) => {
                          if (data) {
                            setPatientGrade((data as any).grade ?? null);
                            setPatientTrichotomy((data as any).trichotomy_datetime ?? null);
                          }
                        });

                      // Auto-fill from latest surgery of this patient (by ID or name fallback)
                      try {
                        // Try by patient_id first
                        let { data: latestSurgery } = await supabase
                          .from('clinic_surgeries')
                          .select('procedure, category, branch')
                          .eq('patient_id', patient.id)
                          .order('created_at', { ascending: false })
                          .limit(1)
                          .maybeSingle();

                        // Fallback: search by patient_name (legacy records without patient_id)
                        if (!latestSurgery) {
                          const { data: byName } = await supabase
                            .from('clinic_surgeries')
                            .select('procedure, category, branch')
                            .ilike('patient_name', `%${patient.full_name}%`)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                          latestSurgery = byName;
                        }

                        if (latestSurgery) {
                          if (latestSurgery.procedure) {
                            const procs = latestSurgery.procedure.split(' + ').map((p: string) => p.trim().toUpperCase()).filter(Boolean);
                            setSelectedProcedures(procs);
                          }
                          if (latestSurgery.category) {
                            // Normalize category to match form options (case-insensitive)
                            const dbCat = latestSurgery.category.toLowerCase();
                            const matchedCat = categories.find(c => c.value.toLowerCase() === dbCat);
                            setCategory(matchedCat ? matchedCat.value : latestSurgery.category);
                          }
                          if (latestSurgery.branch) setBranch(latestSurgery.branch);
                        }
                      } catch (err) {
                        console.error('Error fetching patient surgery data:', err);
                      }
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
          <ProcedureCheckboxField
            value={procedure}
            onChange={(val) => setSelectedProcedures(val ? val.split(' + ') : [])}
          />

          {/* Trichotomy & Grade */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5" />
                Tricotomia
              </Label>
              {patientTrichotomy === 'NÃO TEM MARCAÇÃO' ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-500/10">
                    SEM TRICOTOMIA
                  </Badge>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPatientTrichotomy(null)}>
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    type="datetime-local"
                    value={patientTrichotomy || ''}
                    onChange={(e) => setPatientTrichotomy(e.target.value || null)}
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit h-7 text-xs text-amber-600 border-amber-600/30 hover:bg-amber-500/10"
                    onClick={() => setPatientTrichotomy('NÃO TEM MARCAÇÃO')}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Sem tricotomia
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Grau do Paciente
              </Label>
              <Select
                value={patientGrade?.toString() || ''}
                onValueChange={(val) => setPatientGrade(val ? parseInt(val) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grau" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((g) => (
                    <SelectItem key={g} value={g.toString()}>Grau {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
