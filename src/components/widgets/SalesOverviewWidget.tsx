import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Target } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function SalesOverviewWidget() {
  const navigate = useNavigate();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { stats, isLoading } = useSales(currentMonth);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'VGV Mês',
      value: formatCurrency(stats.totalVgv),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Vendas',
      value: stats.salesCount.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(stats.avgTicket),
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Entradas',
      value: formatCurrency(stats.totalDeposits),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30'
    }
  ];

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md"
      onClick={() => navigate('/dashboard')}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">Resumo Comercial</span>
          <span className="text-[10px] text-muted-foreground uppercase">
            {format(new Date(), 'MMM yyyy')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div 
              key={metric.label}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              <div className={`p-1.5 rounded-md ${metric.bg}`}>
                <metric.icon className={`h-3 w-3 ${metric.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{metric.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
