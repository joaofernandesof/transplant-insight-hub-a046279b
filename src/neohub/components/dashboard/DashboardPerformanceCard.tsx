/**
 * DashboardPerformanceCard - Card de performance com barras de progresso
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PerformanceItem {
  id: string;
  name: string;
  current: number;
  total: number;
  overdueCount?: number;
}

interface DashboardPerformanceCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  items: PerformanceItem[];
  className?: string;
  emptyMessage?: string;
}

export function DashboardPerformanceCard({
  icon: Icon,
  title,
  subtitle,
  items,
  className,
  emptyMessage = 'Nenhum dado disponível',
}: DashboardPerformanceCardProps) {
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

      {/* Lista de performance */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          items.map((item) => {
            const percentage = item.total > 0 
              ? Math.round((item.current / item.total) * 100) 
              : 0;

            return (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.overdueCount !== undefined && item.overdueCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {item.overdueCount} atrasado{item.overdueCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {item.current}/{item.total}
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
