import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, XCircle, Loader2, Calendar, DollarSign,
  Phone, Mail, MapPin
} from 'lucide-react';
import { Lead, PROCEDURES, statusConfig } from './LeadCard';

const DISCARD_REASONS = [
  'Não atende o telefone',
  'Número errado/inexistente',
  'Sem interesse no momento',
  'Preço fora do orçamento',
  'Já fez procedimento em outro lugar',
  'Localização muito distante',
  'Problemas de saúde impeditivos',
  'Mudou de ideia',
  'Lead duplicado',
  'Informações falsas/spam',
];

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
    converted_value?: number;
    procedures_sold?: string[];
    notes?: string;
    scheduled_at?: string;
    discard_reason?: string;
  }) => Promise<void>;
  isMine: boolean;
  isAdmin: boolean;
}

export function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  onSave,
  isMine,
  isAdmin
}: LeadDetailDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [conversionValue, setConversionValue] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [discardReason, setDiscardReason] = useState('');
  const [customDiscardReason, setCustomDiscardReason] = useState('');
  const [mode, setMode] = useState<'view' | 'schedule' | 'sell' | 'discard'>('view');

  const resetForm = () => {
    if (lead) {
      setConversionValue(lead.converted_value?.toString() || '');
      setSelectedProcedures(lead.procedures_sold || []);
      setNotes(lead.notes || '');
      setScheduledAt(lead.scheduled_at ? lead.scheduled_at.slice(0, 16) : '');
      setDiscardReason(lead.discard_reason || '');
      setCustomDiscardReason('');
      setMode('view');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const toggleProcedure = (proc: string) => {
    setSelectedProcedures(prev =>
      prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
    );
  };

  const handleSchedule = async () => {
    if (!scheduledAt) return;
    setIsSaving(true);
    try {
      await onSave({
        status: 'scheduled',
        scheduled_at: new Date(scheduledAt).toISOString(),
        notes
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSell = async () => {
    if (!conversionValue || selectedProcedures.length === 0) return;
    setIsSaving(true);
    try {
      await onSave({
        status: 'converted',
        converted_value: parseFloat(conversionValue),
        procedures_sold: selectedProcedures,
        notes
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    const reason = discardReason === 'outro' ? customDiscardReason : discardReason;
    if (!reason) return;
    setIsSaving(true);
    try {
      await onSave({
        status: 'lost',
        discard_reason: reason,
        notes
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!lead) return null;

  const canEdit = isMine || isAdmin;
  const StatusIcon = statusConfig[lead.status].icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.name}
            <Badge className={statusConfig[lead.status].color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[lead.status].label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {lead.procedure_interest && (
              <span className="font-medium">{lead.procedure_interest}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' && (
          <div className="space-y-4">
            {/* Contact Info */}
            <div className="grid gap-3">
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Phone className="h-4 w-4" />
                {lead.phone}
              </a>
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                  <Mail className="h-4 w-4" />
                  {lead.email}
                </a>
              )}
              {(lead.city || lead.state) && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {lead.city}{lead.state ? `, ${lead.state}` : ''}
                </span>
              )}
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Conversion Info */}
            {lead.status === 'converted' && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <DollarSign className="h-4 w-4" />
                  R$ {lead.converted_value?.toLocaleString('pt-BR')}
                </div>
                {lead.procedures_sold && lead.procedures_sold.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {lead.procedures_sold.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Scheduled Info */}
            {lead.status === 'scheduled' && lead.scheduled_at && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Calendar className="h-4 w-4" />
                  Agendado: {new Date(lead.scheduled_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}

            {/* Discard Info */}
            {lead.status === 'lost' && lead.discard_reason && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Motivo:</strong> {lead.discard_reason}
                </p>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{lead.notes}</p>
              </div>
            )}

            {/* Actions */}
            {canEdit && lead.status !== 'converted' && lead.status !== 'lost' && (
              <div className="flex gap-2 pt-4 border-t">
                {lead.status === 'contacted' && (
                  <Button 
                    variant="outline"
                    onClick={() => setMode('schedule')}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Consulta
                  </Button>
                )}
                <Button 
                  onClick={() => setMode('sell')}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Registrar Venda
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setMode('discard')}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === 'schedule' && (
          <div className="space-y-4">
            <div>
              <Label>Data e Hora da Consulta *</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre o agendamento..."
                rows={3}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode('view')}>Voltar</Button>
              <Button onClick={handleSchedule} disabled={!scheduledAt || isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Agendamento
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === 'sell' && (
          <div className="space-y-4">
            <div>
              <Label>Procedimento(s) Vendido(s) *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PROCEDURES.map(proc => (
                  <Badge
                    key={proc}
                    variant={selectedProcedures.includes(proc) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProcedure(proc)}
                  >
                    {proc}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Valor da Venda (R$) *</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre a venda..."
                rows={3}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode('view')}>Voltar</Button>
              <Button 
                onClick={handleSell} 
                disabled={!conversionValue || selectedProcedures.length === 0 || isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Venda
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === 'discard' && (
          <div className="space-y-4">
            <div>
              <Label>Motivo do Descarte *</Label>
              <Select value={discardReason} onValueChange={setDiscardReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {DISCARD_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                  <SelectItem value="outro">Outro motivo...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discardReason === 'outro' && (
              <div>
                <Label>Descreva o motivo</Label>
                <Input
                  value={customDiscardReason}
                  onChange={(e) => setCustomDiscardReason(e.target.value)}
                  placeholder="Digite o motivo..."
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label>Observações adicionais</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações..."
                rows={3}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode('view')}>Voltar</Button>
              <Button 
                variant="destructive"
                onClick={handleDiscard} 
                disabled={(!discardReason || (discardReason === 'outro' && !customDiscardReason)) || isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Descarte
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
