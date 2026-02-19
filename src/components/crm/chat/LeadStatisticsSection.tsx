import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLeadStatistics } from '@/hooks/useLeadStatistics';

interface LeadStatisticsSectionProps {
  conversationId: string;
  leadId?: string;
}

export function LeadStatisticsSection({ conversationId, leadId }: LeadStatisticsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { leadStats, crmStats } = useLeadStatistics(conversationId, leadId);

  const ls = leadStats.data;
  const cs = crmStats.data;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 text-left">
          <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
            <BarChart3 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Estatísticas
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        {/* Lead Individual */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">
            Este Lead
          </p>
          {leadStats.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : ls ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={MessageSquare} label="Mensagens" value={ls.totalMessages} />
              <StatCard icon={Clock} label="Dias no funil" value={ls.daysSinceCreation} />
              {ls.lastInteraction && (
                <div className="col-span-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Última interação: {format(new Date(ls.lastInteraction), "dd/MM HH:mm", { locale: ptBR })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* CRM Geral */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">
            CRM Geral
          </p>
          {crmStats.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : cs ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <StatCard icon={Users} label="Leads ativos" value={cs.totalActiveLeads} />
                <StatCard icon={TrendingUp} label="Meus leads" value={cs.myLeads} />
              </div>
              {Object.keys(cs.leadsByStage).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Por etapa:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(cs.leadsByStage).map(([stage, count]) => (
                      <Badge
                        key={stage}
                        variant="secondary"
                        className="text-xs"
                      >
                        {stage}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
      <Icon className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))]" />
      <div>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{label}</p>
        <p className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">{value}</p>
      </div>
    </div>
  );
}
