import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Shield,
  Bell,
  Globe,
  Key,
  Webhook,
  Save,
  TestTube,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NeoPaySettings() {
  const [selectedTab, setSelectedTab] = useState('gateway');

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleTestConnection = () => {
    toast.info('Testando conexão com gateway...');
    setTimeout(() => {
      toast.success('Conexão estabelecida com sucesso!');
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configure o gateway de pagamentos e preferências</p>
        </div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="gateway">Gateway</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Gateway Settings */}
        <TabsContent value="gateway" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuração do Gateway
              </CardTitle>
              <CardDescription>
                Configure as credenciais e parâmetros do gateway de pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Select defaultValue="mock">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mock">Mock (Desenvolvimento)</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="asaas">Asaas</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select defaultValue="sandbox">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Credenciais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input type="password" placeholder="sk_test_..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input type="password" placeholder="••••••••••••••••" />
                  </div>
                </div>
                <Button variant="outline" onClick={handleTestConnection}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar Conexão
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800">Gateway Configurado</p>
                  <p className="text-sm text-emerald-700">Modo de desenvolvimento ativo. Nenhuma transação real será processada.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Configure os métodos de pagamento aceitos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'credit_card', label: 'Cartão de Crédito', enabled: true },
                { id: 'debit_card', label: 'Cartão de Débito', enabled: true },
                { id: 'pix', label: 'PIX', enabled: true },
                { id: 'boleto', label: 'Boleto Bancário', enabled: false },
              ].map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{method.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.enabled ? 'Ativo' : 'Desativado'}
                    </p>
                  </div>
                  <Switch defaultChecked={method.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parcelamento</CardTitle>
              <CardDescription>Configure as opções de parcelamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Parcelas</Label>
                  <Select defaultValue="12">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parcelas sem Juros</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Mínimo para Parcelamento (R$)</Label>
                <Input type="number" defaultValue="100" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>Configure quando e como receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'payment_success', label: 'Pagamento Aprovado', description: 'Notificar quando um pagamento for aprovado' },
                { id: 'payment_failed', label: 'Pagamento Falhou', description: 'Notificar quando um pagamento falhar' },
                { id: 'chargeback', label: 'Novo Chargeback', description: 'Alertar sobre novos chargebacks' },
                { id: 'refund', label: 'Reembolso Solicitado', description: 'Notificar solicitações de reembolso' },
                { id: 'delinquency', label: 'Inadimplência', description: 'Alertar sobre cobranças em atraso' },
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

          <Card>
            <CardHeader>
              <CardTitle>E-mails de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>E-mails para Notificação (separados por vírgula)</Label>
                <Input placeholder="admin@empresa.com, financeiro@empresa.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>Configurações de segurança e conformidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Tokenização de Cartões</p>
                  <p className="text-sm text-muted-foreground">Armazena dados de cartão de forma segura no gateway</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">3D Secure</p>
                  <p className="text-sm text-muted-foreground">Autenticação adicional para transações de cartão</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Logs de Auditoria</p>
                  <p className="text-sm text-muted-foreground">Registra todas as operações financeiras</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Conformidade LGPD</p>
                  <p className="text-sm text-muted-foreground">Proteção de dados pessoais</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Settings */}
        <TabsContent value="webhooks" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Configure endpoints para receber eventos do gateway</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <Input placeholder="https://api.seusite.com/webhooks/neopay" />
              </div>
              <div className="space-y-2">
                <Label>Secret do Webhook</Label>
                <div className="flex gap-2">
                  <Input type="password" defaultValue="whsec_xxxxxxxxxxxxx" />
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Novo
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Eventos Assinados</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['payment.success', 'payment.failed', 'refund.created', 'chargeback.created', 'subscription.renewed', 'subscription.cancelled'].map((event) => (
                    <div key={event} className="flex items-center gap-2 p-2 border rounded">
                      <Switch defaultChecked />
                      <span className="text-sm font-mono">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
