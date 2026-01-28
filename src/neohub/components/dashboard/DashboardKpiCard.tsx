/**
 * DashboardKpiCard - Card de KPI padronizado para dashboards do NeoTeam
 * Segue a linguagem visual amigável e consistente
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type KpiVariant = 'default' | 'warning' | 'success' | 'info';

interface DashboardKpiCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  badge?: string;
  badgeVariant?: 'default' | 'warning' | 'success' | 'info';
  variant?: KpiVariant;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<KpiVariant, { 
  card: string; 
  icon: string; 
  value: string;
  iconBg: string;
}> = {
  default: {
    card: 'border-border bg-card hover:border-primary/30',
    icon: 'text-muted-foreground',
    iconBg: 'bg-muted',
    value: 'text-foreground',
  },
  warning: {
    card: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 hover:border-red-300',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    value: 'text-red-600 dark:text-red-400',
  },
  success: {
    card: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 hover:border-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    card: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 hover:border-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    value: 'text-amber-600 dark:text-amber-400',
  },
};

const badgeStyles: Record<string, string> = {
  default: 'bg-muted text-muted-foreground',
  warning: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
  info: 'bg-amber-500 text-white',
};

export function DashboardKpiCard({
  icon: Icon,
  value,
  label,
  badge,
  badgeVariant = 'default',
  variant = 'default',
  onClick,
  className,
}: DashboardKpiCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        onClick && 'cursor-pointer',
        styles.card,
        className
      )}
      onClick={onClick}
    >
      {/* Header com ícone e badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-2 rounded-lg', styles.iconBg)}>
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
        {badge && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            badgeStyles[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </div>

      {/* Valor grande */}
      <div className={cn('text-3xl font-bold mb-1', styles.value)}>
        {value}
      </div>

      {/* Label */}
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
