import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ label, value, change, changeLabel, icon, className }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className={cn("p-4 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {change !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          {isPositive && <TrendingUp className="h-3 w-3 text-emerald-500" />}
          {isNegative && <TrendingDown className="h-3 w-3 text-red-500" />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3 text-muted-foreground" />}
          <span className={cn(
            isPositive && 'text-emerald-500',
            isNegative && 'text-red-500',
            !isPositive && !isNegative && 'text-muted-foreground',
          )}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
        </div>
      )}
    </Card>
  );
}
