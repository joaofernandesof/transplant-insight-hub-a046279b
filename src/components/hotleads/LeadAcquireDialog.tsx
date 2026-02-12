import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { HotLead } from '@/hooks/useHotLeads';

function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, i) => {
    if (i === 0) return part;
    if (part.length <= 3) return part.charAt(0) + '***';
    return part.substring(0, 3) + '***';
  }).join(' ');
}

interface LeadAcquireDialogProps {
  lead: HotLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (leadId: string, email: string) => Promise<boolean>;
}

export function LeadAcquireDialog({ lead, open, onOpenChange, onConfirm }: LeadAcquireDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userEmail = user?.email || '';

  const handleConfirm = async () => {
    if (!lead || !userEmail) return;
    setIsSubmitting(true);
    const success = await onConfirm(lead.id, userEmail);
    setIsSubmitting(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Adquirir Lead
          </DialogTitle>
          <DialogDescription>
            {lead && (
              <span>
                Você está adquirindo o lead <strong>{maskName(lead.name)}</strong>.
                Os dados completos serão enviados para o seu e-mail.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <p className="text-sm text-muted-foreground">Os dados serão enviados para:</p>
          <p className="text-sm font-semibold mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {userEmail}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || !userEmail}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Receber dados do lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
