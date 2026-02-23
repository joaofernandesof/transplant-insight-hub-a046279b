import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User, Phone, FileText, Scissors, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Stethoscope, Users
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

function StatusBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      {done ? (
        <Badge variant="default" className="bg-emerald-600 text-xs gap-1">
          <CheckCircle2 className="w-3 h-3" /> Sim
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs gap-1">
          <XCircle className="w-3 h-3" /> Não
        </Badge>
      )}
    </div>
  );
}

export function SurgeryDetailDialog({ surgery, open, onOpenChange, onUpdate }: SurgeryDetailDialogProps) {
  if (!surgery) return null;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); }
    catch { return d; }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '—';
    return t.substring(0, 5);
  };

  const handleToggle = (field: keyof ClinicSurgery, value: boolean) => {
    onUpdate?.(surgery.id, { [field]: value } as Partial<ClinicSurgery>);
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
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Calendar} label="Data da Cirurgia" value={formatDate(surgery.surgeryDate)} />
              <InfoItem icon={Clock} label="Horário" value={formatTime(surgery.surgeryTime)} />
              <InfoItem icon={Scissors} label="Procedimento" value={surgery.procedure || '—'} />
              <InfoItem icon={Stethoscope} label="Grau" value={surgery.grade?.toString() || '—'} />
              <InfoItem icon={FileText} label="Prontuário" value={(surgery as any).medicalRecord || '—'} />
              <InfoItem icon={Users} label="Acompanhante" value={surgery.companionName || '—'} />
            </div>

            {surgery.companionPhone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Tel. Acompanhante: {surgery.companionPhone}
              </div>
            )}

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
                <ToggleItem label="Prontuário Pronto" checked={surgery.chartReady} field="chartReady" onToggle={handleToggle} />
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
                <StatusBadge done={(surgery as any).d20Contact || false} label="D-20 Contato" />
                <StatusBadge done={(surgery as any).d15Contact || false} label="D-15 Contato" />
                <StatusBadge done={(surgery as any).d10Contact || false} label="D-10 Contato" />
                <StatusBadge done={(surgery as any).d7Contact || false} label="D-7 Contato" />
                <StatusBadge done={(surgery as any).d2Contact || false} label="D-2 Contato" />
                <StatusBadge done={(surgery as any).d1Contact || false} label="D-1 Contato" />
              </div>
            </div>

            <Separator />

            {/* Pós-Op */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Dia da Cirurgia / Pós</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <StatusBadge done={surgery.bookingTermSigned} label="Termo de Internação" />
                <StatusBadge done={surgery.dischargeTermSigned} label="Ficha de Alta" />
                <StatusBadge done={surgery.gpiD1Done} label="GPI D+1" />
              </div>
            </div>

            {/* Notes */}
            {surgery.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {surgery.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
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
