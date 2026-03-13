import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2, Flag, Lock, MessageSquare, Pencil, Plus } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClinicSurgery } from '../hooks/useClinicSurgeries';
import { SurgeryDetailDialog } from './SurgeryDetailDialog';
import { useSurgeryTaskChips } from '../hooks/useSurgeryTaskChips';
import { SurgeryTaskChips } from './SurgeryTaskChips';
import { useSurgeryAgendaAvailability } from '../hooks/useSurgeryAgendaAvailability';
import { useSurgeryAgendaNotes } from '../hooks/useSurgeryAgendaNotes';
import { toast } from 'sonner';

interface SurgeryWeekTableProps {
  surgeries: ClinicSurgery[];
  onUpdate?: (id: string, updates: Partial<ClinicSurgery>) => void;
  onReschedule?: (id: string, newDate: string | null, newTime?: string | null) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  title?: string;
  violatedIds?: Set<string>;
  selectedBranch?: string;
  periodRange?: { start: Date; end: Date };
  availabilityFilter?: 'all' | 'available' | 'blocked';
  onAddToDate?: (date: string) => void;
}

export function SurgeryWeekTable({ surgeries, onUpdate, onReschedule, onDelete, canDelete, title, violatedIds, selectedBranch, periodRange, availabilityFilter = 'all', onAddToDate }: SurgeryWeekTableProps) {
  const [selectedSurgery, setSelectedSurgery] = useState<ClinicSurgery | null>(null);
  const surgeryIds = useMemo(() => surgeries.map(s => s.id), [surgeries]);
  const { tasksBySurgery } = useSurgeryTaskChips(surgeryIds);

  // Availability data
  const effectiveBranch = selectedBranch && selectedBranch !== 'all' ? selectedBranch : '';
  const { getDayAvailability } = useSurgeryAgendaAvailability(effectiveBranch, new Date());

  // Date-level notes
  const { notesByDate, upsertNote } = useSurgeryAgendaNotes(effectiveBranch);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, ClinicSurgery[]>();

    // 1) Generate all dates from selected period independently of surgeries
    if (periodRange) {
      try {
        const allDates = eachDayOfInterval({ start: periodRange.start, end: periodRange.end });
        for (const d of allDates) {
          map.set(format(d, 'yyyy-MM-dd'), []);
        }
      } catch {
        // invalid interval
      }
    } else {
      // For "Todo o período", fill all dates between first and last surgery date
      const datedValues = surgeries
        .map((s) => s.surgeryDate)
        .filter((date): date is string => Boolean(date));

      if (datedValues.length > 0) {
        const ordered = [...datedValues].sort((a, b) => a.localeCompare(b));
        const firstDate = parseISO(ordered[0]);
        const lastDate = parseISO(ordered[ordered.length - 1]);

        if (!Number.isNaN(firstDate.getTime()) && !Number.isNaN(lastDate.getTime())) {
          try {
            const allDates = eachDayOfInterval({ start: firstDate, end: lastDate });
            for (const d of allDates) {
              map.set(format(d, 'yyyy-MM-dd'), []);
            }
          } catch {
            // invalid interval
          }
        }
      }
    }

    // 2) Associate surgeries with each generated day
    const sortedSurgeries = [...surgeries].sort((a, b) => {
      if (a.surgeryDate === b.surgeryDate) {
        return (a.surgeryTime || '').localeCompare(b.surgeryTime || '');
      }
      return (a.surgeryDate || '').localeCompare(b.surgeryDate || '');
    });

    for (const surgery of sortedSurgeries) {
      const key = surgery.surgeryDate || 'sem-data';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(surgery);
    }

    // 3) Keep ordering: today/future ascending, then past ascending, then sem-data
    const today = startOfDay(new Date());
    const datedEntries = Array.from(map.entries()).filter(([date]) => date !== 'sem-data');
    const noDateEntries = Array.from(map.entries()).filter(([date]) => date === 'sem-data');

    datedEntries.sort(([dateA], [dateB]) => {
      const parsedA = parseISO(dateA);
      const parsedB = parseISO(dateB);

      if (Number.isNaN(parsedA.getTime()) || Number.isNaN(parsedB.getTime())) {
        return dateA.localeCompare(dateB);
      }

      const dayA = startOfDay(parsedA);
      const dayB = startOfDay(parsedB);

      const priorityA = isBefore(dayA, today) ? 1 : 0;
      const priorityB = isBefore(dayB, today) ? 1 : 0;
      if (priorityA !== priorityB) return priorityA - priorityB;

      return dayA.getTime() - dayB.getTime();
    });

    return new Map([...datedEntries, ...noDateEntries]);
  }, [surgeries, periodRange]);

  // Filter grouped dates by availability status
  const filteredGrouped = useMemo(() => {
    if (availabilityFilter === 'all' || !effectiveBranch) return grouped;
    const result = new Map<string, ClinicSurgery[]>();
    for (const [date, items] of grouped.entries()) {
      if (date === 'sem-data') continue;
      const avail = getDayAvailability(date);
      if (availabilityFilter === 'available') {
        if (avail.status === 'not_configured' || avail.status === 'available') {
          result.set(date, items);
        }
      } else if (availabilityFilter === 'blocked') {
        if (avail.status === 'blocked') {
          result.set(date, items);
        }
      }
    }
    return result;
  }, [grouped, availabilityFilter, effectiveBranch, getDayAvailability]);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'sem-data') return 'Sem Data';
    try {
      return format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch { return dateStr; }
  };

  const checklistItems = [
    { key: 'examsSent' as const, label: 'E', title: 'Exames' },
    { key: 'contractSigned' as const, label: 'C', title: 'Contrato' },
    { key: 'guidesSent' as const, label: 'G', title: 'Guias' },
    { key: 'd20Contact' as const, label: '20', title: 'Contato D-20' },
    { key: 'd15Contact' as const, label: '15', title: 'Contato D-15' },
    { key: 'd10Contact' as const, label: '10', title: 'Contato D-10' },
    { key: 'd2Contact' as const, label: '2', title: 'Contato D-2' },
    { key: 'd1Contact' as const, label: '1', title: 'Contato D-1' },
    { key: 'surgeryConfirmed' as const, label: '✓', title: 'Confirmada' },
  ];

  const handleSaveDateNote = useCallback((date: string, note: string) => {
    upsertNote.mutate({ date, note }, {
      onSuccess: () => toast.success('Observação do dia salva'),
      onError: () => toast.error('Erro ao salvar observação'),
    });
  }, [upsertNote]);

  const handleSavePatientNote = useCallback((surgeryId: string, note: string) => {
    if (onUpdate) {
      onUpdate(surgeryId, { notes: note });
    }
  }, [onUpdate]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title || 'Cirurgias da Semana'}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Legenda:</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">E</span> Exames</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">C</span> Contrato</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">G</span> Guias</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">20</span> D-20</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">15</span> D-15</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">10</span> D-10</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">2</span> D-2</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">1</span> D-1</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">✓</span> Confirmada</span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGrouped.size === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma cirurgia agendada para este período
            </p>
          ) : (
            <div>
              <div className="space-y-4">
                {Array.from(filteredGrouped.entries()).map(([date, items]) => {
                  const dayAvail = effectiveBranch && date !== 'sem-data' ? getDayAvailability(date) : null;
                  const isConfigured = dayAvail && dayAvail.status !== 'not_configured';
                  const dateNote = date !== 'sem-data' ? notesByDate.get(date) : undefined;
                  const maxSlots = dayAvail?.maxSlots || 0;
                  const isDayBlocked = dayAvail?.isBlocked === true;
                  const emptySlots = Math.max(0, maxSlots - items.length);

                  return (
                  <div key={date}>
                    <div className="sticky top-0 bg-background z-10 py-1.5 mb-1 flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold capitalize text-primary">
                        {formatDateHeader(date)}
                        <Badge variant="secondary" className="ml-2 text-xs">{items.length}/{maxSlots || items.length}</Badge>
                      </h4>
                      {isConfigured && (
                        dayAvail.isBlocked ? (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <Lock className="h-3 w-3" /> Bloqueado
                          </Badge>
                        ) : dayAvail.remainingSlots > 0 ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px]">
                            {dayAvail.remainingSlots} vaga{dayAvail.remainingSlots > 1 ? 's' : ''} disponível{dayAvail.remainingSlots > 1 ? 'eis' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                            Lotado ({dayAvail.scheduledCount}/{dayAvail.maxSlots})
                          </Badge>
                        )
                      )}
                    </div>

                    {/* Date-level note */}
                    {date !== 'sem-data' && (
                      <InlineNoteEditor
                        value={dateNote || ''}
                        onSave={(note) => handleSaveDateNote(date, note)}
                        placeholder="Adicionar observação do dia..."
                        variant="date"
                      />
                    )}

                    {items.length === 0 && (
                      <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground italic">
                        Nenhuma cirurgia agendada
                      </div>
                    )}
                    {(items.length > 0 || emptySlots > 0) && (
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[60px]">Hora</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead className="hidden md:table-cell">Procedimento</TableHead>
                            <TableHead className="hidden lg:table-cell">Grau</TableHead>
                            <TableHead className="hidden md:table-cell">Tricotomia</TableHead>
                            <TableHead className="hidden md:table-cell">Tarefas D's</TableHead>
                            <TableHead className="min-w-[120px] md:min-w-[150px]">Obs. Paciente</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(surgery => {
                            const isViolated = violatedIds?.has(surgery.id);
                            return (
                            <TableRow key={surgery.id} className={`cursor-pointer hover:bg-muted/50 ${isViolated ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500' : ''}`} onClick={() => setSelectedSurgery(surgery)}>
                              <TableCell className="text-xs font-mono">
                                {surgery.surgeryTime ? surgery.surgeryTime.substring(0, 5) : '...'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {isViolated && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Flag className="h-4 w-4 text-red-500 shrink-0 fill-red-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs font-medium">⚠️ Categoria bloqueada nesta semana/filial</p>
                                          <p className="text-xs text-muted-foreground">Trava de agenda violada — necessita ajuste</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  <div>
                                    <span className={`font-medium hover:underline cursor-pointer text-sm ${isViolated ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
                                      {surgery.patientName}
                                    </span>
                                    {surgery.category && (
                                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{surgery.category}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                {surgery.procedure || '...'}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">
                                {surgery.grade || '...'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs">
                                {surgery.trichotomyDatetime && surgery.trichotomyDatetime !== 'NÃO TEM MARCAÇÃO' ? (
                                  <span className="font-medium text-amber-700 dark:text-amber-400">{(() => { try { const d = new Date(surgery.trichotomyDatetime); return isNaN(d.getTime()) ? surgery.trichotomyDatetime : `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; } catch { return surgery.trichotomyDatetime; } })()}</span>
                                ) : (
                                  <span className="text-muted-foreground">...</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {tasksBySurgery.get(surgery.id) && (
                                  <SurgeryTaskChips tasks={tasksBySurgery.get(surgery.id)!} compact />
                                )}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <InlineNoteEditor
                                  value={surgery.notes || ''}
                                  onSave={(note) => handleSavePatientNote(surgery.id, note)}
                                  placeholder="Obs..."
                                  variant="patient"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {surgery.surgeryConfirmed ? (
                                  <Badge className="bg-emerald-600 text-xs gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Confirmada
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pendente</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                            );
                          })}
                          {/* Empty slot placeholder rows */}
                          {Array.from({ length: emptySlots }).map((_, idx) => (
                            <TableRow key={`empty-${idx}`} className={isDayBlocked ? "opacity-30" : "opacity-50 hover:opacity-80 cursor-pointer hover:bg-muted/50 transition-opacity"} onClick={() => !isDayBlocked && onAddToDate?.(date)}>
                              <TableCell className="text-xs font-mono text-muted-foreground">...</TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                                  {isDayBlocked ? <Lock className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                  {isDayBlocked ? 'Vaga bloqueada' : 'Vaga disponível'}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">...</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">...</TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">...</TableCell>
                              <TableCell className="hidden md:table-cell" />
                              <TableCell />
                              <TableCell className="text-right">
                                <Badge variant="outline" className="text-xs text-muted-foreground">—</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SurgeryDetailDialog
        surgery={selectedSurgery}
        open={!!selectedSurgery}
        onOpenChange={(open) => !open && setSelectedSurgery(null)}
        onUpdate={onUpdate}
        onReschedule={onReschedule}
        onDelete={onDelete}
        canDelete={canDelete}
      />
    </>
  );
}

/** Inline note editor - click to edit, blur/enter to save */
function InlineNoteEditor({ value, onSave, placeholder, variant }: {
  value: string;
  onSave: (note: string) => void;
  placeholder: string;
  variant: 'date' | 'patient';
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    setEditing(false);
    if (localValue.trim() !== value.trim()) {
      onSave(localValue.trim());
    }
  }, [localValue, value, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setEditing(false);
    }
  }, [handleSave, value]);

  if (variant === 'date') {
    return (
      <div className="mb-1.5">
        {editing ? (
          <div className="flex items-start gap-2 bg-muted/30 rounded-md p-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <textarea
              ref={inputRef}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-xs resize-none min-h-[24px]"
              rows={1}
            />
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-xs w-full text-left rounded-md px-2 py-1 hover:bg-muted/30 transition-colors group"
          >
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {value ? (
              <span className="text-foreground">{value}</span>
            ) : (
              <span className="text-muted-foreground italic">{placeholder}</span>
            )}
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
          </button>
        )}
      </div>
    );
  }

  // Patient variant - compact inline
  return (
    <div className="min-w-[120px]">
      {editing ? (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border border-border rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none min-h-[28px]"
          rows={1}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs w-full text-left rounded px-1.5 py-0.5 hover:bg-muted/50 transition-colors group min-h-[28px]"
        >
          {value ? (
            <span className="text-amber-600 dark:text-amber-400 line-clamp-2">📝 {value}</span>
          ) : (
            <span className="text-muted-foreground italic opacity-60 group-hover:opacity-100">
              <Pencil className="h-3 w-3 inline mr-0.5" /> Obs...
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function CheckDot({ done, label, title }: { done: boolean; label: string; title?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
        done
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      }`}
      title={`${title || label}: ${done ? 'OK' : 'Pendente'}`}
    >
      {label}
    </span>
  );
}
