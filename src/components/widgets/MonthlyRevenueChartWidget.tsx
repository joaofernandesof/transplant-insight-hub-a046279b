import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MonthlyRevenueChartWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['revenue-chart-6months'],
    queryFn: async () => {
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return format(date, 'yyyy-MM');
      });

      const { data, error } = await supabase
        .from('sales')
        .select('month_year, vgv_initial')
        .in('month_year', last6Months);

      if (error) throw error;

      const monthlyData = last6Months.map(month => {
        const monthSales = data?.filter(s => s.month_year === month) || [];
        const total = monthSales.reduce((sum, s) => sum + (s.vgv_initial || 0), 0);
        const date = parseISO(`${month}-01`);
        return {
          month: format(date, 'MMM', { locale: ptBR }),
          vgv: total
        };
      });

      return monthlyData;
    },
    enabled: !!user,
    staleTime: 60000
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-36" />
        </CardContent>
      </Card>
    );
  }

  const totalVGV = chartData?.reduce((sum, d) => sum + d.vgv, 0) || 0;

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md group"
      onClick={() => navigate('/consolidated-results')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-base">Faturamento (VGV)</h3>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <p className="text-2xl font-bold text-primary mb-3">
          R$ {formatCurrency(totalVGV)}
        </p>
        
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs">
                        <p className="font-medium">R$ {formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="vgv" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#colorVgv)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}