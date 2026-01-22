import { Button } from '@/components/ui/button';
import { useDashboardPeriod, PeriodType, periodOptions } from '@/contexts/DashboardPeriodContext';
import { Calendar, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMetricAlerts } from '@/hooks/useMetricAlerts';

const periods: { value: PeriodType; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' }
];

export function DashboardPeriodSelector() {
  const { period, setPeriod } = useDashboardPeriod();
  const { alerts } = useMetricAlerts();
  
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.is_active).length;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Período:</span>
        <div className="flex bg-muted rounded-lg p-0.5">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "h-7 px-3 text-xs font-medium rounded-md transition-all",
                period === p.value 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {criticalAlerts > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-lg border border-destructive/20">
          <Bell className="h-4 w-4 text-destructive animate-pulse" />
          <span className="text-xs font-medium text-destructive">
            {criticalAlerts} alerta{criticalAlerts > 1 ? 's' : ''} crítico{criticalAlerts > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}