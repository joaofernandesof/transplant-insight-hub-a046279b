/**
 * Etapa 10: Horários de Atendimento
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WeekSchedule, DaySchedule, TimeInterval, DAY_NAMES } from '../../types';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, Trash2, Copy, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface StepScheduleProps {
  schedule: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

type DayKey = keyof WeekSchedule;

// Converte horário "HH:MM" para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Verifica se dois intervalos se sobrepõem
const intervalsOverlap = (a: TimeInterval, b: TimeInterval): boolean => {
  const aStart = timeToMinutes(a.start);
  const aEnd = timeToMinutes(a.end);
  const bStart = timeToMinutes(b.start);
  const bEnd = timeToMinutes(b.end);
  
  // Sobreposição ocorre quando um começa antes do outro terminar
  return aStart < bEnd && bStart < aEnd;
};

// Verifica se há sobreposição em um array de intervalos
const hasOverlap = (intervals: TimeInterval[]): { hasOverlap: boolean; overlappingIndices: number[] } => {
  const overlapping: number[] = [];
  
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      if (intervalsOverlap(intervals[i], intervals[j])) {
        if (!overlapping.includes(i)) overlapping.push(i);
        if (!overlapping.includes(j)) overlapping.push(j);
      }
    }
  }
  
  return { hasOverlap: overlapping.length > 0, overlappingIndices: overlapping };
};

// Encontra o próximo horário disponível para um novo intervalo
const findNextAvailableSlot = (intervals: TimeInterval[]): TimeInterval => {
  if (intervals.length === 0) {
    return { start: '08:00', end: '18:00' };
  }
  
  // Ordena por horário de término
  const sorted = [...intervals].sort((a, b) => timeToMinutes(a.end) - timeToMinutes(b.end));
  const lastEnd = sorted[sorted.length - 1].end;
  const lastEndMinutes = timeToMinutes(lastEnd);
  
  // Sugere começar após o último término
  const newStartMinutes = lastEndMinutes;
  const newEndMinutes = Math.min(newStartMinutes + 240, 23 * 60); // 4 horas ou até 23:00
  
  if (newStartMinutes >= 23 * 60) {
    // Se não há espaço depois, tenta antes do primeiro
    const firstStart = Math.min(...intervals.map(i => timeToMinutes(i.start)));
    if (firstStart > 6 * 60) { // Antes das 06:00
      return { start: '06:00', end: formatTime(firstStart) };
    }
    return { start: '14:00', end: '18:00' }; // Fallback
  }
  
  return { 
    start: formatTime(newStartMinutes), 
    end: formatTime(newEndMinutes) 
  };
};

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function StepSchedule({ schedule, onChange }: StepScheduleProps) {
  const [openDays, setOpenDays] = React.useState<DayKey[]>(['monday']);
  const [overlapWarnings, setOverlapWarnings] = React.useState<Record<DayKey, number[]>>({} as Record<DayKey, number[]>);

  // Atualiza warnings de sobreposição quando schedule muda
  React.useEffect(() => {
    const warnings: Record<DayKey, number[]> = {} as Record<DayKey, number[]>;
    (Object.keys(schedule) as DayKey[]).forEach(day => {
      const { overlappingIndices } = hasOverlap(schedule[day].intervals);
      if (overlappingIndices.length > 0) {
        warnings[day] = overlappingIndices;
      }
    });
    setOverlapWarnings(warnings);
  }, [schedule]);

  const toggleDay = (day: DayKey) => {
    const updated = { ...schedule };
    updated[day] = {
      ...updated[day],
      enabled: !updated[day].enabled,
      intervals: updated[day].enabled ? [] : [{ start: '08:00', end: '18:00' }]
    };
    onChange(updated);
  };

  const addInterval = (day: DayKey) => {
    const currentIntervals = schedule[day].intervals;
    const newInterval = findNextAvailableSlot(currentIntervals);
    
    // Verifica se o novo intervalo causaria sobreposição
    const testIntervals = [...currentIntervals, newInterval];
    const { hasOverlap: wouldOverlap } = hasOverlap(testIntervals);
    
    if (wouldOverlap) {
      toast.warning('Ajuste os horários para evitar sobreposição', {
        description: 'Os intervalos não podem se sobrepor'
      });
    }
    
    const updated = { ...schedule };
    updated[day].intervals.push(newInterval);
    onChange(updated);
  };

  const removeInterval = (day: DayKey, index: number) => {
    const updated = { ...schedule };
    updated[day].intervals = updated[day].intervals.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateInterval = (day: DayKey, index: number, field: 'start' | 'end', value: string) => {
    const updated = { ...schedule };
    const newInterval = { ...updated[day].intervals[index], [field]: value };
    
    // Cria array temporário para verificar sobreposição
    const testIntervals = updated[day].intervals.map((interval, i) => 
      i === index ? newInterval : interval
    );
    
    const { hasOverlap: wouldOverlap } = hasOverlap(testIntervals);
    
    if (wouldOverlap) {
      toast.error('Horários sobrepostos!', {
        description: 'Ajuste para que os intervalos não se sobreponham'
      });
    }
    
    updated[day].intervals[index][field] = value;
    onChange(updated);
  };

  const copyMondayToAll = () => {
    const monday = schedule.monday;
    const updated = { ...schedule };
    (Object.keys(updated) as DayKey[]).forEach(day => {
      if (day !== 'monday' && day !== 'saturday' && day !== 'sunday') {
        updated[day] = { ...monday, intervals: monday.intervals.map(i => ({ ...i })) };
      }
    });
    onChange(updated);
  };

  const toggleOpen = (day: DayKey) => {
    setOpenDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const activeDays = (Object.keys(schedule) as DayKey[]).filter(d => schedule[d].enabled).length;
  const hasAnyOverlap = Object.keys(overlapWarnings).length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Quando você atende?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Configure horários disponíveis. A IA só oferecerá estes horários
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-3">
        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copyMondayToAll}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Segunda para Toda Semana
          </Button>
        </div>

        {/* Overlap warning */}
        {hasAnyOverlap && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Existem horários sobrepostos. Corrija para continuar.
            </p>
          </div>
        )}

        {/* Days */}
        {(Object.keys(schedule) as DayKey[]).map((day) => {
          const dayHasOverlap = overlapWarnings[day]?.length > 0;
          
          return (
            <Collapsible 
              key={day} 
              open={openDays.includes(day) && schedule[day].enabled}
              onOpenChange={() => schedule[day].enabled && toggleOpen(day)}
            >
              <Card className={cn(
                "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] transition-all",
                schedule[day].enabled && !dayHasOverlap && "border-[hsl(var(--avivar-primary)/0.3)]",
                dayHasOverlap && "border-red-500/50 bg-red-500/5"
              )}>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={schedule[day].enabled}
                          onCheckedChange={() => toggleDay(day)}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-[hsl(var(--avivar-primary))]"
                        />
                        <span className={cn(
                          "font-medium",
                          schedule[day].enabled 
                            ? "text-[hsl(var(--avivar-foreground))]" 
                            : "text-[hsl(var(--avivar-muted-foreground))]"
                        )}>
                          {DAY_NAMES[day]}
                        </span>
                        {dayHasOverlap && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Sobreposição
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {schedule[day].enabled && schedule[day].intervals.length > 0 && (
                          <Badge variant="secondary" className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]">
                            {schedule[day].intervals.length} intervalo{schedule[day].intervals.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {schedule[day].enabled && (
                          <ChevronDown className={cn(
                            "h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] transition-transform",
                            openDays.includes(day) && "rotate-180"
                          )} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {schedule[day].intervals.map((interval, index) => {
                      const isOverlapping = overlapWarnings[day]?.includes(index);
                      
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg transition-colors",
                            isOverlapping && "bg-red-500/10 border border-red-500/30"
                          )}
                        >
                          <Clock className={cn(
                            "h-4 w-4",
                            isOverlapping ? "text-red-500" : "text-[hsl(var(--avivar-muted-foreground))]"
                          )} />
                          <Input
                            type="time"
                            value={interval.start}
                            onChange={(e) => updateInterval(day, index, 'start', e.target.value)}
                            className={cn(
                              "w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]",
                              isOverlapping && "border-red-500"
                            )}
                          />
                          <span className="text-[hsl(var(--avivar-muted-foreground))]">até</span>
                          <Input
                            type="time"
                            value={interval.end}
                            onChange={(e) => updateInterval(day, index, 'end', e.target.value)}
                            className={cn(
                              "w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]",
                              isOverlapping && "border-red-500"
                            )}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInterval(day, index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addInterval(day)}
                      className="text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-accent))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Intervalo
                    </Button>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Counter */}
        <div className="flex items-center justify-center py-2">
          <Badge 
            variant={activeDays > 0 && !hasAnyOverlap ? "default" : "secondary"}
            className={cn(
              activeDays > 0 && !hasAnyOverlap
                ? "bg-[hsl(var(--avivar-primary))] text-white" 
                : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
            )}
          >
            <Clock className="h-3 w-3 mr-1" />
            {activeDays} dia{activeDays !== 1 ? 's' : ''} configurado{activeDays !== 1 ? 's' : ''}
          </Badge>
        </div>

        {activeDays === 0 && (
          <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Configure pelo menos 1 dia de atendimento
          </p>
        )}
      </div>
    </div>
  );
}
