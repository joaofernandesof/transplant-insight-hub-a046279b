import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lead, LeadCard, statusConfig } from './LeadCard';
import { Clock, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';

const KANBAN_COLUMNS = [
  { status: 'new', label: 'Lead Novo', icon: Clock, color: 'border-t-blue-500' },
  { status: 'contacted', label: 'Lead Captado', icon: Phone, color: 'border-t-yellow-500' },
  { status: 'scheduled', label: 'Consulta Agendada', icon: Calendar, color: 'border-t-purple-500' },
  { status: 'converted', label: 'Vendido', icon: CheckCircle2, color: 'border-t-green-500' },
  { status: 'lost', label: 'Descartado', icon: XCircle, color: 'border-t-red-500' },
] as const;

interface LeadKanbanProps {
  leads: Lead[];
  userId?: string;
  isAdmin: boolean;
  profiles: Record<string, { name: string; state: string | null }>;
  canClaimLead: (lead: Lead) => boolean;
  isInPriorityPeriod: (lead: Lead) => boolean;
  onClaim: (lead: Lead) => void;
  onOpenDetails: (lead: Lead) => void;
}

export function LeadKanban({
  leads,
  userId,
  isAdmin,
  profiles,
  canClaimLead,
  isInPriorityPeriod,
  onClaim,
  onOpenDetails
}: LeadKanbanProps) {
  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      leads: leads.filter(lead => lead.status === col.status)
    }));
  }, [leads]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const Icon = column.icon;
        const columnValue = column.leads
          .filter(l => l.status === 'converted')
          .reduce((sum, l) => sum + (l.converted_value || 0), 0);

        return (
          <div 
            key={column.status} 
            className="flex-shrink-0 w-[280px]"
          >
            <Card className={`border-t-4 ${column.color}`}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {column.label}
                  </CardTitle>
                  <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-full">
                    {column.leads.length}
                  </span>
                </div>
                {column.status === 'converted' && columnValue > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    R$ {columnValue.toLocaleString('pt-BR')}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
                  <div className="space-y-2 pr-2">
                    {column.leads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum lead
                      </div>
                    ) : (
                      column.leads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          isMine={lead.claimed_by === userId}
                          isAdmin={isAdmin}
                          canClaim={canClaimLead(lead)}
                          inPriority={isInPriorityPeriod(lead)}
                          onClaim={onClaim}
                          onOpenDetails={onOpenDetails}
                          licenseName={lead.claimed_by ? profiles[lead.claimed_by]?.name : undefined}
                          compact
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
