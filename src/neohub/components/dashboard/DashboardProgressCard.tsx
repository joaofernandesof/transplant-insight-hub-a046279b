/**
 * DashboardProgressCard - Card de progresso com métricas detalhadas
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressMetric {
  value: number;
  label: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

interface DashboardProgressCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  metrics?: ProgressMetric[];
  className?: string;
}

const metricColors: Record<string, string> = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function DashboardProgressCard({
  icon: Icon,
  title,
  subtitle,
  current,
  total,
  metrics,
  className,
}: DashboardProgressCardProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

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

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {current} de {total} tarefas concluídas
          </span>
          <span className="font-medium text-foreground">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {/* Métricas em grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={cn(
                'text-xl font-bold',
                metricColors[metric.color || 'default']
              )}>
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
