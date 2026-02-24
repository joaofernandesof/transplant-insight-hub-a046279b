import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User, Phone, FileText, Scissors, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Stethoscope, Users, Pencil,
  ChevronDown, ChevronRight, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClinicSurgery } from '../hooks/useClinicSurgeries';
import { useSurgeryTasks } from '../hooks/useSurgeryTasks';

interface SurgeryDetailDialogProps {
  surgery: ClinicSurgery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<ClinicSurgery>) => void;
}

export function SurgeryDetailDialog({ surgery, open, onOpenChange, onUpdate }: SurgeryDetailDialogProps) {
  const { tasks: surgeryTasks, phases, isLoading: tasksLoading, completeTask } = useSurgeryTasks(surgery?.id);

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
          <div className="flex flex-wrap gap-2 mt-2">
            {surgery.surgeryConfirmed ? (
              <Badge className="bg-emerald-600">Confirmada</Badge>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
            {surgery.procedure && <Badge variant="outline">{surgery.procedure}</Badge>}
            {surgery.category && <Badge variant="outline" className="text-xs">{surgery.category}</Badge>}
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
              <EditableField
                icon={Scissors}
                label="Procedimento"
                value={surgery.procedure || ''}
                field="procedure"
                onSave={handleFieldSave}
              />
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

            {/* Checklist Pré-Operatório */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Checklist Pré-Operatório
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <ToggleItem label="Exames Enviados" checked={surgery.examsSent} field="examsSent" onToggle={handleToggle} />
                <ToggleItem label="Contrato Assinado" checked={surgery.contractSigned} field="contractSigned" onToggle={handleToggle} />
                
                <ToggleItem label="Cirurgia Confirmada" checked={surgery.surgeryConfirmed} field="surgeryConfirmed" onToggle={handleToggle} />
                <ToggleItem label="Guias Enviados" checked={(surgery as any).guidesSent || false} field="guidesSent" onToggle={handleToggle} />
              </div>
            </div>

            <Separator />

            {/* Task Checklist por Fase D-X */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Protocolo de Tarefas
              </h4>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando tarefas...
                </div>
              ) : phases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhuma tarefa gerada para esta cirurgia.</p>
              ) : (
                <div className="space-y-2">
                  {phases.map((phase) => (
                    <PhaseChecklistGroup
                      key={phase.label}
                      phase={phase}
                      onComplete={(taskId) => completeTask.mutate({ taskId })}
                    />
                  ))}
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
