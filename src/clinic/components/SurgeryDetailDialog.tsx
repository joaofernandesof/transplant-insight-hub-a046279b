import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  User, Phone, FileText, Scissors, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Stethoscope, Users, Pencil,
  ChevronDown, ChevronRight, Loader2, History, CalendarClock, CalendarX2, Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClinicSurgery } from '../hooks/useClinicSurgeries';
import { useSurgeryTasks } from '../hooks/useSurgeryTasks';
import { useSurgeryAuditLog } from '../hooks/useSurgeryAuditLog';
import { ProcedureCheckboxField } from './ProcedureCheckboxField';
import { TrichotomyField } from './TrichotomyField';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const UPGRADE_CATEGORIES = [
  { value: 'CATEGORIA A - DR HYGOR', label: 'Categoria A - Dr Hygor' },
  { value: 'CATEGORIA A - DR PATRICK', label: 'Categoria A - Dr Patrick' },
  { value: 'CATEGORIA B - MÉDICO DA EQUIPE', label: 'Categoria B - Médico da Equipe' },
  { value: 'CATEGORIA C - PACIENTE MODELO VIP', label: 'Categoria C - Paciente Modelo VIP' },
  { value: 'CATEGORIA D - PACIENTE MODELO NORMAL', label: 'Categoria D - Paciente Modelo Normal' },
  { value: 'A DEFINIR', label: 'A Definir' },
  { value: 'RETOUCHING', label: 'Retouching' },
];

const UPSELL_PROCEDURES = [
  'CABELO',
  'BARBA',
  'SOBRANCELHA',
  'BODY HAIR BARBA',
  'BODY HAIR PEITO',
];

interface SurgeryDetailDialogProps {
  surgery: ClinicSurgery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<ClinicSurgery>) => void;
  onReschedule?: (id: string, newDate: string | null) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function SurgeryDetailDialog({ surgery, open, onOpenChange, onUpdate, onReschedule, onDelete, canDelete }: SurgeryDetailDialogProps) {
  const queryClient = useQueryClient();
  const { tasks: surgeryTasks, phases, isLoading: tasksLoading, completeTask, updateResponsible } = useSurgeryTasks(surgery?.id);
  const { logs: auditLogs, isLoading: logsLoading } = useSurgeryAuditLog(surgery?.id);
  const { isAdmin } = useUnifiedAuth();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [editingResponsibleTaskId, setEditingResponsibleTaskId] = useState<string | null>(null);

  // Template is now auto-resolved from branch — no manual selector needed

  // Fetch system users for responsible assignment
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['neohub-users-for-responsible'],
    queryFn: async () => {
      const { data } = await supabase
        .from('neohub_users')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      return (data || []).filter(u => u.full_name);
    },
    enabled: isAdmin && open,
  });

  if (!surgery) return null;

  const handleFieldSave = (field: string, value: string | boolean | number | null) => {
    onUpdate?.(surgery.id, { [field]: value } as Partial<ClinicSurgery>);
  };

  const handleToggle = (field: keyof ClinicSurgery, value: boolean) => {
    onUpdate?.(surgery.id, { [field]: value } as Partial<ClinicSurgery>);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '';
    try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); }
    catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {surgery.patientName}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {surgery.surgeryConfirmed ? (
              <Badge className="bg-emerald-600">Confirmada</Badge>
            ) : surgery.scheduleStatus === 'sem_data' ? (
              <Badge variant="destructive">A Definir</Badge>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
            {surgery.procedure && <Badge variant="outline">{surgery.procedure}</Badge>}
            {surgery.category && <Badge variant="outline" className="text-xs">{surgery.category}</Badge>}

            <div className="ml-auto flex items-center gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative" title="Histórico de Alterações">
                    <History className="h-4 w-4" />
                    {auditLogs.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {auditLogs.length > 9 ? '9+' : auditLogs.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="p-3 border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      Histórico de Alterações
                    </h4>
                  </div>
                  <ScrollArea className="max-h-[350px]">
                    <div className="p-3">
                      {logsLoading ? (
                        <div className="flex items-center justify-center py-4 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : auditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma alteração registrada.</p>
                      ) : (
                        <div className="space-y-2">
                          {auditLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2 text-xs border-l-2 border-muted pl-3 py-1.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-medium text-foreground">{log.user_name || 'Usuário'}</span>
                                  <span className="text-muted-foreground">alterou</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.field_label || log.field_name}</Badge>
                                </div>
                                <div className="mt-0.5 text-muted-foreground">
                                  <span className="line-through">{log.old_value || '—'}</span>
                                  <span className="mx-1">→</span>
                                  <span className="text-foreground font-medium">{log.new_value || '—'}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                {format(parseISO(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <Popover open={rescheduleOpen} onOpenChange={(o) => { setRescheduleOpen(o); if (o) setRescheduleDate(''); }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Reagendar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Reagendar Cirurgia</h4>
                    <p className="text-xs text-muted-foreground">
                      Escolha uma nova data ou mova para "A definir".
                    </p>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Nova Data</Label>
                      <Input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        disabled={!rescheduleDate}
                        onClick={() => {
                          onReschedule?.(surgery.id, rescheduleDate);
                          setRescheduleOpen(false);
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Reagendar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          onReschedule?.(surgery.id, null);
                          setRescheduleOpen(false);
                        }}
                      >
                        <CalendarX2 className="h-3.5 w-3.5" />
                        A Definir
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {canDelete && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5 text-xs">
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir da agenda?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O paciente <strong>{surgery.patientName}</strong> será removido da agenda cirúrgica. Todas as tarefas associadas também serão excluídas. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          onDelete(surgery.id);
                          onOpenChange(false);
                        }}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6 space-y-5">
            {/* Editable Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                icon={Calendar}
                label="Data da Cirurgia"
                value={surgery.surgeryDate || ''}
                displayValue={formatDate(surgery.surgeryDate)}
                field="surgeryDate"
                type="date"
                onSave={handleFieldSave}
              />
              <EditableField
                icon={Clock}
                label="Horário"
                value={surgery.surgeryTime?.substring(0, 5) || ''}
                field="surgeryTime"
                type="time"
                onSave={handleFieldSave}
              />
              <TrichotomyField
                value={surgery.trichotomyDatetime}
                onSave={(val) => handleFieldSave('trichotomyDatetime', val)}
              />
              <div className="col-span-2">
                <ProcedureCheckboxField
                  value={surgery.procedure || ''}
                  onChange={(val) => handleFieldSave('procedure', val)}
                />
              </div>
              <EditableField
                icon={Stethoscope}
                label="Grau"
                value={surgery.grade?.toString() || ''}
                field="grade"
                onSave={handleFieldSave}
              />
              <EditableField
                icon={FileText}
                label="Prontuário"
                value={(surgery as any).medicalRecord || ''}
                field="medicalRecord"
                onSave={handleFieldSave}
              />
              <EditableField
                icon={Users}
                label="Acompanhante"
                value={surgery.companionName || ''}
                field="companionName"
                onSave={handleFieldSave}
              />
              <EditableField
                icon={Phone}
                label="Tel. Acompanhante"
                value={surgery.companionPhone || ''}
                field="companionPhone"
                onSave={handleFieldSave}
              />
            </div>

            <Separator />

            {/* Upsells & Upgrades - always show for editing */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🚀 Upsells & Upgrades
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-4 border ${surgery.upgradeValue > 0 ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' : 'bg-muted/30 border-muted'}`}>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">Upgrade</p>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Categoria
                    </Label>
                    <Select
                      value={surgery.upgradeCategory || ''}
                      onValueChange={(val) => handleFieldSave('upgradeCategory', val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {UPGRADE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2">
                    <EditableField
                      icon={FileText}
                      label="Valor"
                      value={surgery.upgradeValue?.toString() || '0'}
                      field="upgradeValue"
                      type="number"
                      onSave={(f, v) => handleFieldSave(f, Number(v) || 0)}
                    />
                  </div>
                </div>
                <div className={`rounded-lg p-4 border ${surgery.upsellValue > 0 ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-muted/30 border-muted'}`}>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">Upsell</p>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Procedimento
                    </Label>
                    <Select
                      value={surgery.upsellCategory || ''}
                      onValueChange={(val) => handleFieldSave('upsellCategory', val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {UPSELL_PROCEDURES.map((proc) => (
                          <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2">
                    <EditableField
                      icon={FileText}
                      label="Valor"
                      value={surgery.upsellValue?.toString() || '0'}
                      field="upsellValue"
                      type="number"
                      onSave={(f, v) => handleFieldSave(f, Number(v) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Protocolo de Atividades */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Protocolo de Atividades
                </h4>
              </div>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando atividades...
                </div>
              ) : surgeryTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhuma atividade gerada para esta cirurgia.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Atividade</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground w-20">Momento</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground w-20">Data</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground w-24">Atraso</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surgeryTasks.map((task, i) => (
                        <tr key={task.id} className={`group border-b last:border-b-0 ${task.status === 'completed' ? 'bg-muted/30' : task.status === 'overdue' ? 'bg-destructive/5' : ''}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={task.status === 'completed'}
                                disabled={task.status === 'completed'}
                                onCheckedChange={() => completeTask.mutate({ taskId: task.id })}
                                className="h-4 w-4"
                              />
                              <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : task.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                                {task.title}
                              </span>
                              {task.status === 'overdue' && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {task.phase_label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {task.scheduled_date ? (
                              <span className="text-[10px] text-muted-foreground">
                                {format(parseISO(task.scheduled_date), 'dd/MM')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {task.status !== 'completed' && task.scheduled_date ? (() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const taskDate = parseISO(task.scheduled_date);
                              taskDate.setHours(0, 0, 0, 0);
                              const diffDays = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays > 0) {
                                return (
                                  <Badge variant="destructive" className="text-[9px] px-1.5">
                                    {diffDays}d
                                  </Badge>
                                );
                              }
                              return <span className="text-[10px] text-muted-foreground">—</span>;
                            })() : (
                              <span className="text-[10px] text-muted-foreground">
                                {task.status === 'completed' ? '✓' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {isAdmin ? (
                              <Popover
                                open={editingResponsibleTaskId === task.id}
                                onOpenChange={(open) => setEditingResponsibleTaskId(open ? task.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button className="text-left text-muted-foreground hover:text-foreground hover:underline cursor-pointer transition-colors truncate max-w-[120px] block">
                                    {task.responsible_name}
                                    <Pencil className="h-2.5 w-2.5 inline ml-1 opacity-0 group-hover:opacity-50" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-0" align="end">
                                  <Command>
                                    <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
                                    <CommandList>
                                      <CommandEmpty>Nenhum encontrado</CommandEmpty>
                                      <CommandGroup>
                                        {systemUsers.map((user) => (
                                          <CommandItem
                                            key={user.id}
                                            value={user.full_name}
                                            onSelect={() => {
                                              updateResponsible.mutate({
                                                taskId: task.id,
                                                definitionId: task.definition_id,
                                                processStepId: (task as any).process_step_id,
                                                responsibleName: user.full_name,
                                                responsibleUserId: user.id,
                                              });
                                              setEditingResponsibleTaskId(null);
                                            }}
                                            className="text-xs"
                                          >
                                            {user.full_name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="text-muted-foreground truncate">{task.responsible_name}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


            {/* Notes - editable */}
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-2">Observações</h4>
              <EditableTextarea
                value={surgery.notes || ''}
                field="notes"
                onSave={handleFieldSave}
              />
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditableField({ icon: Icon, label, value, displayValue, field, type = 'text', onSave }: {
  icon: React.ElementType;
  label: string;
  value: string;
  displayValue?: string;
  field: string;
  type?: string;
  onSave: (field: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const commit = () => {
    setEditing(false);
    if (localValue !== value) {
      onSave(field, localValue);
    }
  };

  return (
    <div className="flex items-start gap-2 group">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {editing ? (
          <Input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="h-7 text-sm mt-0.5"
            autoFocus
          />
        ) : (
          <div
            className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => setEditing(true)}
          >
            <p className="text-sm font-medium truncate">{displayValue || value || '—'}</p>
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}

function EditableTextarea({ value, field, onSave }: {
  value: string;
  field: string;
  onSave: (field: string, value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const commit = () => {
    if (localValue !== value) {
      onSave(field, localValue);
    }
  };

  return (
    <Textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      placeholder="Adicionar observações..."
      className="text-sm min-h-[60px]"
    />
  );
}

function ToggleItem({ label, checked, field, onToggle }: { 
  label: string; checked: boolean; field: string; 
  onToggle: (field: any, value: boolean) => void 
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Label className="text-sm cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={(v) => onToggle(field, v)} />
    </div>
  );
}

function PhaseChecklistGroup({ phase, onComplete }: {
  phase: import('../hooks/useSurgeryTasks').TaskPhaseGroup;
  onComplete: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const allDone = phase.completedCount === phase.totalCount;

  return (
    <div className="bg-muted/50 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm font-semibold">{phase.label}</span>
          {phase.hasOverdue && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
          {phase.hasProblem && <XCircle className="h-3.5 w-3.5 text-destructive" />}
        </div>
        <Badge variant={allDone ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
          {phase.completedCount}/{phase.totalCount}
        </Badge>
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {phase.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 py-1">
              <Checkbox
                checked={task.status === 'completed'}
                disabled={task.status === 'completed'}
                onCheckedChange={() => onComplete(task.id)}
                className="h-4 w-4"
              />
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : task.status === 'overdue' ? 'text-destructive font-medium' : ''}`}>
                  {task.title}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1.5">({task.responsible_name})</span>
              </div>
              {task.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
              {task.status === 'overdue' && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
