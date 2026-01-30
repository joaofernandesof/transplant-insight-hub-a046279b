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
import { ChevronDown, Plus, Trash2, Copy, Clock } from 'lucide-react';

interface StepScheduleProps {
  schedule: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

type DayKey = keyof WeekSchedule;

export function StepSchedule({ schedule, onChange }: StepScheduleProps) {
  const [openDays, setOpenDays] = React.useState<DayKey[]>(['monday']);

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
    const updated = { ...schedule };
    updated[day].intervals.push({ start: '14:00', end: '18:00' });
    onChange(updated);
  };

  const removeInterval = (day: DayKey, index: number) => {
    const updated = { ...schedule };
    updated[day].intervals = updated[day].intervals.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateInterval = (day: DayKey, index: number, field: 'start' | 'end', value: string) => {
    const updated = { ...schedule };
    updated[day].intervals[index][field] = value;
    onChange(updated);
  };

  const copyMondayToAll = () => {
    const monday = schedule.monday;
    const updated = { ...schedule };
    (Object.keys(updated) as DayKey[]).forEach(day => {
      if (day !== 'monday' && day !== 'saturday' && day !== 'sunday') {
        updated[day] = { ...monday };
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

        {/* Days */}
        {(Object.keys(schedule) as DayKey[]).map((day) => (
          <Collapsible 
            key={day} 
            open={openDays.includes(day) && schedule[day].enabled}
            onOpenChange={() => schedule[day].enabled && toggleOpen(day)}
          >
            <Card className={cn(
              "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] transition-all",
              schedule[day].enabled && "border-[hsl(var(--avivar-primary)/0.3)]"
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
                  {schedule[day].intervals.map((interval, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      <Input
                        type="time"
                        value={interval.start}
                        onChange={(e) => updateInterval(day, index, 'start', e.target.value)}
                        className="w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                      />
                      <span className="text-[hsl(var(--avivar-muted-foreground))]">até</span>
                      <Input
                        type="time"
                        value={interval.end}
                        onChange={(e) => updateInterval(day, index, 'end', e.target.value)}
                        className="w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
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
                  ))}
                  
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
        ))}

        {/* Counter */}
        <div className="flex items-center justify-center py-2">
          <Badge 
            variant={activeDays > 0 ? "default" : "secondary"}
            className={cn(
              activeDays > 0 
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
