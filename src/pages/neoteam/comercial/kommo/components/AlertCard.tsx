import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KommoAlert } from '../types';

const ALERT_STYLES = {
  danger: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: AlertCircle, iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: Info, iconColor: 'text-blue-500' },
};

export function AlertCard({ alert }: { alert: KommoAlert }) {
  const style = ALERT_STYLES[alert.type];
  const Icon = style.icon;

  return (
    <div className={cn('rounded-lg border p-3 flex gap-3', style.bg, style.border)}>
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', style.iconColor)} />
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium leading-tight">{alert.title}</p>
        <p className="text-xs text-muted-foreground">{alert.description}</p>
      </div>
    </div>
  );
}
