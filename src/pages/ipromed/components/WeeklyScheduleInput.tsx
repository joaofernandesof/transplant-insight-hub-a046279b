/**
 * WeeklyScheduleInput - Componente para seleção de horários por dia da semana
 * Sábado e Domingo vêm desabilitados por padrão, mas podem ser habilitados
 */

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export interface WeeklySchedule {
  segunda: DaySchedule;
  terca: DaySchedule;
  quarta: DaySchedule;
  quinta: DaySchedule;
  sexta: DaySchedule;
  sabado: DaySchedule;
  domingo: DaySchedule;
}

const DAYS_CONFIG = [
  { key: "segunda", label: "Segunda-feira", locked: false },
  { key: "terca", label: "Terça-feira", locked: false },
  { key: "quarta", label: "Quarta-feira", locked: false },
  { key: "quinta", label: "Quinta-feira", locked: false },
  { key: "sexta", label: "Sexta-feira", locked: false },
  { key: "sabado", label: "Sábado", locked: true },
  { key: "domingo", label: "Domingo", locked: true },
] as const;

export const defaultWeeklySchedule: WeeklySchedule = {
  segunda: { enabled: true, start: "08:00", end: "18:00" },
  terca: { enabled: true, start: "08:00", end: "18:00" },
  quarta: { enabled: true, start: "08:00", end: "18:00" },
  quinta: { enabled: true, start: "08:00", end: "18:00" },
  sexta: { enabled: true, start: "08:00", end: "18:00" },
  sabado: { enabled: false, start: "", end: "" },
  domingo: { enabled: false, start: "", end: "" },
};

interface WeeklyScheduleInputProps {
  value?: WeeklySchedule;
  onChange?: (value: WeeklySchedule) => void;
  className?: string;
}

export function WeeklyScheduleInput({ value, onChange, className }: WeeklyScheduleInputProps) {
  const schedule = value || defaultWeeklySchedule;

  const handleDayChange = (dayKey: keyof WeeklySchedule, field: keyof DaySchedule, newValue: string | boolean) => {
    if (!onChange) return;
    
    const updated = {
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        [field]: newValue,
      },
    };
    
    onChange(updated);
  };

  const handleToggleDay = (dayKey: keyof WeeklySchedule, enabled: boolean) => {
    if (!onChange) return;
    
    const updated = {
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        enabled,
        // Se desabilitar, limpa os horários
        start: enabled ? (schedule[dayKey].start || "08:00") : "",
        end: enabled ? (schedule[dayKey].end || "18:00") : "",
      },
    };
    
    onChange(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {DAYS_CONFIG.map((day) => {
        const daySchedule = schedule[day.key as keyof WeeklySchedule];
        const isEnabled = daySchedule.enabled;
        const isWeekend = day.locked;
        
        return (
          <div
            key={day.key}
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
              isEnabled 
                ? "bg-background border-border" 
                : "bg-muted/30 border-muted",
              isWeekend && !isEnabled && "opacity-60"
            )}
          >
            {/* Toggle para habilitar/desabilitar */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggleDay(day.key as keyof WeeklySchedule, checked)}
                className="data-[state=checked]:bg-primary"
              />
              <Label className={cn(
                "text-sm font-medium cursor-pointer",
                !isEnabled && "text-muted-foreground"
              )}>
                {day.label}
              </Label>
            </div>

            {/* Campos de horário */}
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={daySchedule.start}
                onChange={(e) => handleDayChange(day.key as keyof WeeklySchedule, "start", e.target.value)}
                disabled={!isEnabled}
                className={cn(
                  "w-[100px] h-8 text-sm",
                  !isEnabled && "bg-muted text-muted-foreground"
                )}
              />
              <span className={cn(
                "text-sm",
                !isEnabled ? "text-muted-foreground" : "text-foreground"
              )}>
                até
              </span>
              <Input
                type="time"
                value={daySchedule.end}
                onChange={(e) => handleDayChange(day.key as keyof WeeklySchedule, "end", e.target.value)}
                disabled={!isEnabled}
                className={cn(
                  "w-[100px] h-8 text-sm",
                  !isEnabled && "bg-muted text-muted-foreground"
                )}
              />
            </div>

            {/* Indicador de fim de semana */}
            {isWeekend && (
              <span className="text-xs text-muted-foreground italic">
                {isEnabled ? "Ativo" : "Opcional"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Converte WeeklySchedule para string legível
 */
export function formatWeeklySchedule(schedule: WeeklySchedule): string {
  const enabledDays = DAYS_CONFIG
    .filter(day => schedule[day.key as keyof WeeklySchedule].enabled)
    .map(day => {
      const s = schedule[day.key as keyof WeeklySchedule];
      return `${day.label.slice(0, 3)}: ${s.start}-${s.end}`;
    });
  
  return enabledDays.join(", ");
}
