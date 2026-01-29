/**
 * IPROMED Financial - Alertas e Rotina Financeira
 * Alertas de vencimento e rotina semanal
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Send,
  DollarSign,
  Users,
  ArrowRight,
  Settings,
} from "lucide-react";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  type: 'due_soon' | 'overdue' | 'payment_pending' | 'collection_needed';
  title: string;
  description: string;
  date: string;
  amount?: number;
  priority: 'high' | 'medium' | 'low';
  client?: string;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'overdue', title: 'Título vencido há 15 dias', description: 'Clínica ABC - Mensalidade Consultivo', date: '2026-01-14', amount: 3500, priority: 'high', client: 'Clínica ABC' },
  { id: '2', type: 'due_soon', title: 'Vence amanhã', description: 'Dr. João Silva - Honorários', date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 5000, priority: 'high', client: 'Dr. João Silva' },
  { id: '3', type: 'due_soon', title: 'Vence em 3 dias', description: 'Pró-labore - Janeiro', date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), amount: 15000, priority: 'medium' },
  { id: '4', type: 'collection_needed', title: 'Reenviar cobrança', description: '3 dias sem resposta - Hospital XYZ', date: '2026-01-25', amount: 8500, priority: 'medium', client: 'Hospital XYZ' },
  { id: '5', type: 'payment_pending', title: 'Pagamento agendado', description: 'Perito - Processo 001', date: format(addDays(new Date(), 5), 'yyyy-MM-dd'), amount: 3500, priority: 'low' },
];

const weeklyTasks = [
  { id: '1', day: 'Segunda', tasks: ['Conferir inadimplentes', 'Revisar títulos vencidos'], completed: true },
  { id: '2', day: 'Terça', tasks: ['Reenviar cobranças pendentes'], completed: true },
  { id: '3', day: 'Quarta', tasks: ['Conciliação bancária', 'Baixar pagamentos'], completed: false },
  { id: '4', day: 'Quinta', tasks: ['Renegociar títulos atrasados'], completed: false },
  { id: '5', day: 'Sexta', tasks: ['Fechamento semanal', 'Emitir notas fiscais'], completed: false },
];

const alertSettings = [
  { id: '1', name: 'Vencimento em 3 dias', description: 'Alerta para contas a pagar/receber', active: true },
  { id: '2', name: 'Vencimento hoje', description: 'Lembrete no dia do vencimento', active: true },
  { id: '3', name: 'Título vencido', description: 'Alerta imediato ao vencer', active: true },
  { id: '4', name: 'Sem resposta (3 dias)', description: 'Cliente não respondeu cobrança', active: true },
  { id: '5', name: 'Resumo diário', description: 'E-mail às 8h com pendências', active: false },
  { id: '6', name: 'Resumo semanal', description: 'E-mail segunda-feira', active: true },
];

const typeConfig = {
  due_soon: { label: 'A Vencer', color: 'bg-amber-100 text-amber-700', icon: Clock },
  overdue: { label: 'Vencido', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
  payment_pending: { label: 'Pagamento', color: 'bg-blue-100 text-blue-700', icon: DollarSign },
  collection_needed: { label: 'Cobrança', color: 'bg-purple-100 text-purple-700', icon: Send },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function FinancialAlerts() {
  const [activeTab, setActiveTab] = useState('alerts');

  const priorityCount = {
    high: mockAlerts.filter(a => a.priority === 'high').length,
    medium: mockAlerts.filter(a => a.priority === 'medium').length,
    low: mockAlerts.filter(a => a.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-600" />
            Alertas e Rotina Financeira
          </h2>
          <p className="text-sm text-muted-foreground">
            Alertas de vencimento e rotina semanal para manter as finanças em dia
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3 text-rose-500" />
          {priorityCount.high} alertas urgentes
        </Badge>
      </div>

      {/* Priority Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-rose-700">{priorityCount.high}</p>
            <p className="text-sm text-rose-600">Alta Prioridade</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{priorityCount.medium}</p>
            <p className="text-sm text-amber-600">Média Prioridade</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{priorityCount.low}</p>
            <p className="text-sm text-blue-600">Baixa Prioridade</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts">Alertas Ativos</TabsTrigger>
          <TabsTrigger value="routine">Rotina Semanal</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          {mockAlerts.map(alert => {
            const type = typeConfig[alert.type];
            const TypeIcon = type.icon;
            const alertDate = new Date(alert.date);
            
            return (
              <Card 
                key={alert.id}
                className={`border-l-4 ${
                  alert.priority === 'high' ? 'border-l-rose-500' : 
                  alert.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {isToday(alertDate) ? 'Hoje' : 
                             isTomorrow(alertDate) ? 'Amanhã' : 
                             format(alertDate, "dd/MM", { locale: ptBR })}
                          </Badge>
                          {alert.client && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {alert.client}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {alert.amount && (
                        <span className="font-bold text-lg">{formatCurrency(alert.amount)}</span>
                      )}
                      <Button size="sm" className="gap-1">
                        Resolver
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Routine Tab */}
        <TabsContent value="routine" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Rotina Financeira Semanal
              </CardTitle>
              <CardDescription>
                Tarefas recorrentes para manter o financeiro organizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyTasks.map(day => (
                  <div 
                    key={day.id}
                    className={`p-4 border rounded-lg ${day.completed ? 'bg-emerald-50 border-emerald-200' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{day.day}</span>
                      {day.completed && (
                        <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {day.tasks.map((task, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Alertas
              </CardTitle>
              <CardDescription>
                Personalize quais alertas deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertSettings.map(setting => (
                  <div 
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{setting.name}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch defaultChecked={setting.active} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
