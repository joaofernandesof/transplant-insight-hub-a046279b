import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Scissors, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useSurgerySchedule } from '@/hooks/useSurgerySchedule';
import { format, isThisMonth, isFuture, parseISO, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendIndicator } from './TrendIndicator';

export function SurgeriesOverviewWidget() {
  const navigate = useNavigate();
  const { surgeries, isLoading } = useSurgerySchedule();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const thisMonth = surgeries?.filter(s => {
    if (!s.surgery_date) return false;
    return isThisMonth(parseISO(s.surgery_date));
  }) || [];

  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  const lastMonthSurgeries = surgeries?.filter(s => {
    if (!s.surgery_date) return false;
    const date = parseISO(s.surgery_date);
    return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
  }) || [];

  const upcomingSurgeries = surgeries?.filter(s => {
    if (!s.surgery_date) return false;
    return isFuture(parseISO(s.surgery_date));
  }) || [];

  const confirmedThisMonth = thisMonth.filter(s => s.confirmed).length;
  const confirmedLastMonth = lastMonthSurgeries.filter(s => s.confirmed).length;
  const pendingThisMonth = thisMonth.filter(s => !s.confirmed).length;

  const nextSurgery = upcomingSurgeries[0];

  const stats = [
    {
      label: 'Este Mês',
      value: thisMonth.length.toString(),
      icon: Calendar,
      color: 'text-primary',
      bg: 'bg-primary/10',
      current: thisMonth.length,
      previous: lastMonthSurgeries.length
    },
    {
      label: 'Confirmadas',
      value: confirmedThisMonth.toString(),
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      current: confirmedThisMonth,
      previous: confirmedLastMonth
    },
    {
      label: 'Pendentes',
      value: pendingThisMonth.toString(),
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      current: pendingThisMonth,
      previous: lastMonthSurgeries.filter(s => !s.confirmed).length
    },
    {
      label: 'Agendadas',
      value: upcomingSurgeries.length.toString(),
      icon: Scissors,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      current: upcomingSurgeries.length,
      previous: upcomingSurgeries.length // No comparison for future surgeries
    }
  ];

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md group"
      onClick={() => navigate('/surgery-schedule')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Cirurgias</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
            >
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold">{stat.value}</p>
                  {stat.label !== 'Agendadas' && (
                    <TrendIndicator 
                      current={stat.current} 
                      previous={stat.previous}
                      invertColors={stat.label === 'Pendentes'}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {nextSurgery && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Próxima cirurgia</p>
            <p className="font-medium text-sm truncate">{nextSurgery.patient_name}</p>
            <p className="text-xs text-primary">
              {nextSurgery.surgery_date && format(parseISO(nextSurgery.surgery_date), "d 'de' MMM", { locale: ptBR })}
              {nextSurgery.surgery_time && ` às ${nextSurgery.surgery_time.slice(0, 5)}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}