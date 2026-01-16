import React from 'react';
import { MetricStatus } from '@/data/metricsData';
import { getStatusIcon, getStatusLabel } from '@/utils/metricCalculations';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MetricStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, showLabel = true, size = 'md' }: StatusBadgeProps) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  
  const statusClasses: Record<MetricStatus, string> = {
    bad: 'status-bad',
    medium: 'status-medium',
    good: 'status-good',
    great: 'status-great'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };
  
  return (
    <span className={cn(
      'status-badge',
      statusClasses[status] || '',
      sizeClasses[size]
    )}>
      <span>{getStatusIcon(status)}</span>
      {showLabel && <span>{getStatusLabel(status)}</span>}
    </span>
  );
}
