/**
 * Etapa 4 Simplificada: Horários de Funcionamento
 * Interface visual simples para definir horários
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeekSchedule, DaySchedule, DAY_NAMES } from '../../../types';

interface StepScheduleSimpleProps {
  schedule: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

type DayKey = keyof WeekSchedule;

export function StepScheduleSimple({ schedule, onChange }: StepScheduleSimpleProps) {
  const days: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shortDayNames: Record<DayKey, string> = {
    monday: 'Seg',
    tuesday: 'Ter',
    wednesday: 'Qua',
    thursday: 'Qui',
    friday: 'Sex',
    saturday: 'Sáb',
    sunday: 'Dom',
  };

  const toggleDay = (day: DayKey) => {
    const current = schedule[day];
    onChange({
      ...schedule,
      [day]: {
        ...current,
        enabled: !current.enabled,
        // Se estiver habilitando e não tem intervalos, adiciona um padrão
        intervals: !current.enabled && current.intervals.length === 0
          ? [{ start: '09:00', end: '18:00' }]
          : current.intervals,
      },
    });
  };

  const updateInterval = (day: DayKey, index: number, field: 'start' | 'end', value: string) => {
    const newSchedule = { ...schedule };
    newSchedule[day] = {
      ...newSchedule[day],
      intervals: newSchedule[day].intervals.map((interval, i) =>
        i === index ? { ...interval, [field]: value } : interval
      ),
    };
    onChange(newSchedule);
  };

  const addInterval = (day: DayKey) => {
    const current = schedule[day];
    onChange({
      ...schedule,
      [day]: {
        ...current,
        intervals: [...current.intervals, { start: '14:00', end: '18:00' }],
      },
    });
  };

  const removeInterval = (day: DayKey, index: number) => {
    const current = schedule[day];
    onChange({
      ...schedule,
      [day]: {
        ...current,
        intervals: current.intervals.filter((_, i) => i !== index),
      },
    });
  };

  const copyToWeekdays = () => {
    const mondaySchedule = schedule.monday;
    const weekdays: DayKey[] = ['tuesday', 'wednesday', 'thursday', 'friday'];
    
    const newSchedule = { ...schedule };
    weekdays.forEach(day => {
      newSchedule[day] = { ...mondaySchedule };
    });
    onChange(newSchedule);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Quando você atende? ⏰
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Configure os horários de funcionamento do seu negócio
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Quick actions */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToWeekdays}
            className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copiar Segunda para dias úteis
          </Button>
        </div>

        {days.map((day) => {
          const daySchedule = schedule[day];
          return (
            <Card 
              key={day}
              className={cn(
                "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] transition-all",
                daySchedule.enabled && "border-[hsl(var(--avivar-primary)/0.3)]"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium w-10",
                        daySchedule.enabled 
                          ? "text-[hsl(var(--avivar-foreground))]" 
                          : "text-[hsl(var(--avivar-muted-foreground))]"
                      )}>
                        {shortDayNames[day]}
                      </span>
                      <span className="text-sm text-[hsl(var(--avivar-muted-foreground))] hidden sm:inline">
                        {DAY_NAMES[day]}
                      </span>
                    </div>
                  </div>

                  {daySchedule.enabled && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                    </div>
                  )}
                </div>

                {daySchedule.enabled && (
                  <div className="mt-4 space-y-2 pl-12">
                    {daySchedule.intervals.map((interval, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={interval.start}
                          onChange={(e) => updateInterval(day, index, 'start', e.target.value)}
                          className="w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                        />
                        <span className="text-[hsl(var(--avivar-muted-foreground))]">às</span>
                        <Input
                          type="time"
                          value={interval.end}
                          onChange={(e) => updateInterval(day, index, 'end', e.target.value)}
                          className="w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                        />
                        {daySchedule.intervals.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInterval(day, index)}
                            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {daySchedule.intervals.length < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addInterval(day)}
                        className="text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar intervalo
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
