/**
 * Financial Alerts Popover - Notificações financeiras via sininho
 */

import { useState } from "react";
import { Bell, AlertTriangle, Clock, CheckCircle, Send, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock alerts data
const mockAlerts = [
  {
    id: '1',
    type: 'overdue',
    title: 'Título vencido há 15 dias',
    description: 'Clínica ABC - Mensalidade Consultivo',
    client: 'Clínica ABC',
    value: 3500,
    date: '13/01',
    priority: 'high',
  },
  {
    id: '2',
    type: 'due_soon',
    title: 'Vence amanhã',
    description: 'Dr. João Silva - Honorários',
    client: 'Dr. João Silva',
    value: 5000,
    date: 'Hoje',
    priority: 'high',
  },
  {
    id: '3',
    type: 'due_soon',
    title: 'Vence em 3 dias',
    description: 'Pró-labore - Janeiro',
    value: 15000,
    date: '06/02',
    priority: 'medium',
  },
  {
    id: '4',
    type: 'action_needed',
    title: 'Reenviar cobrança',
    description: '3 dias sem resposta - Hospital XYZ',
    client: 'Hospital XYZ',
    value: 8500,
    date: '24/01',
    priority: 'medium',
  },
  {
    id: '5',
    type: 'scheduled',
    title: 'Pagamento agendado',
    description: 'Boleto - Processo 001',
    value: 2500,
    date: '10/02',
    priority: 'low',
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'due_soon':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'action_needed':
      return <Send className="h-4 w-4 text-purple-500" />;
    case 'scheduled':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-destructive bg-destructive/5';
    case 'medium':
      return 'border-l-amber-500 bg-amber-500/5';
    case 'low':
      return 'border-l-blue-500 bg-blue-500/5';
    default:
      return 'border-l-muted';
  }
};

export default function FinancialAlertsPopover() {
  const [open, setOpen] = useState(false);
  
  const highPriorityCount = mockAlerts.filter(a => a.priority === 'high').length;
  const totalAlerts = mockAlerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {totalAlerts > 0 && (
            <Badge 
              variant={highPriorityCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalAlerts}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Alertas Financeiros</h4>
              <p className="text-xs text-muted-foreground">
                {highPriorityCount} urgentes de {totalAlerts} alertas
              </p>
            </div>
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {highPriorityCount} urgentes
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          <div className="p-2 space-y-1">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-muted/50",
                  getPriorityColor(alert.priority)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{alert.title}</p>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(alert.value)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs h-5">
                        {alert.date}
                      </Badge>
                      {alert.client && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {alert.client}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-muted/30">
          <Button variant="outline" className="w-full gap-2" size="sm">
            Ver todos os alertas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
