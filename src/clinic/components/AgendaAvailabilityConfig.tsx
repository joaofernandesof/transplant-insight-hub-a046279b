import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSurgeryAgendaAvailability } from '../hooks/useSurgeryAgendaAvailability';
import { useBranches } from '../hooks/useBranches';
import { toast } from 'sonner';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function AgendaAvailabilityConfig() {
  const { branches } = useBranches({ showAll: true });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editBlocked, setEditBlocked] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [globalMaxSlots, setGlobalMaxSlots] = useState(5);

  const { dayAvailabilityMap, getDayAvailability, upsertAvailability, deleteAvailability, isLoading } =
    useSurgeryAgendaAvailability(selectedBranch, currentMonth);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOffset = useMemo(() => {
    const dow = getDay(startOfMonth(currentMonth));
    return dow === 0 ? 6 : dow - 1;
  }, [currentMonth]);

  // Apply global max_slots to all days of the month
  const handleApplyGlobalSlots = async () => {
    if (!selectedBranch || globalMaxSlots < 1) return;
    
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const existing = getDayAvailability(dateStr);
      // Keep blocked state if already configured, just update max_slots
      await upsertAvailability.mutateAsync({
        branch: selectedBranch,
        date: dateStr,
        max_slots: globalMaxSlots,
        is_blocked: existing.isBlocked,
        blocked_reason: existing.blockedReason || undefined,
      });
    }
    toast.success(`Limite de ${globalMaxSlots} agendamentos aplicado para todo o mês`);
  };

  const handleDayClick = (dateStr: string) => {
    if (!selectedBranch) return;
    const existing = getDayAvailability(dateStr);
    setEditBlocked(existing.isBlocked);
    setEditReason(existing.blockedReason || '');
    setEditingDay(dateStr);
  };

  const handleSave = () => {
    if (!editingDay || !selectedBranch) return;
    const existing = getDayAvailability(editingDay);
    const maxSlots = existing.status !== 'not_configured' ? existing.maxSlots : globalMaxSlots;
    upsertAvailability.mutate({
      branch: selectedBranch,
      date: editingDay,
      max_slots: maxSlots,
      is_blocked: editBlocked,
      blocked_reason: editBlocked ? editReason : undefined,
    });
    setEditingDay(null);
  };

  const handleRemoveConfig = () => {
    if (!editingDay || !selectedBranch) return;
    deleteAvailability.mutate({ branch: selectedBranch, date: editingDay });
    setEditingDay(null);
  };

  const getStatusColor = (dateStr: string) => {
    const avail = getDayAvailability(dateStr);
    if (avail.status === 'blocked') return 'bg-destructive/20 border-destructive/40 text-destructive';
    if (avail.status === 'full') return 'bg-amber-500/20 border-amber-500/40 text-amber-700';
    if (avail.status === 'available') return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700';
    return 'bg-muted/50 border-border text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configuração de Disponibilidade da Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Branch selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Filial</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full h-8 text-sm">
                <SelectValue placeholder="Selecione a filial" />
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
              {/* Global max slots */}
              <div className="flex items-end gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs font-medium">Agendamentos por dia</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={globalMaxSlots}
                    onChange={(e) => setGlobalMaxSlots(Number(e.target.value))}
                    className="h-8 w-24 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleApplyGlobalSlots}
                  disabled={upsertAvailability.isPending}
                >
                  Aplicar para o mês
                </Button>
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-sm font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const avail = getDayAvailability(dateStr);
                  const isConfigured = avail.status !== 'not_configured';

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(dateStr)}
                      className={cn(
                        'relative p-1.5 rounded-md border text-center transition-colors hover:ring-2 hover:ring-primary/30 min-h-[52px] flex flex-col items-center justify-start gap-0.5',
                        getStatusColor(dateStr)
                      )}
                    >
                      <span className="text-xs font-medium">{format(day, 'd')}</span>
                      {isConfigured && (
                        <>
                          {avail.isBlocked ? (
                            <Lock className="h-3 w-3 text-destructive" />
                          ) : (
                            <span className="text-[9px] font-medium">
                              {avail.scheduledCount}/{avail.maxSlots}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
                  <span>Lotado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-destructive/30 border border-destructive/50" />
                  <span>Bloqueado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-muted border border-border" />
                  <span>Sem configuração</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit day dialog - now only for blocking/unblocking */}
      <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingDay ? format(new Date(editingDay + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR }) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Bloqueado</Label>
              <Switch checked={editBlocked} onCheckedChange={setEditBlocked} />
              {editBlocked && <Badge variant="destructive" className="text-[10px]">Dia bloqueado</Badge>}
            </div>
            {editBlocked && (
              <div className="space-y-1.5">
                <Label className="text-xs">Motivo (opcional)</Label>
                <Textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ex: Feriado, manutenção..."
                  className="h-16 text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {getDayAvailability(editingDay || '').status !== 'not_configured' && (
              <Button variant="outline" size="sm" className="text-xs" onClick={handleRemoveConfig}>
                Remover configuração
              </Button>
            )}
            <Button size="sm" className="text-xs" onClick={handleSave} disabled={upsertAvailability.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
