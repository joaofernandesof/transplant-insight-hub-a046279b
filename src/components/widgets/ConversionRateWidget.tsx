import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/hooks/useLeads';
import { useSales } from '@/hooks/useSales';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function ConversionRateWidget() {
  const navigate = useNavigate();
  const { leads, isLoading: leadsLoading } = useLeads();
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  
  const { stats: currentStats, isLoading: currentLoading } = useSales(currentMonth);
  const { stats: lastStats, isLoading: lastLoading } = useSales(lastMonth);

  const isLoading = leadsLoading || currentLoading || lastLoading;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Calculate trend
  const lastMonthLeads = leads.filter(l => l.created_at?.startsWith(lastMonth)).length;
  const lastMonthConverted = leads.filter(l => l.status === 'converted' && l.created_at?.startsWith(lastMonth)).length;
  const lastMonthRate = lastMonthLeads > 0 ? Math.round((lastMonthConverted / lastMonthLeads) * 100) : 0;
  
  const trend = conversionRate - lastMonthRate;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground';

  const pieData = [
    { name: 'Convertidos', value: convertedLeads, color: 'hsl(var(--primary))' },
    { name: 'Outros', value: Math.max(totalLeads - convertedLeads, 0), color: 'hsl(var(--muted))' }
  ];

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md group"
      onClick={() => navigate('/hotleads')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Taxa de Conversão</h3>
            <p className="text-xs text-muted-foreground">Leads → Vendas</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold">{conversionRate}%</span>
              <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{Math.abs(trend)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {convertedLeads} de {totalLeads} leads
            </p>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold">{currentStats.salesCount}</p>
                <p className="text-[10px] text-muted-foreground">Vendas/mês</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold">R$ {(currentStats.avgTicket / 1000).toFixed(0)}k</p>
                <p className="text-[10px] text-muted-foreground">Ticket médio</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}