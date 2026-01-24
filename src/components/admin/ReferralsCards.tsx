import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Gift,
  Phone,
  DollarSign,
  CheckCircle,
  MessageCircle,
  Send,
  Calendar,
  User,
  Mail,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UnifiedReferral } from './ReferralsTable';

interface ReferralsCardsProps {
  referrals: UnifiedReferral[];
  onStatusChange: (referral: UnifiedReferral, newStatus: string) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  onOpenDetails: (referral: UnifiedReferral) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  new_referral: { 
    label: 'Nova Indicação', 
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    icon: <Gift className="h-3.5 w-3.5" />
  },
  negotiating: { 
    label: 'Em negociação', 
    color: 'text-blue-700 dark:text-blue-400', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: <Phone className="h-3.5 w-3.5" />
  },
  deposit_paid: { 
    label: 'Sinal Pago', 
    color: 'text-purple-700 dark:text-purple-400', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    icon: <DollarSign className="h-3.5 w-3.5" />
  },
  paid_off: { 
    label: 'Quitado', 
    color: 'text-emerald-700 dark:text-emerald-400', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle className="h-3.5 w-3.5" />
  },
  pending: { 
    label: 'Nova Indicação', 
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    icon: <Gift className="h-3.5 w-3.5" />
  }
};

const COURSE_VALUE = 35000;
const INDICADOR_COMMISSION_RATE = 0.05;
const INDICADO_DISCOUNT_RATE = 0.05;

export function ReferralsCards({ 
  referrals, 
  onStatusChange, 
  onOpenWhatsApp,
  onOpenDetails 
}: ReferralsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateGains = (referral: UnifiedReferral) => {
    const isPaidOff = referral.status === 'paid_off';
    const baseValue = referral.converted_value || COURSE_VALUE;
    return {
      indicador: isPaidOff ? baseValue * INDICADOR_COMMISSION_RATE : 0,
      indicado: isPaidOff ? baseValue * INDICADO_DISCOUNT_RATE : 0,
    };
  };

  if (referrals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma indicação encontrada</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {referrals.map(referral => {
        const status = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
        const gains = calculateGains(referral);
        
        return (
          <Card 
            key={referral.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-l-4"
            style={{ borderLeftColor: referral.status === 'paid_off' ? '#10b981' : 
                     referral.status === 'deposit_paid' ? '#8b5cf6' :
                     referral.status === 'negotiating' ? '#3b82f6' : '#f59e0b' }}
            onClick={() => onOpenDetails(referral)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: Name + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{referral.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{referral.email}</p>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={`${status.bgColor} ${status.color} shrink-0 text-[10px] gap-1`}
                >
                  {status.icon}
                  <span className="hidden sm:inline">{status.label}</span>
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{referral.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">Por: <strong>{referral.referrer_name}</strong></span>
                </div>
              </div>

              {/* Gains */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground">Ganho Ind.</p>
                  <p className={`text-xs font-bold ${gains.indicador > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {gains.indicador > 0 ? formatCurrency(gains.indicador) : '5%'}
                  </p>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground">Desc. Ind.</p>
                  <p className={`text-xs font-bold ${gains.indicado > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    {gains.indicado > 0 ? formatCurrency(gains.indicado) : '5%'}
                  </p>
                </div>
              </div>

              {/* Footer: Date + Actions */}
              <div className="flex items-center justify-between pt-2 border-t" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(referral.created_at), 'dd/MM/yy', { locale: ptBR })}
                </div>
                <div className="flex gap-1">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
