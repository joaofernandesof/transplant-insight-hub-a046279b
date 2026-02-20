import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HeartPulse,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Timer,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueStats {
  waiting: number;
  active: number;
  completed_1h: number;
  failed_1h: number;
  stalled: number;
  avg_processing_ms: number;
  throughput_per_min: number;
  total_today: number;
}

type HealthStatus = 'healthy' | 'degraded' | 'critical';

function getHealthStatus(stats: QueueStats): HealthStatus {
  if (stats.stalled > 0 || stats.failed_1h > 5 || stats.waiting > 50) return 'critical';
  if (stats.waiting >= 10 || stats.failed_1h > 0) return 'degraded';
  return 'healthy';
}

const STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; border: string; bg: string }> = {
  healthy: {
    label: 'Saudável',
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
  },
  degraded: {
    label: 'Degradado',
    color: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
  },
  critical: {
    label: 'Crítico',
    color: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/50',
    bg: 'bg-red-500/10',
  },
};

export function QueueHealthWidget() {
  // Check if super admin
  const { data: isSuperAdmin } = useQuery({
    queryKey: ['avivar-is-super-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.rpc('is_avivar_super_admin', { _user_id: user.id });
      return !!data;
    },
    staleTime: 60 * 60 * 1000, // 1h
  });

  // Fetch queue stats (only if super admin)
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['avivar-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('avivar_queue_stats');
      if (error) throw error;
      return (data as unknown) as QueueStats;
    },
    enabled: !!isSuperAdmin,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  if (!isSuperAdmin) return null;

  const status = stats ? getHealthStatus(stats) : 'healthy';
  const config = STATUS_CONFIG[status];

  const metrics = stats
    ? [
        { icon: Clock, label: 'Aguardando', value: stats.waiting },
        { icon: Zap, label: 'Ativos', value: stats.active },
        { icon: CheckCircle2, label: 'Completos (1h)', value: stats.completed_1h },
        { icon: XCircle, label: 'Falhados (1h)', value: stats.failed_1h },
        { icon: AlertTriangle, label: 'Parados', value: stats.stalled },
        { icon: Timer, label: 'Tempo Médio', value: `${Math.round(stats.avg_processing_ms)}ms` },
        { icon: Activity, label: 'Throughput', value: `${stats.throughput_per_min.toFixed(1)}/min` },
        { icon: BarChart3, label: 'Total Hoje', value: stats.total_today },
      ]
    : [];

  // Throughput progress (relative to ~30 jobs/min max capacity)
  const throughputPercent = stats ? Math.min((stats.throughput_per_min / 30) * 100, 100) : 0;

  return (
    <Card className={cn('bg-[hsl(var(--avivar-card))] border-2 relative overflow-hidden', config.border)}>
      <div className={cn('absolute top-0 left-0 w-full h-1', status === 'healthy' ? 'bg-emerald-500' : status === 'degraded' ? 'bg-amber-500' : 'bg-red-500')} />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className={cn('h-5 w-5', config.color)} />
            <span className="font-semibold text-sm text-[hsl(var(--avivar-foreground))]">
              Saúde da Fila IA
            </span>
            <Badge className={cn('text-xs border', config.bg, config.color, config.border)}>
              {isLoading ? '...' : config.label}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]"
                >
                  <m.icon className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                  <span className="text-sm font-bold text-[hsl(var(--avivar-foreground))]">{m.value}</span>
                  <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] text-center leading-tight">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[hsl(var(--avivar-muted-foreground))]">
                <span>Throughput</span>
                <span>{stats?.throughput_per_min.toFixed(1)} jobs/min</span>
              </div>
              <Progress value={throughputPercent} className="h-2" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
