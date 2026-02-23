import React, { useState } from 'react';
import { ClinicSurgery } from '../hooks/useClinicSurgeries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ScheduleSurgeryDialogProps {
  surgery: ClinicSurgery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (id: string, date: string, time: string, doctor?: string) => void;
  isLoading?: boolean;
}

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${min}`;
});

export function ScheduleSurgeryDialog({ surgery, open, onOpenChange, onSchedule, isLoading }: ScheduleSurgeryDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('');
  const [doctor, setDoctor] = useState('');

  const handleSubmit = () => {
    if (!surgery || !date || !time) return;
    onSchedule(surgery.id, format(date, 'yyyy-MM-dd'), time, doctor || undefined);
    setDate(undefined);
    setTime('');
    setDoctor('');
  };

  if (!surgery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Cirurgia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient info (read-only) */}
          <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
            <p className="font-medium">{surgery.patientName}</p>
            <p className="text-sm text-muted-foreground">{surgery.procedure}</p>
            <div className="flex gap-2 mt-1">
              {surgery.category && <Badge variant="outline">Cat. {surgery.category}</Badge>}
              {surgery.grade && <Badge variant="secondary">Grau {surgery.grade}</Badge>}
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Data da Cirurgia *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
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
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time select */}
          <div className="space-y-2">
            <Label>Horário *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor */}
          <div className="space-y-2">
            <Label>Médico Plantonista</Label>
            <Input
              value={doctor}
              onChange={e => setDoctor(e.target.value)}
              placeholder="Nome do médico (opcional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!date || !time || isLoading}>
            Confirmar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
