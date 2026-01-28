/**
 * DashboardPriorityList - Lista de prioridades com cores por nível
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

interface PriorityItem {
  level: PriorityLevel;
  count: number;
}

interface DashboardPriorityListProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  items: PriorityItem[];
  className?: string;
}

const priorityConfig: Record<PriorityLevel, {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  badge: string;
}> = {
  urgent: {
    label: 'Urgente',
    icon: AlertCircle,
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500 text-white',
  },
  high: {
    label: 'Alta',
    icon: ArrowUp,
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500 text-white',
  },
  normal: {
    label: 'Normal',
    icon: Minus,
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-400 text-white',
  },
  low: {
    label: 'Baixa',
    icon: ArrowDown,
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
};

export function DashboardPriorityList({
  icon: Icon,
  title,
  subtitle,
  items,
  className,
}: DashboardPriorityListProps) {
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

      {/* Lista de prioridades */}
      <div className="space-y-2">
        {items.map((item) => {
          const config = priorityConfig[item.level];
          const ItemIcon = config.icon;

          return (
            <div
              key={item.level}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                config.bg
              )}
            >
              <div className={cn('flex items-center gap-2', config.text)}>
                <ItemIcon className="h-4 w-4" />
                <span className="font-medium">{config.label}</span>
              </div>
              <span className={cn(
                'text-sm font-semibold px-2.5 py-0.5 rounded-full',
                config.badge
              )}>
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
