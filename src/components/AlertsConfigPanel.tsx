import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bell, Plus, Trash2, Settings2, Clock, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useMetricAlerts, MetricAlert } from "@/hooks/useMetricAlerts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function AlertsConfigPanel() {
  const { alerts, history, isLoading, updateAlert, toggleAlert, addRecipient, removeRecipient } = useMetricAlerts();
  const [selectedAlert, setSelectedAlert] = useState<MetricAlert | null>(null);
  const [newEmail, setNewEmail] = useState("");

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      gt: "Maior que",
      lt: "Menor que",
      gte: "Maior ou igual",
      lte: "Menor ou igual",
      eq: "Igual a",
    };
    return labels[op] || op;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Atenção</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAddEmail = () => {
    if (selectedAlert && newEmail && newEmail.includes("@")) {
      addRecipient(selectedAlert.id, newEmail);
      setNewEmail("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas por Email
              </CardTitle>
              <CardDescription>
                Configure alertas automáticos quando métricas atingirem limites críticos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Condição</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.metric_name}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {getOperatorLabel(alert.comparison_operator)}{" "}
                      </span>
                      <span className="font-semibold">{alert.threshold_value}</span>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                      {alert.email_recipients.length > 0 ? (
                        <Badge variant="outline">
                          {alert.email_recipients.length} email(s)
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhum</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configurar Alerta</DialogTitle>
                            <DialogDescription>
                              {alert.metric_name}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Condição</Label>
                                <Select
                                  value={alert.comparison_operator}
                                  onValueChange={(v) =>
                                    updateAlert(alert.id, { comparison_operator: v as MetricAlert['comparison_operator'] })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gt">Maior que</SelectItem>
                                    <SelectItem value="lt">Menor que</SelectItem>
                                    <SelectItem value="gte">Maior ou igual</SelectItem>
                                    <SelectItem value="lte">Menor ou igual</SelectItem>
                                    <SelectItem value="eq">Igual a</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Valor Limite</Label>
                                <Input
                                  type="number"
                                  value={alert.threshold_value}
                                  onChange={(e) =>
                                    updateAlert(alert.id, { threshold_value: Number(e.target.value) })
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Severidade</Label>
                                <Select
                                  value={alert.severity}
                                  onValueChange={(v) =>
                                    updateAlert(alert.id, { severity: v as MetricAlert['severity'] })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="info">Informação</SelectItem>
                                    <SelectItem value="warning">Atenção</SelectItem>
                                    <SelectItem value="critical">Crítico</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Cooldown (minutos)</Label>
                                <Input
                                  type="number"
                                  value={alert.cooldown_minutes}
                                  onChange={(e) =>
                                    updateAlert(alert.id, { cooldown_minutes: Number(e.target.value) })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Destinatários de Email</Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="email@exemplo.com"
                                  value={newEmail}
                                  onChange={(e) => setNewEmail(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                                />
                                <Button variant="outline" onClick={handleAddEmail}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {alert.email_recipients.map((email) => (
                                  <Badge key={email} variant="secondary" className="gap-1">
                                    {email}
                                    <button
                                      onClick={() => removeRecipient(alert.id, email)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Alertas
          </CardTitle>
          <CardDescription>Últimos alertas disparados</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum alerta disparado ainda
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      item.severity === "critical" && "border-destructive/50 bg-destructive/5",
                      item.severity === "warning" && "border-amber-500/50 bg-amber-500/5",
                      item.severity === "info" && "border-primary/50 bg-primary/5"
                    )}
                  >
                    {getSeverityIcon(item.severity)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.metric_key}: {item.metric_value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Limite: {item.threshold_value}
                      </p>
                      {item.emails_sent_to.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Emails enviados: {item.emails_sent_to.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.triggered_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
