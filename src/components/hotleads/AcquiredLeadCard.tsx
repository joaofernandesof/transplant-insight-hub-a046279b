import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, User, Calendar, Mail, Loader2, Undo2, Eye, EyeOff, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { HotLead } from '@/hooks/useHotLeads';

interface AcquiredLeadCardProps {
  lead: HotLead;
  claimerName: string;
  isOwned?: boolean;
  onRelease?: (leadId: string) => void;
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

export function AcquiredLeadCard({ lead, claimerName, isOwned, onRelease }: AcquiredLeadCardProps) {
  const { user, isAdmin } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  
  const dateToShow = lead.available_at || lead.created_at;
  const arrivalDate = dateToShow
    ? format(new Date(dateToShow), "dd/MM/yyyy")
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
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm truncate">{expanded ? lead.name : maskedName}</h3>
              {isAdmin && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="shrink-0 transition-colors"
                  title={expanded ? 'Ocultar dados' : 'Ver dados completos (admin)'}
                >
                  {expanded ? <EyeOff className="h-4 w-4 text-orange-500" /> : <Eye className="h-4 w-4 text-amber-500 hover:text-amber-600" />}
                </button>
              )}
            </div>
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
            {expanded && isAdmin && (
              <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                {lead.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" />
                    {lead.phone}
                  </p>
                )}
                {lead.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0" />
                    {lead.email}
                  </p>
                )}
                {lead.tags && lead.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tags: {lead.tags.join(', ')}
                  </p>
                )}
              </div>
            )}
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
            {isAdmin && onRelease && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                onClick={() => onRelease(lead.id)}
              >
                <Undo2 className="h-3 w-3" />
                Devolver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
