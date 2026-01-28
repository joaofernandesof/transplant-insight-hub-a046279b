/**
 * Marketplace Lead Pipeline - Styled Kanban
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StyledKanban, StyledKanbanCard, KanbanColumn, KANBAN_COLUMN_COLORS, KANBAN_STATUS_COLORS } from "@/components/shared/StyledKanban";
import type { MarketplaceLead, LeadStatus } from "../types/marketplace";

interface LeadPipelineProps {
  leads: MarketplaceLead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onViewLead?: (lead: MarketplaceLead) => void;
}

const statusConfig: Record<
  LeadStatus,
  { label: string; subtitle: string; color: string; statusColor: string }
> = {
  new: { 
    label: "Novos", 
    subtitle: "Aguardando contato",
    color: "from-blue-500 to-blue-600", 
    statusColor: "bg-blue-500" 
  },
  contacted: { 
    label: "Contatados", 
    subtitle: "Em negociação",
    color: "from-amber-500 to-amber-600", 
    statusColor: "bg-amber-500" 
  },
  scheduled: { 
    label: "Agendados", 
    subtitle: "Consulta marcada",
    color: "from-purple-500 to-purple-600", 
    statusColor: "bg-purple-500" 
  },
  converted: { 
    label: "Convertidos", 
    subtitle: "Pacientes",
    color: "from-emerald-500 to-emerald-600", 
    statusColor: "bg-emerald-500" 
  },
  lost: { 
    label: "Perdidos", 
    subtitle: "Sem interesse",
    color: "from-rose-500 to-rose-600", 
    statusColor: "bg-rose-500" 
  },
};

export function LeadPipeline({ leads, onUpdateStatus, onViewLead }: LeadPipelineProps) {
  const columns: KanbanColumn<MarketplaceLead>[] = useMemo(() => {
    const grouped = leads.reduce((acc, lead) => {
      const status = lead.status || "new";
      if (!acc[status]) acc[status] = [];
      acc[status].push(lead);
      return acc;
    }, {} as Record<LeadStatus, MarketplaceLead[]>);

    return Object.entries(statusConfig).map(([status, config]) => ({
      id: status,
      title: config.label,
      subtitle: config.subtitle,
      items: grouped[status as LeadStatus] || [],
      color: config.color,
      statusColor: config.statusColor,
    }));
  }, [leads]);

  const renderCard = (lead: MarketplaceLead, columnId: string) => {
    const initials = lead.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <StyledKanbanCard key={lead.id} onClick={() => onViewLead?.(lead)}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {lead.procedureInterest || "Interesse geral"}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(lead.id, status as LeadStatus);
                    }}
                    className={lead.status === status ? "bg-muted" : ""}
                  >
                    Mover para {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
          </div>

          {lead.scheduledAt && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(lead.scheduledAt), "dd/MM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] px-1.5">
              {lead.source === "marketplace"
                ? "Marketplace"
                : lead.source === "indication"
                ? "Indicação"
                : "Direto"}
            </Badge>
            <span>
              {format(new Date(lead.createdAt), "dd/MM", { locale: ptBR })}
            </span>
          </div>
        </div>
      </StyledKanbanCard>
    );
  };

  return (
    <StyledKanban
      columns={columns}
      renderCard={renderCard}
      renderEmptyState={() => (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Nenhum lead
        </div>
      )}
    />
  );
}
