import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSurgeryAgendaAvailability } from '../hooks/useSurgeryAgendaAvailability';
import { useBranches } from '../hooks/useBranches';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function AgendaAvailabilityView() {
  const { branches } = useBranches({ showAll: true });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { getDayAvailability, isLoading } = useSurgeryAgendaAvailability(selectedBranch, currentMonth);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOffset = useMemo(() => {
    const dow = getDay(startOfMonth(currentMonth));
    return dow === 0 ? 6 : dow - 1;
  }, [currentMonth]);

  const getStatusStyles = (dateStr: string) => {
    const avail = getDayAvailability(dateStr);
    if (avail.status === 'blocked') return 'bg-destructive/15 border-destructive/30 text-destructive';
    if (avail.status === 'full') return 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400';
    if (avail.status === 'available') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
    return 'bg-muted/30 border-border/50 text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          Disponibilidade da Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Branch selector */}
        <div className="flex items-center gap-2">
          <Label className="text-xs shrink-0">Filial:</Label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full max-w-[200px] h-7 text-xs">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBranch && (
          <>
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Grid */}
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground py-0.5">{d}</div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const avail = getDayAvailability(dateStr);
                  const today = isToday(day);

                  return (
                    <Tooltip key={dateStr}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'relative rounded border text-center py-1 min-h-[36px] flex flex-col items-center justify-center cursor-default',
                            getStatusStyles(dateStr),
                            today && 'ring-2 ring-primary/50'
                          )}
                        >
                          <span className="text-[10px] font-medium">{format(day, 'd')}</span>
                          {avail.status === 'blocked' && <Lock className="h-2.5 w-2.5" />}
                          {avail.status === 'available' && (
                            <span className="text-[8px] font-bold">{avail.remainingSlots}</span>
                          )}
                          {avail.status === 'full' && (
                            <span className="text-[8px] font-bold">0</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {avail.status === 'blocked' && (
                          <span>🔒 Bloqueado{avail.blockedReason ? `: ${avail.blockedReason}` : ''}</span>
                        )}
                        {avail.status === 'full' && (
                          <span>⚠️ Lotado — {avail.scheduledCount}/{avail.maxSlots} vagas</span>
                        )}
                        {avail.status === 'available' && (
                          <span>✅ {avail.remainingSlots} vaga{avail.remainingSlots !== 1 ? 's' : ''} restante{avail.remainingSlots !== 1 ? 's' : ''} ({avail.scheduledCount}/{avail.maxSlots})</span>
                        )}
                        {avail.status === 'not_configured' && (
                          <span>Sem configuração — {avail.scheduledCount} agendada{avail.scheduledCount !== 1 ? 's' : ''}</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[9px] pt-1">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/50" />
                <span>Lotado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-destructive/30 border border-destructive/50" />
                <span>Bloqueado</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
