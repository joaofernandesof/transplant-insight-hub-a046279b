import { useMemo, useState, useCallback, DragEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lead, LeadCard, statusConfig } from './LeadCard';
import { Clock, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';

const KANBAN_COLUMNS = [
  { status: 'new' as LeadStatus, label: 'Lead Novo', icon: Clock, color: 'border-t-blue-500' },
  { status: 'contacted' as LeadStatus, label: 'Lead Captado', icon: Phone, color: 'border-t-yellow-500' },
  { status: 'scheduled' as LeadStatus, label: 'Consulta Agendada', icon: Calendar, color: 'border-t-purple-500' },
  { status: 'converted' as LeadStatus, label: 'Vendido', icon: CheckCircle2, color: 'border-t-green-500' },
  { status: 'lost' as LeadStatus, label: 'Descartado', icon: XCircle, color: 'border-t-red-500' },
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
    // Only allow dragging leads that belong to the user or if admin
    const isMine = lead.claimed_by === userId;
    if (!isMine && !isAdmin) {
      e.preventDefault();
      return;
    }
    
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
    
    // Add visual feedback
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
    
    // Don't update if dropped on same column
    if (draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }
    
    // Check if user can move to this status
    const isMine = draggedLead.claimed_by === userId;
    if (!isMine && !isAdmin) {
      setDraggedLead(null);
      return;
    }
    
    onStatusChange(draggedLead, newStatus);
    setDraggedLead(null);
  }, [draggedLead, userId, isAdmin, onStatusChange]);

  return (
    <div className="grid grid-cols-5 gap-2 lg:gap-3 max-md:flex max-md:overflow-x-auto max-md:gap-3 pb-4">
      {columns.map(column => {
        const Icon = column.icon;
        const columnValue = column.leads
          .filter(l => l.status === 'converted')
          .reduce((sum, l) => sum + (l.converted_value || 0), 0);
        const isDropTarget = dragOverColumn === column.status;

        return (
          <div 
            key={column.status} 
            className="w-full min-w-0 max-md:flex-shrink-0 max-md:w-[260px]"
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <Card className={cn(
              `border-t-4 ${column.color} transition-all duration-200`,
              isDropTarget && 'ring-2 ring-primary ring-offset-2 bg-accent/50'
            )}>
              <CardHeader className="py-2 px-2 lg:px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs lg:text-sm font-medium flex items-center gap-1 lg:gap-2">
                    <Icon className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="truncate">{column.label}</span>
                  </CardTitle>
                  <span className="text-[10px] lg:text-xs font-semibold bg-muted px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full">
                    {column.leads.length}
                  </span>
                </div>
                {column.status === 'converted' && columnValue > 0 && (
                  <p className="text-[10px] lg:text-xs text-green-600 font-medium mt-1">
                    R$ {columnValue.toLocaleString('pt-BR')}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-1.5 lg:p-2">
                <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
                  <div className="space-y-2 pr-2">
                    {column.leads.length === 0 ? (
                      <div className={cn(
                        "text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg transition-colors",
                        isDropTarget && "border-primary bg-primary/5"
                      )}>
                        {isDropTarget ? 'Solte aqui' : 'Nenhum lead'}
                      </div>
                    ) : (
                      column.leads.map(lead => {
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
                      })
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
