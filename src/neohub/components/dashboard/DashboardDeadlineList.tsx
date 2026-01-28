/**
 * DashboardDeadlineList - Lista de prazos e itens atrasados
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type DeadlineStatus = 'overdue' | 'today' | 'upcoming' | 'done';

interface DeadlineItem {
  id: string;
  title: string;
  status: DeadlineStatus;
  dueDate?: string;
  onClick?: () => void;
}

interface DashboardDeadlineListProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  items: DeadlineItem[];
  maxItems?: number;
  className?: string;
  emptyMessage?: string;
}

const statusConfig: Record<DeadlineStatus, {
  bg: string;
  badge: string;
  badgeLabel: string;
  icon: LucideIcon;
  iconColor: string;
}> = {
  overdue: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    badge: 'bg-red-500 text-white hover:bg-red-600',
    badgeLabel: 'Atrasado',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  today: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    badge: 'bg-amber-500 text-white hover:bg-amber-600',
    badgeLabel: 'Hoje',
    icon: Clock,
    iconColor: 'text-amber-500',
  },
  upcoming: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'bg-blue-500 text-white hover:bg-blue-600',
    badgeLabel: 'Próximo',
    icon: Clock,
    iconColor: 'text-blue-500',
  },
  done: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    badge: 'bg-emerald-500 text-white hover:bg-emerald-600',
    badgeLabel: 'Concluído',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
};

export function DashboardDeadlineList({
  icon: Icon,
  title,
  subtitle,
  items,
  maxItems = 5,
  className,
  emptyMessage = 'Nenhum item encontrado',
}: DashboardDeadlineListProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}

      {/* Lista de itens */}
      <div className="space-y-2">
        {displayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          displayItems.map((item) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg transition-colors',
                  config.bg,
                  item.onClick && 'cursor-pointer hover:opacity-80'
                )}
                onClick={item.onClick}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <StatusIcon className={cn('h-4 w-4 shrink-0', config.iconColor)} />
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </span>
                </div>
                <Badge className={cn('shrink-0 ml-2', config.badge)}>
                  {config.badgeLabel}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      {/* Mostrar mais se houver mais itens */}
      {items.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          +{items.length - maxItems} itens adicionais
        </p>
      )}
    </div>
  );
}
