import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, User, Calendar, Mail, Loader2, Undo2, Eye, EyeOff, Phone, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import type { HotLead, LeadOutcome } from '@/hooks/useHotLeads';

interface AcquiredLeadCardProps {
  lead: HotLead;
  claimerName: string;
  isOwned?: boolean;
  onRelease?: (leadId: string) => void;
  onUpdateOutcome?: (leadId: string, outcome: LeadOutcome) => Promise<boolean>;
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

const OVERDUE_DAYS = 7;

function isOverdue(lead: HotLead): boolean {
  if (lead.lead_outcome) return false;
  const claimedTime = lead.claimed_at ? new Date(lead.claimed_at).getTime() : new Date(lead.created_at).getTime();
  return claimedTime < Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000;
}

function getDaysRemaining(lead: HotLead): number | null {
  if (lead.lead_outcome) return null;
  const claimedTime = lead.claimed_at ? new Date(lead.claimed_at).getTime() : new Date(lead.created_at).getTime();
  const deadline = claimedTime + OVERDUE_DAYS * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));
  return remaining;
}

const OUTCOME_CONFIG: Record<LeadOutcome, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  vendido: { label: 'Vendido', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' },
  descartado: { label: 'Descartado', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800' },
  em_atendimento: { label: 'Em Atendimento', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
};

export function AcquiredLeadCard({ lead, claimerName, isOwned, onRelease, onUpdateOutcome }: AcquiredLeadCardProps) {
  const { user, isAdmin } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState<LeadOutcome | null>(null);
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  const overdue = isOwned && isOverdue(lead);
  const daysLeft = isOwned ? getDaysRemaining(lead) : null;
  
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

  const handleOutcome = async (outcome: LeadOutcome) => {
    if (!onUpdateOutcome) return;
    setIsUpdating(outcome);
    await onUpdateOutcome(lead.id, outcome);
    setIsUpdating(null);
  };

  return (
    <Card className={`border-l-4 ${overdue ? 'border-l-amber-500 ring-1 ring-amber-300' : isOwned ? 'border-l-blue-500' : 'border-l-red-300 opacity-75'}`}>
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

            {/* Outcome badge if already set */}
            {lead.lead_outcome && (
              <div className="mt-2">
                {(() => {
                  const cfg = OUTCOME_CONFIG[lead.lead_outcome];
                  const Icon = cfg.icon;
                  return (
                    <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} text-xs gap-1`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  );
                })()}
              </div>
            )}

            {/* Overdue warning */}
            {overdue && !lead.lead_outcome && (
              <div className="mt-2 flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Informe o destino deste lead!</span>
              </div>
            )}

            {/* Days remaining warning */}
            {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && !lead.lead_outcome && (
              <p className="text-xs text-amber-500 mt-1">
                ⏳ {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'} para informar destino
              </p>
            )}

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

        {/* Outcome action buttons - only for owned leads without outcome */}
        {isOwned && !lead.lead_outcome && onUpdateOutcome && (
          <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 flex-1"
              onClick={() => handleOutcome('vendido')}
              disabled={isUpdating !== null}
            >
              {isUpdating === 'vendido' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Vendido
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 border-blue-200 flex-1"
              onClick={() => handleOutcome('em_atendimento')}
              disabled={isUpdating !== null}
            >
              {isUpdating === 'em_atendimento' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
              Em Atendimento
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 flex-1"
              onClick={() => handleOutcome('descartado')}
              disabled={isUpdating !== null}
            >
              {isUpdating === 'descartado' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              Descartado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
