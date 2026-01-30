import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Bell,
  Users,
  Zap,
  Save,
  Instagram,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NeoCrmSettings() {
  const [selectedTab, setSelectedTab] = useState('integrations');

  const handleSave = () => {
    toast.success('Configurações salvas!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configure o CRM de vendas</p>
        </div>
        <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="automations">Automações</TabsTrigger>
        </TabsList>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                WhatsApp Business
              </CardTitle>
              <CardDescription>Conecte sua conta do WhatsApp Business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">WhatsApp API</p>
                  <p className="text-sm text-muted-foreground">Envie e receba mensagens automaticamente</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Token de Acesso</Label>
                <Input type="password" placeholder="EAAxxxxx..." />
              </div>
              <div className="space-y-2">
                <Label>Número do Telefone</Label>
                <Input placeholder="+55 11 99999-9999" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-500" />
                Instagram Direct
              </CardTitle>
              <CardDescription>Integre mensagens do Instagram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Instagram API</p>
                  <p className="text-sm text-muted-foreground">Receba DMs diretamente no CRM</p>
                </div>
                <Switch />
              </div>
              <Button variant="outline">Conectar Conta Instagram</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>Configure quando receber alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'new_lead', label: 'Novo Lead', description: 'Quando um novo lead entrar' },
                { id: 'new_message', label: 'Nova Mensagem', description: 'Quando receber mensagens' },
                { id: 'task_due', label: 'Tarefa Atrasada', description: 'Quando uma tarefa estiver atrasada' },
                { id: 'lead_converted', label: 'Lead Convertido', description: 'Quando converter uma venda' },
              ].map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{notification.label}</p>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe de Vendas
              </CardTitle>
              <CardDescription>Gerencie os membros da equipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['João Vendedor', 'Maria Consultora', 'Carlos Atendente'].map((name, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">Vendedor</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations */}
        <TabsContent value="automations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Automações
              </CardTitle>
              <CardDescription>Configure respostas e ações automáticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'auto_reply', label: 'Resposta Automática', description: 'Responder leads novos automaticamente' },
                { id: 'lead_assignment', label: 'Distribuição de Leads', description: 'Atribuir leads automaticamente' },
                { id: 'follow_up', label: 'Follow-up Automático', description: 'Criar tarefas de follow-up' },
                { id: 'status_update', label: 'Atualização de Status', description: 'Mover leads automaticamente' },
              ].map((automation) => (
                <div key={automation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{automation.label}</p>
                    <p className="text-sm text-muted-foreground">{automation.description}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
