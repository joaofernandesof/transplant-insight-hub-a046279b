import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
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
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [doctor, setDoctor] = useState('');

  const handleSubmit = () => {
    if (!patient || !date) return;

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
            <Label>Médico plantonista</Label>
            <Input
              placeholder="Nome do médico (opcional)"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || createSurgery.isPending}
          >
            {createSurgery.isPending ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
