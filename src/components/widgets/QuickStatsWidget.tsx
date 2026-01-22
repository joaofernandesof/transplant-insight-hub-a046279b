import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Flame, TrendingUp, Award } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useSales } from '@/hooks/useSales';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';

export function QuickStatsWidget() {
  const navigate = useNavigate();
  const { achievements, totalPoints, unlockedCount, isLoading: achievementsLoading } = useAchievements();
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  
  const { stats: currentStats, isLoading: currentLoading } = useSales(currentMonth);
  const { stats: lastStats, isLoading: lastLoading } = useSales(lastMonth);

  const isLoading = achievementsLoading || currentLoading || lastLoading;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate growth
  const growthPercent = lastStats.totalVgv > 0 
    ? ((currentStats.totalVgv - lastStats.totalVgv) / lastStats.totalVgv * 100)
    : currentStats.totalVgv > 0 ? 100 : 0;

  const stats = [
    {
      label: 'Pontos Acumulados',
      value: totalPoints.toLocaleString('pt-BR'),
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      route: '/achievements'
    },
    {
      label: 'Conquistas',
      value: unlockedCount.toString(),
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      route: '/achievements'
    },
    {
      label: 'Crescimento Mês',
      value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(0)}%`,
      icon: TrendingUp,
      color: growthPercent >= 0 ? 'text-green-600' : 'text-red-600',
      bg: growthPercent >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
      route: '/dashboard'
    },
    {
      label: 'Transplantes',
      value: currentStats.transplantsSold.toString(),
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      route: '/surgery-schedule'
    }
  ];

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">Performance</span>
          <span className="text-[10px] text-muted-foreground uppercase">
            {format(new Date(), 'MMM yyyy')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => navigate(stat.route)}
            >
              <div className={`p-1.5 rounded-md ${stat.bg}`}>
                <stat.icon className={`h-3 w-3 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}