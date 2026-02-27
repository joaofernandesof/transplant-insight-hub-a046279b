import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, XCircle } from 'lucide-react';

const DISCARD_REASONS = [
  'No-show',
  'Sem interesse',
  'Valor',
  'Outros',
];

interface DiscardFormDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  leadName: string;
}

export function DiscardFormDialog({ open, onClose, onConfirm, leadName }: DiscardFormDialogProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalReason = reason === 'Outros' ? (customReason.trim() || 'Outros') : reason;

  const handleSubmit = async () => {
    if (!reason) return;
    if (reason === 'Outros' && !customReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
    } finally {
      setIsSubmitting(false);
      setReason('');
      setCustomReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Descartar Lead
          </DialogTitle>
          <DialogDescription>
            Informe o motivo do descarte para <strong>{leadName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="discard-reason">Motivo do descarte</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v); if (v !== 'Outros') setCustomReason(''); }}>
              <SelectTrigger id="discard-reason">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {DISCARD_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'Outros' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Descreva o motivo</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ex: Lead duplicado, número incorreto..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || (reason === 'Outros' && !customReason.trim()) || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Descarte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
