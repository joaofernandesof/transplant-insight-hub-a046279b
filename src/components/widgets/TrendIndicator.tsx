import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  current: number;
  previous: number;
  format?: 'percent' | 'value' | 'currency';
  invertColors?: boolean; // For metrics where down is good (e.g., costs)
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export function TrendIndicator({ 
  current, 
  previous, 
  format = 'percent',
  invertColors = false,
  showValue = true,
  size = 'sm'
}: TrendIndicatorProps) {
  if (previous === 0 && current === 0) {
    return (
      <div className="flex items-center gap-0.5 text-muted-foreground">
        <Minus className={cn("shrink-0", size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
        <span className={cn(size === 'sm' ? "text-[10px]" : "text-xs")}>--</span>
      </div>
    );
  }

  const percentChange = previous > 0 
    ? ((current - previous) / previous) * 100 
    : current > 0 ? 100 : 0;
  
  const valueChange = current - previous;
  const isUp = percentChange > 0;
  const isNeutral = percentChange === 0;

  const isPositive = invertColors ? !isUp : isUp;
  const TrendIcon = isUp ? TrendingUp : isNeutral ? Minus : TrendingDown;

  const formatValue = () => {
    if (format === 'percent') {
      return `${Math.abs(percentChange).toFixed(0)}%`;
    }
    if (format === 'currency') {
      const absValue = Math.abs(valueChange);
      if (absValue >= 1000000) return `R$ ${(absValue / 1000000).toFixed(1)}M`;
      if (absValue >= 1000) return `R$ ${(absValue / 1000).toFixed(0)}k`;
      return `R$ ${absValue.toFixed(0)}`;
    }
    return Math.abs(valueChange).toFixed(0);
  };

  return (
    <div className={cn(
      "flex items-center gap-0.5",
      isNeutral && "text-muted-foreground",
      !isNeutral && isPositive && "text-emerald-600 dark:text-emerald-500",
      !isNeutral && !isPositive && "text-destructive"
    )}>
      <TrendIcon className={cn("shrink-0", size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
      {showValue && (
        <span className={cn("font-medium", size === 'sm' ? "text-[10px]" : "text-xs")}>
          {isUp && '+'}{formatValue()}
        </span>
      )}
    </div>
  );
}