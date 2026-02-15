import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, Calendar, Mail, Loader2, Undo2, Eye, EyeOff, Phone, CheckCircle2, XCircle, Clock, AlertTriangle, User } from 'lucide-react';
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

const OUTCOME_CONFIG: Record<LeadOutcome, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string; accentColor: string }> = {
  vendido: { label: 'Vendido', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800', accentColor: 'from-green-400 to-emerald-500' },
  descartado: { label: 'Descartado', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800', accentColor: 'from-red-400 to-rose-500' },
  em_atendimento: { label: 'Em Atendimento', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800', accentColor: 'from-blue-400 to-cyan-500' },
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

  const accentGradient = lead.lead_outcome
    ? OUTCOME_CONFIG[lead.lead_outcome].accentColor
    : overdue
      ? 'from-amber-400 to-orange-500'
      : isOwned
        ? 'from-blue-400 to-indigo-500'
        : 'from-red-300 to-rose-400';

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
    <Card className={`group border border-border/60 transition-all duration-200 overflow-hidden ${overdue ? 'ring-1 ring-amber-300 border-amber-300/60' : ''} ${!isOwned ? 'opacity-75' : 'hover:shadow-lg'}`}>
      <CardContent className="p-0">
        {/* Top accent bar */}
        <div className={`h-1 bg-gradient-to-r ${accentGradient}`} />

        <div className="p-4">
          {/* Avatar + Name row */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center border-2 ${
              isOwned ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' : 'bg-muted border-border'
            }`}>
              <User className={`h-5 w-5 ${isOwned ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm truncate">{expanded ? lead.name : maskedName}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0 transition-colors"
                    title={expanded ? 'Ocultar dados' : 'Ver dados completos (admin)'}
                  >
                    {expanded ? <EyeOff className="h-3.5 w-3.5 text-orange-500" /> : <Eye className="h-3.5 w-3.5 text-amber-500 hover:text-amber-600" />}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">por {claimerName}</p>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Lock className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-1.5 mb-3">
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-blue-500" />
                {location}
              </p>
            )}
            {arrivalDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-blue-500" />
                {arrivalDate}
              </p>
            )}
          </div>

          {/* Outcome badge */}
          {lead.lead_outcome && (() => {
            const cfg = OUTCOME_CONFIG[lead.lead_outcome];
            const Icon = cfg.icon;
            return (
              <Badge variant="outline" className={`${cfg.bgColor} ${cfg.color} text-xs gap-1 mb-3`}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </Badge>
            );
          })()}

          {/* Overdue warning */}
          {overdue && !lead.lead_outcome && (
            <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Informe o destino!</span>
            </div>
          )}

          {/* Days remaining warning */}
          {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && !lead.lead_outcome && (
            <p className="text-[11px] text-amber-500 mb-3">
              ⏳ {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
            </p>
          )}

          {/* Admin expanded info */}
          {expanded && isAdmin && (
            <div className="mb-3 pt-2 border-t border-dashed space-y-1">
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

          {/* Action buttons row */}
          <div className="flex gap-1.5">
            {isOwned && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1 flex-1"
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
                className="h-7 text-[11px] gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                onClick={() => onRelease(lead.id)}
              >
                <Undo2 className="h-3 w-3" />
                Devolver
              </Button>
            )}
          </div>

          {/* Outcome action buttons */}
          {isOwned && !lead.lead_outcome && onUpdateOutcome && (
            <div className="mt-2 pt-2 border-t flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 flex-1"
                onClick={() => handleOutcome('vendido')}
                disabled={isUpdating !== null}
              >
                {isUpdating === 'vendido' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Vendido
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 border-blue-200 flex-1"
                onClick={() => handleOutcome('em_atendimento')}
                disabled={isUpdating !== null}
              >
                {isUpdating === 'em_atendimento' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                Atendendo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 flex-1"
                onClick={() => handleOutcome('descartado')}
                disabled={isUpdating !== null}
              >
                {isUpdating === 'descartado' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                Descartado
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
