import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Gift,
  Phone,
  DollarSign,
  CheckCircle,
  MessageCircle,
  Send,
  Calendar,
  User,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UnifiedReferral } from './ReferralsTable';

interface ReferralsKanbanProps {
  referrals: UnifiedReferral[];
  onStatusChange: (referral: UnifiedReferral, newStatus: string) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  onOpenDetails: (referral: UnifiedReferral) => void;
}

const KANBAN_COLUMNS = [
  { 
    key: 'new_referral', 
    label: 'Nova Indicação', 
    icon: Gift,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
  },
  { 
    key: 'negotiating', 
    label: 'Em Negociação', 
    icon: Phone,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
  },
  { 
    key: 'deposit_paid', 
    label: 'Sinal Pago', 
    icon: DollarSign,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
  },
  { 
    key: 'paid_off', 
    label: 'Quitado', 
    icon: CheckCircle,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
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

  const getColumnReferrals = (status: string) => {
    return normalizedReferrals.filter(r => r.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {KANBAN_COLUMNS.map(column => {
        const columnReferrals = getColumnReferrals(column.key);
        const Icon = column.icon;
        
        return (
          <div key={column.key} className={`rounded-xl border ${column.bgColor} p-3`}>
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`${column.color} rounded-full p-1.5`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">{column.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {columnReferrals.length}
              </Badge>
            </div>

            {/* Cards */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-2">
                {columnReferrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Nenhuma indicação
                  </div>
                ) : (
                  columnReferrals.map(referral => (
                    <Card 
                      key={referral.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow bg-card"
                      onClick={() => onOpenDetails(referral)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Name & Source */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm truncate max-w-[140px]">
                              {referral.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {referral.source === 'student' ? 'Ind.' : 'Indic.'}
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
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
