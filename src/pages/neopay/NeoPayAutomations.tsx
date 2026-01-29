import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  Ban,
  Bell,
  Key,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockAutomations = [
  { 
    id: '1', 
    name: 'Liberar Acesso Premium', 
    description: 'Libera acesso ao conteúdo premium após pagamento aprovado',
    triggerEvent: 'payment_approved', 
    actionType: 'grant_access', 
    isActive: true,
    executionsToday: 12,
  },
  { 
    id: '2', 
    name: 'Alerta de Falha', 
    description: 'Envia notificação para equipe quando pagamento falha',
    triggerEvent: 'payment_failed', 
    actionType: 'send_notification', 
    isActive: true,
    executionsToday: 3,
  },
  { 
    id: '3', 
    name: 'Bloqueio por Inadimplência', 
    description: 'Bloqueia acesso após 30 dias de inadimplência',
    triggerEvent: 'delinquent', 
    actionType: 'block_user', 
    isActive: true,
    executionsToday: 1,
  },
  { 
    id: '4', 
    name: 'Notificação de Chargeback', 
    description: 'Alerta administradores sobre novo chargeback',
    triggerEvent: 'chargeback', 
    actionType: 'send_notification', 
    isActive: false,
    executionsToday: 0,
  },
  { 
    id: '5', 
    name: 'Renovar Assinatura', 
    description: 'Renova automaticamente acesso após pagamento recorrente',
    triggerEvent: 'subscription_renewed', 
    actionType: 'grant_access', 
    isActive: true,
    executionsToday: 8,
  },
];

const triggerConfig = {
  payment_approved: { label: 'Pagamento Aprovado', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  payment_failed: { label: 'Pagamento Falhou', icon: XCircle, color: 'bg-red-100 text-red-700' },
  chargeback: { label: 'Chargeback Recebido', icon: Ban, color: 'bg-purple-100 text-purple-700' },
  delinquent: { label: 'Inadimplência', icon: Ban, color: 'bg-amber-100 text-amber-700' },
  subscription_renewed: { label: 'Assinatura Renovada', icon: CheckCircle2, color: 'bg-blue-100 text-blue-700' },
};

const actionConfig = {
  grant_access: { label: 'Liberar Acesso', icon: Key },
  revoke_access: { label: 'Revogar Acesso', icon: Ban },
  send_notification: { label: 'Enviar Notificação', icon: Bell },
  block_user: { label: 'Bloquear Usuário', icon: Ban },
};

export default function NeoPayAutomations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleToggleAutomation = (id: string, currentState: boolean) => {
    toast.success(currentState ? 'Automação desativada' : 'Automação ativada');
  };

  const handleCreateAutomation = () => {
    toast.success('Automação criada com sucesso!');
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Automações</h1>
          <p className="text-muted-foreground">Configure ações automáticas baseadas em eventos de pagamento</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Automação</DialogTitle>
              <DialogDescription>
                Configure uma nova regra de automação
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Automação</Label>
                <Input placeholder="Ex: Liberar acesso após pagamento" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input placeholder="Descrição da automação" />
              </div>
              <div className="space-y-2">
                <Label>Evento Gatilho</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_approved">Pagamento Aprovado</SelectItem>
                    <SelectItem value="payment_failed">Pagamento Falhou</SelectItem>
                    <SelectItem value="chargeback">Chargeback Recebido</SelectItem>
                    <SelectItem value="delinquent">Inadimplência (30+ dias)</SelectItem>
                    <SelectItem value="subscription_renewed">Assinatura Renovada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant_access">Liberar Acesso</SelectItem>
                    <SelectItem value="revoke_access">Revogar Acesso</SelectItem>
                    <SelectItem value="send_notification">Enviar Notificação</SelectItem>
                    <SelectItem value="block_user">Bloquear Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativar automação</Label>
                <Switch defaultChecked />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAutomation} className="bg-emerald-600">
                Criar Automação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{mockAutomations.filter(a => a.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Automações Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Play className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockAutomations.reduce((sum, a) => sum + a.executionsToday, 0)}</p>
                <p className="text-xs text-muted-foreground">Execuções Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAutomations.map((automation) => {
          const trigger = triggerConfig[automation.triggerEvent as keyof typeof triggerConfig];
          const action = actionConfig[automation.actionType as keyof typeof actionConfig];
          const TriggerIcon = trigger?.icon || Zap;
          const ActionIcon = action?.icon || Zap;

          return (
            <Card key={automation.id} className={!automation.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${trigger?.color || 'bg-gray-100'}`}>
                      <TriggerIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.name}</CardTitle>
                      <CardDescription className="text-xs">{automation.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => handleToggleAutomation(automation.id, automation.isActive)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className={trigger?.color}>
                      <TriggerIcon className="h-3 w-3 mr-1" />
                      {trigger?.label}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline">
                      <ActionIcon className="h-3 w-3 mr-1" />
                      {action?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Execuções hoje: {automation.executionsToday}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
