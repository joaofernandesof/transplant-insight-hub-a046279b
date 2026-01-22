import { Card, CardContent } from '@/components/ui/card';
import { Users, Phone, Calendar, CheckCircle } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LeadsFunnelWidget() {
  const navigate = useNavigate();
  const { leads, isLoading } = useLeads();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 flex-1" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const funnelStages = [
    {
      status: 'new',
      label: 'Novos',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-500',
      count: leads.filter(l => l.status === 'new').length
    },
    {
      status: 'contacted',
      label: 'Contato',
      icon: Phone,
      color: 'text-amber-600',
      bg: 'bg-amber-500',
      count: leads.filter(l => l.status === 'contacted').length
    },
    {
      status: 'scheduled',
      label: 'Agendados',
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-500',
      count: leads.filter(l => l.status === 'scheduled').length
    },
    {
      status: 'converted',
      label: 'Convertidos',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-500',
      count: leads.filter(l => l.status === 'converted').length
    }
  ];

  const totalLeads = leads.length;
  const maxCount = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md"
      onClick={() => navigate('/hotleads')}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">Funil de Leads</span>
          <span className="text-[10px] text-muted-foreground">
            {totalLeads} total
          </span>
        </div>
        
        <div className="flex gap-1 h-16">
          {funnelStages.map((stage, index) => {
            const height = stage.count > 0 ? Math.max((stage.count / maxCount) * 100, 20) : 10;
            return (
              <div 
                key={stage.status}
                className="flex-1 flex flex-col items-center justify-end"
              >
                <div 
                  className={cn(
                    "w-full rounded-t-sm transition-all",
                    stage.bg,
                    stage.count === 0 && "opacity-30"
                  )}
                  style={{ height: `${height}%` }}
                />
                <div className="mt-1.5 text-center">
                  <p className="text-xs font-semibold">{stage.count}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{stage.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
