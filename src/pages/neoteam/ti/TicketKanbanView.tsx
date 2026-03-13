import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, CalendarIcon, AlertTriangle, Clock, ArrowRight, CalendarOff } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-[rgb(234,243,222)] text-[rgb(59,109,17)]",
  in_progress: "bg-[rgb(230,241,251)] text-[rgb(24,95,165)]",
  waiting: "bg-[rgb(250,238,218)] text-[rgb(133,79,11)]",
  resolved: "bg-[rgb(238,237,254)] text-[rgb(83,74,183)]",
  closed: "bg-[rgb(241,239,232)] text-[rgb(95,94,90)]",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  open: "bg-[rgb(99,153,34)]",
  in_progress: "bg-[rgb(55,138,221)]",
  waiting: "bg-[rgb(239,159,39)]",
  resolved: "bg-[rgb(127,119,221)]",
  closed: "bg-[rgb(136,135,128)]",
};

const STATUS_HEADER_COLORS: Record<string, string> = {
  open: "border-t-[rgb(99,153,34)]",
  in_progress: "border-t-[rgb(55,138,221)]",
  waiting: "border-t-[rgb(239,159,39)]",
  resolved: "border-t-[rgb(127,119,221)]",
  closed: "border-t-[rgb(136,135,128)]",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-[rgb(234,243,222)] text-[rgb(59,109,17)]",
  medium: "bg-[rgb(230,241,251)] text-[rgb(24,95,165)]",
  high: "bg-[rgb(250,238,218)] text-[rgb(133,79,11)]",
  critical: "bg-[rgb(252,235,235)] text-[rgb(163,45,45)]",
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  low: "bg-[rgb(99,153,34)]",
  medium: "bg-[rgb(55,138,221)]",
  high: "bg-[rgb(239,159,39)]",
  critical: "bg-[rgb(226,75,74)]",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Urgente",
};

const DEADLINE_GROUPS = [
  { key: "overdue", label: "Atrasado", icon: AlertTriangle, color: "border-t-red-500", headerBg: "bg-red-50 dark:bg-red-950/30", textColor: "text-red-700 dark:text-red-400" },
  { key: "today", label: "Hoje", icon: Clock, color: "border-t-amber-500", headerBg: "bg-amber-50 dark:bg-amber-950/30", textColor: "text-amber-700 dark:text-amber-400" },
  { key: "tomorrow", label: "Amanhã", icon: ArrowRight, color: "border-t-blue-500", headerBg: "bg-blue-50 dark:bg-blue-950/30", textColor: "text-blue-700 dark:text-blue-400" },
  { key: "future", label: "Futuro", icon: CalendarIcon, color: "border-t-emerald-500", headerBg: "bg-emerald-50 dark:bg-emerald-950/30", textColor: "text-emerald-700 dark:text-emerald-400" },
  { key: "no_date", label: "Sem Data", icon: CalendarOff, color: "border-t-gray-400", headerBg: "bg-muted/50", textColor: "text-muted-foreground" },
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getDeadlineGroup(ticket: any): string {
  if (!ticket.due_date) return "no_date";
  const dueDate = startOfDay(parseISO(ticket.due_date));
  const today = startOfDay(new Date());
  if (isBefore(dueDate, today)) return "overdue";
  if (isToday(dueDate)) return "today";
  if (isTomorrow(dueDate)) return "tomorrow";
  return "future";
}

interface TicketKanbanViewProps {
  tickets: any[];
  attachmentCounts: Record<string, number>;
  onTicketClick?: (ticket: any) => void;
  isAdmin?: boolean;
  updateStatus?: any;
}

function TicketCard({ ticket, attachmentCount, onClick, isAdmin }: {
  ticket: any;
  attachmentCount: number;
  onClick?: () => void;
  isAdmin?: boolean;
}) {
  return (
    <Card
      className={cn(
        "mb-2 transition-all hover:shadow-md cursor-pointer border-l-4",
        ticket.priority === "critical" ? "border-l-red-500" :
        ticket.priority === "high" ? "border-l-orange-400" :
        ticket.priority === "medium" ? "border-l-blue-400" :
        "border-l-green-400"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-2">{ticket.title}</p>
          <Badge className={cn("text-[10px] shrink-0 gap-1", PRIORITY_COLORS[ticket.priority])}>
            <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT_COLORS[ticket.priority])} />
            {PRIORITY_LABELS[ticket.priority]}
          </Badge>
        </div>

        {ticket.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</p>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-mono">{ticket.ticket_number}</span>
          <div className="flex items-center gap-2">
            {attachmentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="h-3 w-3" />{attachmentCount}
              </span>
            )}
            {ticket.due_date && (
              <span className="flex items-center gap-0.5">
                <CalendarIcon className="h-3 w-3" />
                {format(parseISO(ticket.due_date), "dd/MM")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-muted">{getInitials(ticket.requester_name || "?")}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{ticket.requester_name}</span>
          </div>
          {ticket.assigned_name && (
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{getInitials(ticket.assigned_name)}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] truncate max-w-[80px]">{ticket.assigned_name?.split(" ")[0]}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TicketKanbanView({
  tickets,
  attachmentCounts,
  onTicketClick,
  isAdmin,
  updateStatus,
}: TicketKanbanViewProps) {
  const [groupBy, setGroupBy] = useState<"status" | "deadline">("status");

  const statusColumns = useMemo(() => {
    const order = ["open", "in_progress", "waiting", "resolved", "closed"];
    return order.map(status => ({
      key: status,
      label: STATUS_LABELS[status],
      tickets: tickets.filter(t => t.status === status),
    }));
  }, [tickets]);

  const deadlineColumns = useMemo(() => {
    return DEADLINE_GROUPS.map(group => ({
      ...group,
      tickets: tickets
        .filter(t => !["closed"].includes(t.status))
        .filter(t => getDeadlineGroup(t) === group.key),
    }));
  }, [tickets]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Agrupar por:</span>
        <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="deadline">Prazo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {groupBy === "status" ? (
          statusColumns.map(col => (
            <div
              key={col.key}
              className={cn(
                "flex-shrink-0 w-[280px] rounded-xl border border-border bg-card border-t-4",
                STATUS_HEADER_COLORS[col.key]
              )}
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT_COLORS[col.key])} />
                  <span className="font-semibold text-sm">{col.label}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5">{col.tickets.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="p-2">
                  {col.tickets.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhum chamado</p>
                  ) : (
                    col.tickets.map(t => (
                      <TicketCard
                        key={t.id}
                        ticket={t}
                        attachmentCount={attachmentCounts[t.id] || 0}
                        onClick={() => onTicketClick?.(t)}
                        isAdmin={isAdmin}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ))
        ) : (
          deadlineColumns.map(col => {
            const GroupIcon = col.icon;
            return (
              <div
                key={col.key}
                className={cn(
                  "flex-shrink-0 w-[280px] rounded-xl border border-border bg-card border-t-4",
                  col.color
                )}
              >
                <div className={cn("p-3 border-b border-border flex items-center justify-between", col.headerBg)}>
                  <div className="flex items-center gap-2">
                    <GroupIcon className={cn("h-4 w-4", col.textColor)} />
                    <span className={cn("font-semibold text-sm", col.textColor)}>{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">{col.tickets.length}</Badge>
                </div>
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <div className="p-2">
                    {col.tickets.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">Nenhum chamado</p>
                    ) : (
                      col.tickets.map(t => (
                        <TicketCard
                          key={t.id}
                          ticket={t}
                          attachmentCount={attachmentCounts[t.id] || 0}
                          onClick={() => onTicketClick?.(t)}
                          isAdmin={isAdmin}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
