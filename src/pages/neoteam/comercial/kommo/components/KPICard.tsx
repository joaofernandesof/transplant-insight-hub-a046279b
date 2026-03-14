import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type KPIColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'orange' | 'pink';

const COLOR_MAP: Record<KPIColor, { bg: string; border: string; iconBg: string; iconText: string; accent: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-200/60 dark:border-blue-800/40',    iconBg: 'bg-blue-500',    iconText: 'text-white', accent: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200/60 dark:border-emerald-800/40', iconBg: 'bg-emerald-500', iconText: 'text-white', accent: 'text-emerald-600 dark:text-emerald-400' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/30',  border: 'border-violet-200/60 dark:border-violet-800/40',  iconBg: 'bg-violet-500',  iconText: 'text-white', accent: 'text-violet-600 dark:text-violet-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-200/60 dark:border-amber-800/40',   iconBg: 'bg-amber-500',   iconText: 'text-white', accent: 'text-amber-600 dark:text-amber-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/30',    border: 'border-rose-200/60 dark:border-rose-800/40',    iconBg: 'bg-rose-500',    iconText: 'text-white', accent: 'text-rose-600 dark:text-rose-400' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-950/30',    border: 'border-cyan-200/60 dark:border-cyan-800/40',    iconBg: 'bg-cyan-500',    iconText: 'text-white', accent: 'text-cyan-600 dark:text-cyan-400' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/30',  border: 'border-orange-200/60 dark:border-orange-800/40',  iconBg: 'bg-orange-500',  iconText: 'text-white', accent: 'text-orange-600 dark:text-orange-400' },
  pink:    { bg: 'bg-pink-50 dark:bg-pink-950/30',    border: 'border-pink-200/60 dark:border-pink-800/40',    iconBg: 'bg-pink-500',    iconText: 'text-white', accent: 'text-pink-600 dark:text-pink-400' },
};

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: KPIColor;
  insight?: string;
  className?: string;
}

export function KPICard({ label, value, change, changeLabel, icon, color = 'blue', insight, className }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const c = COLOR_MAP[color];

  return (
    <Card className={cn('relative overflow-hidden border p-4 space-y-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5', c.bg, c.border, className)}>
      {/* Decorative accent bar */}
      <div className={cn('absolute top-0 left-0 w-full h-1', c.iconBg)} />

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && (
          <span className={cn('flex items-center justify-center h-7 w-7 rounded-lg shadow-sm', c.iconBg, c.iconText)}>
            {icon}
          </span>
        )}
      </div>

      <div className={cn('text-2xl font-bold tracking-tight', c.accent)}>{value}</div>

      {change !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          {isPositive && <TrendingUp className="h-3 w-3 text-emerald-500" />}
          {isNegative && <TrendingDown className="h-3 w-3 text-rose-500" />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3 text-muted-foreground" />}
          <span className={cn(
            isPositive && 'text-emerald-600 font-semibold',
            isNegative && 'text-rose-600 font-semibold',
            !isPositive && !isNegative && 'text-muted-foreground',
          )}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
        </div>
      )}

      {insight && (
        <p className="text-[11px] leading-tight text-muted-foreground/80 italic border-t border-dashed border-current/10 pt-1.5 mt-1">
          💡 {insight}
        </p>
      )}
    </Card>
  );
}
