/**
 * HotLeads Kanban - Styled Kanban with drag-and-drop
 */

import { useMemo, useState, useCallback, DragEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lead, LeadCard } from './LeadCard';
import { Clock, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanSummary, KanbanColumnHeader } from '@/components/shared/StyledKanban';

type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';

const KANBAN_COLUMNS = [
  { 
    status: 'new' as LeadStatus, 
    label: 'Lead Novo', 
    subtitle: 'Aguardando',
    icon: Clock, 
    color: 'from-blue-500 to-blue-600',
    statusColor: 'bg-blue-500'
  },
  { 
    status: 'contacted' as LeadStatus, 
    label: 'Lead Captado', 
    subtitle: 'Em contato',
    icon: Phone, 
    color: 'from-amber-500 to-amber-600',
    statusColor: 'bg-amber-500'
  },
  { 
    status: 'scheduled' as LeadStatus, 
    label: 'Consulta Agendada', 
    subtitle: 'Marcado',
    icon: Calendar, 
    color: 'from-purple-500 to-purple-600',
    statusColor: 'bg-purple-500'
  },
  { 
    status: 'converted' as LeadStatus, 
    label: 'Vendido', 
    subtitle: 'Fechado',
    icon: CheckCircle2, 
    color: 'from-emerald-500 to-emerald-600',
    statusColor: 'bg-emerald-500'
  },
  { 
    status: 'lost' as LeadStatus, 
    label: 'Descartado', 
    subtitle: 'Perdido',
    icon: XCircle, 
    color: 'from-rose-500 to-rose-600',
    statusColor: 'bg-rose-500'
  },
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
  onStatusChange?: (lead: Lead, newStatus: LeadStatus) => void;
}

export function LeadKanban({
  leads,
  userId,
  isAdmin,
  profiles,
  canClaimLead,
  isInPriorityPeriod,
  onClaim,
  onOpenDetails,
  onStatusChange
}: LeadKanbanProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      leads: leads.filter(lead => lead.status === col.status)
    }));
  }, [leads]);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, lead: Lead) => {
    const isMine = lead.claimed_by === userId;
    if (!isMine && !isAdmin) {
      e.preventDefault();
      return;
    }
    
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
    
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, [userId, isAdmin]);

  const handleDragEnd = useCallback((e: DragEvent<HTMLDivElement>) => {
    setDraggedLead(null);
    setDragOverColumn(null);
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, newStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedLead || !onStatusChange) return;
    
    if (draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }
    
    const isMine = draggedLead.claimed_by === userId;
    if (!isMine && !isAdmin) {
      setDraggedLead(null);
      return;
    }
    
    onStatusChange(draggedLead, newStatus);
    setDraggedLead(null);
  }, [draggedLead, userId, isAdmin, onStatusChange]);

  // Calculate converted value
  const totalConverted = leads
    .filter(l => l.status === 'converted')
    .reduce((sum, l) => sum + (l.converted_value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <KanbanSummary
        columns={columns.map(col => ({
          id: col.status,
          title: col.label,
          subtitle: col.status === 'converted' && totalConverted > 0 
            ? `R$ ${totalConverted.toLocaleString('pt-BR')}`
            : col.subtitle,
          count: col.leads.length,
          statusColor: col.statusColor,
        }))}
      />

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => {
          const isDropTarget = dragOverColumn === column.status;

          return (
            <div 
              key={column.status} 
              className="flex-shrink-0 w-[220px] lg:w-[240px]"
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <Card className={cn(
                "border-none shadow-sm overflow-hidden transition-all duration-200",
                isDropTarget && 'ring-2 ring-primary ring-offset-2'
              )}>
                <KanbanColumnHeader
                  title={column.label}
                  subtitle={column.subtitle}
                  color={column.color}
                />
                <CardContent className={cn(
                  "p-3 bg-muted/20 min-h-[300px]",
                  isDropTarget && "bg-primary/5"
                )}>
                  {column.leads.length === 0 ? (
                    <div className={cn(
                      "flex items-center justify-center h-[200px] text-muted-foreground text-sm border-2 border-dashed rounded-lg transition-colors",
                      isDropTarget && "border-primary bg-primary/5"
                    )}>
                      {isDropTarget ? 'Solte aqui' : 'Nenhum lead'}
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-2">
                        {column.leads.map(lead => {
                          const isMine = lead.claimed_by === userId;
                          const canDrag = isMine || isAdmin;
                          
                          return (
                            <div
                              key={lead.id}
                              draggable={canDrag}
                              onDragStart={(e) => handleDragStart(e, lead)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                canDrag && "cursor-grab active:cursor-grabbing"
                              )}
                            >
                              <LeadCard
                                lead={lead}
                                isMine={isMine}
                                isAdmin={isAdmin}
                                canClaim={canClaimLead(lead)}
                                inPriority={isInPriorityPeriod(lead)}
                                onClaim={onClaim}
                                onOpenDetails={onOpenDetails}
                                licenseName={lead.claimed_by ? profiles[lead.claimed_by]?.name : undefined}
                                compact
                              />
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
