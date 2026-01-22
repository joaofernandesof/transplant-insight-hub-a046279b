import { Card, CardContent } from '@/components/ui/card';
import { Users, Phone, Calendar, CheckCircle, ChevronRight } from 'lucide-react';
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
        <CardContent className="p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex gap-2 h-28">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="flex-1" />
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
      lightBg: 'bg-blue-100 dark:bg-blue-900/30',
      count: leads.filter(l => l.status === 'new').length
    },
    {
      status: 'contacted',
      label: 'Contato',
      icon: Phone,
      color: 'text-amber-600',
      bg: 'bg-amber-500',
      lightBg: 'bg-amber-100 dark:bg-amber-900/30',
      count: leads.filter(l => l.status === 'contacted').length
    },
    {
      status: 'scheduled',
      label: 'Agendados',
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-500',
      lightBg: 'bg-purple-100 dark:bg-purple-900/30',
      count: leads.filter(l => l.status === 'scheduled').length
    },
    {
      status: 'converted',
      label: 'Convertidos',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-500',
      lightBg: 'bg-green-100 dark:bg-green-900/30',
      count: leads.filter(l => l.status === 'converted').length
    }
  ];

  const totalLeads = leads.length;
  const maxCount = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md group"
      onClick={() => navigate('/hotleads')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Funil de Leads</h3>
            <p className="text-xs text-muted-foreground">{totalLeads} leads no total</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        {/* Funnel bars */}
        <div className="flex gap-2 h-24 mb-3">
          {funnelStages.map((stage) => {
            const height = stage.count > 0 ? Math.max((stage.count / maxCount) * 100, 15) : 8;
            return (
              <div 
                key={stage.status}
                className="flex-1 flex flex-col items-center justify-end"
              >
                <div 
                  className={cn(
                    "w-full rounded-t-md transition-all",
                    stage.bg,
                    stage.count === 0 && "opacity-30"
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Labels */}
        <div className="grid grid-cols-4 gap-2">
          {funnelStages.map((stage) => (
            <div key={stage.status} className="text-center">
              <p className="text-lg font-bold">{stage.count}</p>
              <p className="text-[11px] text-muted-foreground">{stage.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
