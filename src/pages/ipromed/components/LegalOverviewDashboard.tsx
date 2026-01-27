/**
 * IPROMED Legal Hub - Overview Dashboard
 * Painel unificado com KPIs e alertas
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Scale,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  FileSignature,
  Gavel,
  MessageSquare,
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; isPositive: boolean };
  color?: string;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = "text-primary" }: KPICardProps) => (
  <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-muted`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span className={`text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </CardContent>
  </Card>
);

interface Alert {
  id: string;
  type: 'deadline' | 'contract' | 'request' | 'signature';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'deadline', title: 'Prazo Recursal', description: 'Processo 0001234-56.2024 - Recurso de Apelação', priority: 'high', dueDate: '2 dias' },
  { id: '2', type: 'signature', title: 'Assinatura Pendente', description: 'Contrato de Prestação de Serviços - Dr. Silva', priority: 'high', dueDate: '1 dia' },
  { id: '3', type: 'contract', title: 'Contrato Vencendo', description: 'Locação Sala 302 - Renovar em 15 dias', priority: 'medium', dueDate: '15 dias' },
  { id: '4', type: 'request', title: 'Solicitação Pendente', description: 'Parecer jurídico - Departamento RH', priority: 'medium', dueDate: '3 dias' },
];

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'deadline': return Clock;
    case 'contract': return FileText;
    case 'request': return MessageSquare;
    case 'signature': return FileSignature;
    default: return AlertTriangle;
  }
};

const getPriorityColor = (priority: Alert['priority']) => {
  switch (priority) {
    case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  }
};

export default function LegalOverviewDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Processos Ativos"
          value={24}
          subtitle="3 com prazo crítico"
          icon={Gavel}
          trend={{ value: '-2', isPositive: true }}
          color="text-blue-600"
        />
        <KPICard
          title="Contratos Ativos"
          value={156}
          subtitle="12 vencendo em 30 dias"
          icon={FileText}
          trend={{ value: '+8%', isPositive: true }}
          color="text-emerald-600"
        />
        <KPICard
          title="Solicitações Pendentes"
          value={18}
          subtitle="SLA médio: 2.3 dias"
          icon={MessageSquare}
          trend={{ value: '-15%', isPositive: true }}
          color="text-amber-600"
        />
        <KPICard
          title="Aguardando Assinatura"
          value={7}
          subtitle="via Clicksign"
          icon={FileSignature}
          trend={{ value: '+3', isPositive: false }}
          color="text-purple-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alerts Panel */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Alertas e Pendências
              </CardTitle>
              <Badge variant="secondary">{mockAlerts.length} itens</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAlerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getPriorityColor(alert.priority)}`}>
                    <AlertIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {alert.dueDate}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SLA de Contratos</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processos Favoráveis</span>
                <span className="font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solicitações no Prazo</span>
                <span className="font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Tarefas concluídas</span>
                </div>
                <span className="font-semibold">47</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">Em andamento</span>
                </div>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span className="text-sm">Atrasadas</span>
                </div>
                <span className="font-semibold">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
