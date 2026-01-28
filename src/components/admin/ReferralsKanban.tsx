/**
 * Referrals Kanban - Styled Kanban for referral management
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Send,
  Calendar,
  User,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import { StyledKanban, StyledKanbanCard, KanbanColumn } from '@/components/shared/StyledKanban';
import type { UnifiedReferral } from './ReferralsTable';

interface ReferralsKanbanProps {
  referrals: UnifiedReferral[];
  onStatusChange: (referral: UnifiedReferral, newStatus: string) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  onOpenDetails: (referral: UnifiedReferral) => void;
}

const KANBAN_COLUMNS_CONFIG = [
  { 
    key: 'new_referral', 
    label: 'Nova Indicação', 
    subtitle: 'Aguardando contato',
    color: 'from-amber-500 to-amber-600',
    statusColor: 'bg-amber-500'
  },
  { 
    key: 'negotiating', 
    label: 'Em Negociação', 
    subtitle: 'Conversando',
    color: 'from-blue-500 to-blue-600',
    statusColor: 'bg-blue-500'
  },
  { 
    key: 'deposit_paid', 
    label: 'Sinal Pago', 
    subtitle: 'Aguardando quitação',
    color: 'from-purple-500 to-purple-600',
    statusColor: 'bg-purple-500'
  },
  { 
    key: 'paid_off', 
    label: 'Quitado', 
    subtitle: 'Concluído',
    color: 'from-emerald-500 to-emerald-600',
    statusColor: 'bg-emerald-500'
  }
];

export function ReferralsKanban({ 
  referrals, 
  onStatusChange, 
  onOpenWhatsApp,
  onOpenDetails 
}: ReferralsKanbanProps) {
  // Map pending to new_referral for legacy
  const normalizedReferrals = referrals.map(r => ({
    ...r,
    status: r.status === 'pending' ? 'new_referral' : r.status
  }));

  const columns: KanbanColumn<UnifiedReferral>[] = useMemo(() => {
    return KANBAN_COLUMNS_CONFIG.map(col => ({
      id: col.key,
      title: col.label,
      subtitle: col.subtitle,
      items: normalizedReferrals.filter(r => r.status === col.key),
      color: col.color,
      statusColor: col.statusColor,
    }));
  }, [normalizedReferrals]);

  const renderCard = (referral: UnifiedReferral) => (
    <StyledKanbanCard key={referral.id} onClick={() => onOpenDetails(referral)}>
      <div className="space-y-2">
        {/* Name & Source */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate max-w-[140px]">
              {referral.name}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {referral.source === 'student' ? 'Aluno' : 'Indicação'}
          </Badge>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{referral.email}</span>
        </div>

        {/* Referrer */}
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground/70">Por:</span>{' '}
          <span className="font-medium">{referral.referrer_name}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(referral.created_at), 'dd/MM/yy', { locale: ptBR })}
        </div>

        {/* Actions */}
        <div className="flex gap-1 pt-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onOpenWhatsApp(referral.phone, referral.name)}
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Send className="h-3.5 w-3.5 text-blue-600" />
          </Button>
        </div>
      </div>
    </StyledKanbanCard>
  );

  return (
    <StyledKanban
      columns={columns}
      renderCard={renderCard}
      renderEmptyState={() => (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Nenhuma indicação
        </div>
      )}
    />
  );
}
