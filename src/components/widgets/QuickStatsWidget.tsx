import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Flame, TrendingUp, Award, ChevronRight } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { useSales } from '@/hooks/useSales';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function QuickStatsWidget() {
  const navigate = useNavigate();
  const { totalPoints, unlockedCount, isLoading: achievementsLoading } = useAchievements();
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  
  const { stats: currentStats, isLoading: currentLoading } = useSales(currentMonth);
  const { stats: lastStats, isLoading: lastLoading } = useSales(lastMonth);

  const isLoading = achievementsLoading || currentLoading || lastLoading;

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
      label: 'Crescimento Mensal',
      value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(0)}%`,
      icon: TrendingUp,
      color: growthPercent >= 0 ? 'text-green-600' : 'text-red-600',
      bg: growthPercent >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
      route: '/dashboard'
    },
    {
      label: 'Transplantes do Mês',
      value: currentStats.transplantsSold.toString(),
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      route: '/surgery-schedule'
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
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}