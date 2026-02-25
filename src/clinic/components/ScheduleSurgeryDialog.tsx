import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { useValidateWeekLock } from '@/hooks/useScheduleWeekLocks';
import type { NoDatePatient } from '../hooks/useNoDatePatients';

interface ScheduleSurgeryDialogProps {
  patient: NoDatePatient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${min}`;
});

export function ScheduleSurgeryDialog({ patient, open, onOpenChange }: ScheduleSurgeryDialogProps) {
  const { createSurgery } = useClinicSurgeries();
  const { validate } = useValidateWeekLock();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [doctor, setDoctor] = useState('');
  const [weekLockMessage, setWeekLockMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!patient || !date) return;

    if (!doctor) {
      return;
    }

    setWeekLockMessage(null);

    // Validate week lock
    {
      try {
        const lockResult = await validate({
          date: format(date, 'yyyy-MM-dd'),
          branch: patient.branch,
          doctor: doctor.trim(),
          agenda: 'Agenda Cirúrgica',
        });
        if (!lockResult.permitido) {
          setWeekLockMessage(lockResult.mensagem);
          return;
        }
      } catch (err) {
        console.error('Week lock validation error:', err);
      }
    }

    createSurgery.mutate({
      patientId: patient.patientId,
      saleId: patient.saleId,
      branch: patient.branch,
      procedure: patient.procedure,
      category: patient.category || undefined,
      surgeryDate: format(date, 'yyyy-MM-dd'),
      surgeryTime: time || undefined,
      doctorOnDuty: doctor || undefined,
      scheduleStatus: 'agendado',
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setDate(undefined);
        setTime('');
        setDoctor('');
        setWeekLockMessage(null);
      },
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Agendar Cirurgia</DialogTitle>
          <DialogDescription>Agende a cirurgia para {patient.patientName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient info (read-only) */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="font-medium">{patient.patientName}</p>
            <p className="text-sm text-muted-foreground">{patient.procedure}</p>
            <div className="flex gap-2 flex-wrap">
              {patient.category && <Badge variant="outline">{patient.category}</Badge>}
              <Badge variant="secondary">{patient.branch}</Badge>
              <Badge variant="outline">{formatCurrency(patient.vgv)}</Badge>
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Data da cirurgia *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label>Horário</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(slot => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor */}
          <div className="space-y-2">
            <Label>Médico plantonista *</Label>
            <Select value={doctor} onValueChange={setDoctor}>
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

          {weekLockMessage && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{weekLockMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || !doctor || createSurgery.isPending}
          >
            {createSurgery.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
