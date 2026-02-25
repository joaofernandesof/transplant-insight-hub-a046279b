import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { HotLead } from '@/hooks/useHotLeads';
import type { HotLeadsSettings } from '@/hooks/useHotLeadsSettings';

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
  settings: HotLeadsSettings | null;
  generateWhatsAppUrl: (phone: string, name: string) => string | null;
}

export function LeadAcquireDialog({ lead, open, onOpenChange, onConfirm, settings, generateWhatsAppUrl }: LeadAcquireDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userEmail = user?.email || '';

  const handleConfirm = async () => {
    if (!lead || !userEmail || !settings) return;
    setIsSubmitting(true);
    const success = await onConfirm(lead.id, userEmail);
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
      // Open WhatsApp with the standardized message
      const whatsappUrl = generateWhatsAppUrl(lead.phone, lead.name);
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  // Preview of the message
  const previewMessage = settings && lead
    ? `Olá, ${lead.name}, tudo bem?\n\nMeu nome é ${settings.licensee_name} e falo da clínica ${settings.clinic_name}.\n\nRecebemos seu contato através do seu cadastro no site da Neo Folic, onde você solicitou informações sobre transplante capilar. Somos a clínica credenciada da Neo Folic na sua região. Quero entender melhor o que você está buscando e te explicar como funciona o procedimento.\n\nVocê prefere que eu te ligue ou continuamos por aqui?\n\n🖼️ [Imagem da Licença ByNeofolic será incluída no link]`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Adquirir Lead e Contatar via WhatsApp
          </DialogTitle>
          <DialogDescription>
            {lead && (
              <span>
                Você está adquirindo o lead <strong>{maskName(lead.name)}</strong>.
                Após confirmar, será redirecionado ao WhatsApp com uma mensagem padronizada.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Message Preview */}
        {previewMessage && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Prévia da mensagem:</p>
            <p className="text-sm text-green-900 dark:text-green-200 whitespace-pre-line leading-relaxed">
              {previewMessage}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || !userEmail}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Adquirir e abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
