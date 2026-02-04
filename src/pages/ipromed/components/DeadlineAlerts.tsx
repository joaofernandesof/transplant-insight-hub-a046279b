/**
 * CPG Advocacia Médica - Deadline Alerts Component
 * Shows upcoming and overdue deadlines for client journey steps
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle2,
} from "lucide-react";

interface ClientDeadline {
  id: string;
  clientId: string;
  clientName: string;
  stepCode: number;
  stepTitle: string;
  moment: string;
  dueDate: Date;
  status: "overdue" | "due-today" | "upcoming" | "completed";
}

interface DeadlineAlertsProps {
  clients: Array<{
    id: string;
    name: string;
    startDate: string;
    currentStep: number;
  }>;
  onClientClick?: (clientId: string) => void;
}

// Journey step deadlines mapping
const stepDeadlines = [
  { code: 1, title: "Ativação do contrato", daysOffset: 0 },
  { code: 2, title: "Comunicação de limites", daysOffset: 0 },
  { code: 3, title: "Agendamento do onboarding", daysOffset: 1 },
  { code: 4, title: "Reunião de onboarding", daysOffset: 3 },
  { code: 5, title: "Mapeamento profissional", daysOffset: 3 },
  { code: 6, title: "Mapeamento de riscos", daysOffset: 3 },
  { code: 7, title: "Levantamento de passivos", daysOffset: 3 },
  { code: 8, title: "Tratamento de demandas", daysOffset: 3 },
  { code: 9, title: "Abertura de dossiê", daysOffset: 7 },
  { code: 10, title: "Diagnóstico preventivo", daysOffset: 7 },
  { code: 11, title: "Plano jurídico", daysOffset: 7 },
  { code: 13, title: "Documentação preventiva", daysOffset: 15 },
  { code: 14, title: "Entrega documental", daysOffset: 15 },
  { code: 15, title: "Revisão de publicidade", daysOffset: 30 },
  { code: 16, title: "Compliance ético", daysOffset: 30 },
];

export default function DeadlineAlerts({ clients, onClientClick }: DeadlineAlertsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateDeadlines = (): ClientDeadline[] => {
    const deadlines: ClientDeadline[] = [];

    clients.forEach(client => {
      const startDate = new Date(client.startDate);

      stepDeadlines.forEach(step => {
        if (step.code <= client.currentStep) return; // Skip completed steps

        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + step.daysOffset);
        dueDate.setHours(23, 59, 59, 999);

        const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: ClientDeadline["status"];
        if (diffDays < 0) {
          status = "overdue";
        } else if (diffDays === 0) {
          status = "due-today";
        } else if (diffDays <= 3) {
          status = "upcoming";
        } else {
          // Skip deadlines more than 3 days away
          return;
        }

        deadlines.push({
          id: `${client.id}-${step.code}`,
          clientId: client.id,
          clientName: client.name,
          stepCode: step.code,
          stepTitle: step.title,
          moment: step.daysOffset === 0 ? "D0" : `D+${step.daysOffset}`,
          dueDate,
          status,
        });
      });
    });

    // Sort by status priority and then by date
    return deadlines.sort((a, b) => {
      const statusOrder = { overdue: 0, "due-today": 1, upcoming: 2, completed: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  };

  const deadlines = calculateDeadlines();
  const overdueCount = deadlines.filter(d => d.status === "overdue").length;
  const dueTodayCount = deadlines.filter(d => d.status === "due-today").length;
  const upcomingCount = deadlines.filter(d => d.status === "upcoming").length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: ClientDeadline["status"]) => {
    switch (status) {
      case "overdue":
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atrasado
          </Badge>
        );
      case "due-today":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Hoje
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            <Calendar className="h-3 w-3 mr-1" />
            Próximo
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
    }
  };

  const formatDate = (date: Date) => {
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays === -1) return "Ontem";
    if (diffDays < -1) return `Há ${Math.abs(diffDays)} dias`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Alertas de Prazos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <p className="font-medium">Nenhum prazo pendente</p>
            <p className="text-sm">Todos os clientes estão em dia!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Alertas de Prazos
          </CardTitle>
          <div className="flex gap-2">
            {overdueCount > 0 && (
              <Badge variant="destructive">{overdueCount} atrasados</Badge>
            )}
            {dueTodayCount > 0 && (
              <Badge className="bg-amber-500">{dueTodayCount} hoje</Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="secondary">{upcomingCount} próximos</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {deadlines.map(deadline => (
              <div
                key={deadline.id}
                className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                  deadline.status === "overdue" ? "bg-rose-50/50 dark:bg-rose-950/20" : ""
                }`}
                onClick={() => onClientClick?.(deadline.clientId)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(deadline.clientName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {deadline.clientName}
                    </span>
                    {getStatusBadge(deadline.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {deadline.stepCode.toString().padStart(2, "0")}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {deadline.stepTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-sm font-medium ${
                      deadline.status === "overdue"
                        ? "text-rose-600"
                        : deadline.status === "due-today"
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatDate(deadline.dueDate)}
                  </div>
                  <div className="text-xs text-muted-foreground">{deadline.moment}</div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
