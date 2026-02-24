import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User, Phone, FileText, Scissors, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Stethoscope, Users, Pencil
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClinicSurgery } from '../hooks/useClinicSurgeries';

interface SurgeryDetailDialogProps {
  surgery: ClinicSurgery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (id: string, updates: Partial<ClinicSurgery>) => void;
}

export function SurgeryDetailDialog({ surgery, open, onOpenChange, onUpdate }: SurgeryDetailDialogProps) {
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

            {/* Timeline de Contato */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Contatos Realizados
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <ToggleItem label="D-20 Contato" checked={(surgery as any).d20Contact || false} field="d20Contact" onToggle={handleToggle} />
                <ToggleItem label="D-15 Contato" checked={(surgery as any).d15Contact || false} field="d15Contact" onToggle={handleToggle} />
                <ToggleItem label="D-10 Contato" checked={(surgery as any).d10Contact || false} field="d10Contact" onToggle={handleToggle} />
                
                <ToggleItem label="D-2 Contato" checked={(surgery as any).d2Contact || false} field="d2Contact" onToggle={handleToggle} />
                <ToggleItem label="D-1 Contato" checked={(surgery as any).d1Contact || false} field="d1Contact" onToggle={handleToggle} />
              </div>
            </div>

            <Separator />

            {/* Pós-Op */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Dia da Cirurgia / Pós</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <ToggleItem label="Termo de Internação" checked={surgery.bookingTermSigned} field="bookingTermSigned" onToggle={handleToggle} />
                <ToggleItem label="Ficha de Alta" checked={surgery.dischargeTermSigned} field="dischargeTermSigned" onToggle={handleToggle} />
                <ToggleItem label="GPI D+1" checked={surgery.gpiD1Done} field="gpiD1Done" onToggle={handleToggle} />
              </div>
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
