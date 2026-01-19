import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MarketplaceLead, LeadStatus } from "../types/marketplace";

interface LeadPipelineProps {
  leads: MarketplaceLead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onViewLead?: (lead: MarketplaceLead) => void;
}

const statusConfig: Record<
  LeadStatus,
  { label: string; color: string; bgColor: string }
> = {
  new: { label: "Novos", color: "text-blue-700", bgColor: "bg-blue-50" },
  contacted: { label: "Contatados", color: "text-amber-700", bgColor: "bg-amber-50" },
  scheduled: { label: "Agendados", color: "text-purple-700", bgColor: "bg-purple-50" },
  converted: { label: "Convertidos", color: "text-green-700", bgColor: "bg-green-50" },
  lost: { label: "Perdidos", color: "text-red-700", bgColor: "bg-red-50" },
};

export function LeadPipeline({ leads, onUpdateStatus, onViewLead }: LeadPipelineProps) {
  const columns = useMemo(() => {
    const grouped = leads.reduce((acc, lead) => {
      const status = lead.status || "new";
      if (!acc[status]) acc[status] = [];
      acc[status].push(lead);
      return acc;
    }, {} as Record<LeadStatus, MarketplaceLead[]>);

    return Object.entries(statusConfig).map(([status, config]) => ({
      status: status as LeadStatus,
      ...config,
      leads: grouped[status as LeadStatus] || [],
    }));
  }, [leads]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {columns.map((column) => (
        <div key={column.status} className="flex-shrink-0 w-72">
          <div
            className={`rounded-t-lg px-3 py-2 ${column.bgColor} border-b border-marketplace-border`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium text-sm ${column.color}`}>
                {column.label}
              </span>
              <Badge variant="secondary" className="text-xs">
                {column.leads.length}
              </Badge>
            </div>
          </div>

          <div className="bg-muted/30 rounded-b-lg p-2 min-h-[400px] space-y-2">
            {column.leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onUpdateStatus={onUpdateStatus}
                onView={onViewLead}
              />
            ))}

            {column.leads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum lead nesta etapa
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface LeadCardProps {
  lead: MarketplaceLead;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onView?: (lead: MarketplaceLead) => void;
}

function LeadCard({ lead, onUpdateStatus, onView }: LeadCardProps) {
  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-marketplace-border"
      onClick={() => onView?.(lead)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-marketplace/10 text-marketplace text-xs">
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
          <div className="flex items-center gap-1 text-xs text-marketplace">
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
      </CardContent>
    </Card>
  );
}
