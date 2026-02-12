import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, User, Calendar, Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { HotLead } from '@/hooks/useHotLeads';

interface AcquiredLeadCardProps {
  lead: HotLead;
  claimerName: string;
  isOwned?: boolean;
}

function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, i) => {
    if (i === 0) return part;
    if (part.length <= 3) return part.charAt(0) + '***';
    return part.substring(0, 3) + '***';
  }).join(' ');
}

export function AcquiredLeadCard({ lead, claimerName, isOwned }: AcquiredLeadCardProps) {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  
  const arrivalDate = lead.created_at 
    ? format(new Date(lead.created_at), "dd/MM/yyyy")
    : null;

  const handleResendEmail = async () => {
    if (!user?.email) return;
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-resend', {
        body: { lead_id: lead.id, user_email: user.email },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success('E-mail reenviado com sucesso!');
    } catch {
      toast.error('Erro ao reenviar e-mail.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={`border-l-4 ${isOwned ? 'border-l-blue-500' : 'border-l-red-300 opacity-75'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{maskedName}</h3>
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {location}
              </p>
            )}
            {arrivalDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3 shrink-0" />
                {arrivalDate}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3 shrink-0" />
              Adquirido por: <span className="font-medium">{claimerName}</span>
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              <Lock className="h-3 w-3" />
              Bloqueado
            </div>
            {isOwned && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleResendEmail}
                disabled={isSending}
              >
                {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                Reenviar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
