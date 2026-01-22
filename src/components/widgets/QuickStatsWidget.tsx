import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Flame, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useSales } from '@/hooks/useSales';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendIndicator } from './TrendIndicator';

export function QuickStatsWidget() {
  const navigate = useNavigate();
  const { totalPoints, unlockedCount, isLoading: achievementsLoading } = useAchievements();
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  const twoMonthsAgo = format(subMonths(new Date(), 2), 'yyyy-MM');
  
  const { stats: currentStats, isLoading: currentLoading } = useSales(currentMonth);
  const { stats: lastStats, isLoading: lastLoading } = useSales(lastMonth);
  const { stats: twoMonthsStats, isLoading: twoMonthsLoading } = useSales(twoMonthsAgo);

  const isLoading = achievementsLoading || currentLoading || lastLoading || twoMonthsLoading;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate growth
  const growthPercent = lastStats.totalVgv > 0 
    ? ((currentStats.totalVgv - lastStats.totalVgv) / lastStats.totalVgv * 100)
    : currentStats.totalVgv > 0 ? 100 : 0;

  const lastGrowthPercent = twoMonthsStats.totalVgv > 0 
    ? ((lastStats.totalVgv - twoMonthsStats.totalVgv) / twoMonthsStats.totalVgv * 100)
    : lastStats.totalVgv > 0 ? 100 : 0;

  const stats = [
    {
      label: 'Pontos Acumulados',
      value: totalPoints.toLocaleString('pt-BR'),
      icon: Trophy,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      route: '/achievements',
      current: totalPoints,
      previous: totalPoints // Points don't have previous
    },
    {
      label: 'Conquistas',
      value: unlockedCount.toString(),
      icon: Award,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      route: '/achievements',
      current: unlockedCount,
      previous: unlockedCount
    },
    {
      label: 'Crescimento',
      value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(0)}%`,
      icon: TrendingUp,
      color: growthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
      bg: growthPercent >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-destructive/10',
      route: '/dashboard',
      current: growthPercent,
      previous: lastGrowthPercent
    },
    {
      label: 'Transplantes',
      value: currentStats.transplantsSold.toString(),
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      route: '/surgery-schedule',
      current: currentStats.transplantsSold,
      previous: lastStats.transplantsSold
    }
  ];

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Performance</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(stat.route);
              }}
            >
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold">{stat.value}</p>
                  {stat.label !== 'Crescimento' && stat.label !== 'Pontos Acumulados' && stat.label !== 'Conquistas' && (
                    <TrendIndicator 
                      current={stat.current} 
                      previous={stat.previous}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}