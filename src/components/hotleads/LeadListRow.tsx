import { useState } from 'react';
import { MapPin, Calendar, ShoppingCart, Timer, Eye, EyeOff, Phone, Mail, Lock, User, CheckCircle2, XCircle, Clock, Loader2, Undo2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HotLead, LeadOutcome } from '@/hooks/useHotLeads';

function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, i) => {
    if (i === 0) return part;
    if (part.length <= 3) return part.charAt(0) + '***';
    return part.substring(0, 3) + '***';
  }).join(' ');
}

const OUTCOME_CONFIG: Record<LeadOutcome, { label: string; icon: typeof CheckCircle2; color: string }> = {
  vendido: { label: 'Vendido', icon: CheckCircle2, color: 'text-green-600' },
  descartado: { label: 'Descartado', icon: XCircle, color: 'text-red-500' },
  em_atendimento: { label: 'Em Atendimento', icon: Clock, color: 'text-blue-500' },
};

interface LeadListRowProps {
  lead: HotLead;
  variant: 'available' | 'mine' | 'lost';
  selected?: boolean;
  onSelect?: (id: string) => void;
  onAcquire?: (lead: HotLead) => void;
  cooldownRemaining?: number;
  formatCooldown?: (seconds: number) => string;
  claimerName?: string;
  onRelease?: (leadId: string) => void;
  onUpdateOutcome?: (leadId: string, outcome: LeadOutcome) => Promise<boolean>;
}

export function LeadListRow({
  lead,
  variant,
  selected,
  onSelect,
  onAcquire,
  cooldownRemaining = 0,
  formatCooldown,
  claimerName,
  onRelease,
  onUpdateOutcome,
}: LeadListRowProps) {
  const { isAdmin, user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState<LeadOutcome | null>(null);

  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  const dateToShow = lead.available_at || lead.created_at;
  const arrivalDate = dateToShow ? format(new Date(dateToShow), 'dd/MM/yyyy') : null;
  const isOwned = variant === 'mine';

  const handleResendEmail = async () => {
    if (!user?.email) return;
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-resend', {
        body: { lead_id: lead.id, user_email: user.email },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success('E-mail reenviado!');
    } catch {
      toast.error('Erro ao reenviar.');
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

  const accentColor = variant === 'available' ? 'border-l-green-500' : variant === 'mine' ? 'border-l-blue-500' : 'border-l-red-400';

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 border-b border-border/40 hover:bg-muted/30 transition-colors border-l-2 ${accentColor}`}>
      {/* Checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelect?.(lead.id)}
        className="shrink-0"
      />

      {/* Avatar */}
      <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{expanded ? lead.name : maskedName}</span>
          {isAdmin && (
            <button onClick={() => setExpanded(!expanded)} className="shrink-0">
              {expanded ? <EyeOff className="h-3 w-3 text-orange-500" /> : <Eye className="h-3 w-3 text-amber-500" />}
            </button>
          )}
          {lead.lead_outcome && (() => {
            const cfg = OUTCOME_CONFIG[lead.lead_outcome];
            const Icon = cfg.icon;
            return <Badge variant="outline" className={`${cfg.color} text-[10px] gap-0.5 py-0 h-5`}><Icon className="h-2.5 w-2.5" />{cfg.label}</Badge>;
          })()}
        </div>
        {expanded && isAdmin && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            {lead.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{lead.phone}</span>}
            {lead.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{lead.email}</span>}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground w-[160px] shrink-0">
        <MapPin className="h-3 w-3 shrink-0 text-green-500" />
        <span className="truncate">{location || '—'}</span>
      </div>

      {/* Date */}
      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground w-[100px] shrink-0">
        <Calendar className="h-3 w-3 shrink-0" />
        {arrivalDate || '—'}
      </div>

      {/* Claimer (lost tab) */}
      {variant === 'lost' && claimerName && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground w-[120px] shrink-0">
          <Lock className="h-3 w-3" />
          <span className="truncate">{claimerName}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {variant === 'available' && (
          cooldownRemaining > 0 ? (
            <Button size="sm" disabled className="h-7 text-[11px] gap-1 bg-muted text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatCooldown ? formatCooldown(cooldownRemaining) : `${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, '0')}`}
            </Button>
          ) : (
            <Button size="sm" onClick={() => onAcquire?.(lead)} className="h-7 text-[11px] gap-1 bg-green-600 hover:bg-green-700 text-white">
              <ShoppingCart className="h-3 w-3" />
              Adquirir
            </Button>
          )
        )}
        {isOwned && (
          <>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={handleResendEmail} disabled={isSending}>
              {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
              Reenviar
            </Button>
            {!lead.lead_outcome && onUpdateOutcome && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-0.5 text-green-600 border-green-200" onClick={() => handleOutcome('vendido')} disabled={isUpdating !== null}>
                  {isUpdating === 'vendido' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-0.5 text-blue-500 border-blue-200" onClick={() => handleOutcome('em_atendimento')} disabled={isUpdating !== null}>
                  {isUpdating === 'em_atendimento' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-0.5 text-red-500 border-red-200" onClick={() => handleOutcome('descartado')} disabled={isUpdating !== null}>
                  {isUpdating === 'descartado' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                </Button>
              </>
            )}
          </>
        )}
        {isAdmin && onRelease && (
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 text-orange-600 border-orange-200" onClick={() => onRelease(lead.id)}>
            <Undo2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
