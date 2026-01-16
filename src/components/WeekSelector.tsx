import React from 'react';
import { WeekData, formatDate, isWeekAvailable } from '@/data/metricsData';
import { cn } from '@/lib/utils';
import { Calendar, Lock, CheckCircle, Circle } from 'lucide-react';

interface WeekSelectorProps {
  weeks: WeekData[];
  selectedWeek: number | null;
  onSelectWeek: (weekNumber: number) => void;
  isAdmin?: boolean;
}

export function WeekSelector({ weeks, selectedWeek, onSelectWeek, isAdmin = false }: WeekSelectorProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">Semanas de 2026</h3>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
        {weeks.map(week => {
          const available = isAdmin || isWeekAvailable(week);
          const isSelected = selectedWeek === week.weekNumber;
          
          return (
            <button
              key={week.weekNumber}
              onClick={() => available && onSelectWeek(week.weekNumber)}
              disabled={!available}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                isSelected 
                  ? 'bg-accent text-accent-foreground' 
                  : available 
                    ? 'hover:bg-muted' 
                    : 'opacity-50 cursor-not-allowed',
                week.isFilled && !isSelected && 'bg-emerald-50'
              )}
            >
              <div className="flex items-center gap-2">
                {!available && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                {available && week.isFilled && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                {available && !week.isFilled && <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={cn(
                  'font-medium',
                  isSelected ? 'text-accent-foreground' : 'text-foreground'
                )}>
                  {week.weekLabel}
                </span>
              </div>
              <span className={cn(
                'text-xs',
                isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'
              )}>
                {formatDate(week.startDate)} - {formatDate(week.endDate)}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Semana preenchida</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          <span>Semana bloqueada (libera às 00h de segunda)</span>
        </div>
      </div>
    </div>
  );
}
