/**
 * VoipSettingsTab - Configurações de Integrações, Filas e Compliance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings,
  Link2,
  Phone,
  Shield,
  Clock,
  Database,
  Webhook,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Users,
  Volume2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data
const providers = [
  { id: 'twilio', name: 'Twilio', status: 'connected', logo: '🔵' },
  { id: 'vonage', name: 'Vonage', status: 'disconnected', logo: '🟣' },
  { id: '8x8', name: '8x8', status: 'disconnected', logo: '🟢' },
];

const extensions = [
  { id: '1', extension: '101', user: 'Ana Silva', status: 'active' },
  { id: '2', extension: '102', user: 'Carlos Santos', status: 'active' },
  { id: '3', extension: '103', user: 'Maria Oliveira', status: 'active' },
  { id: '4', extension: '104', user: 'João Pedro', status: 'inactive' },
  { id: '5', extension: '105', user: 'Fernanda Lima', status: 'active' },
];

const queues = [
  { id: '1', name: 'Comercial', strategy: 'longest-idle', agents: 3, status: 'active' },
  { id: '2', name: 'Suporte', strategy: 'skills-based', agents: 2, status: 'active' },
  { id: '3', name: 'Pós-Venda', strategy: 'round-robin', agents: 2, status: 'active' },
  { id: '4', name: 'Agendamento', strategy: 'longest-idle', agents: 1, status: 'active' },
];

const webhooks = [
  { id: '1', event: 'call.initiated', url: 'https://api.neohub.com/webhooks/voip/call-started', status: 'active' },
  { id: '2', event: 'call.completed', url: 'https://api.neohub.com/webhooks/voip/call-ended', status: 'active' },
  { id: '3', event: 'transcript.ready', url: 'https://api.neohub.com/webhooks/voip/transcript', status: 'active' },
  { id: '4', event: 'analysis.completed', url: 'https://api.neohub.com/webhooks/voip/analysis', status: 'active' },
];

export default function VoipSettingsTab() {
  const [selectedProvider, setSelectedProvider] = useState('twilio');

  return (
    <Tabs defaultValue="integrations" className="space-y-6">
      <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] p-1 flex-wrap">
        <TabsTrigger 
          value="integrations" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Integrações
        </TabsTrigger>
        <TabsTrigger 
          value="extensions" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Phone className="h-4 w-4 mr-2" />
          Ramais
        </TabsTrigger>
        <TabsTrigger 
          value="queues" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Filas
        </TabsTrigger>
        <TabsTrigger 
          value="webhooks" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Webhook className="h-4 w-4 mr-2" />
          Webhooks
        </TabsTrigger>
        <TabsTrigger 
          value="compliance" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Shield className="h-4 w-4 mr-2" />
          Compliance
        </TabsTrigger>
        <TabsTrigger 
          value="retention" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Database className="h-4 w-4 mr-2" />
          Retenção
        </TabsTrigger>
      </TabsList>

      {/* Integrações CPaaS */}
      <TabsContent value="integrations" className="space-y-6">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Provedor de Telefonia (CPaaS)</CardTitle>
            <CardDescription>Configure a integração com seu provedor de telefonia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary))]'
                      : 'bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{provider.logo}</span>
                    {provider.status === 'connected' ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[hsl(var(--avivar-muted-foreground))]">
                        <XCircle className="h-3 w-3 mr-1" />
                        Desconectado
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">{provider.name}</p>
                </div>
              ))}
            </div>

            {selectedProvider === 'twilio' && (
              <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] space-y-4">
                <div className="flex items-center gap-2 text-green-500 mb-4">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Twilio conectado</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account SID</Label>
                    <Input 
                      value="AC••••••••••••••••••••••••••••ab12"
                      disabled
                      className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Auth Token</Label>
                    <Input 
                      type="password"
                      value="••••••••••••••••••••••••••••••••"
                      disabled
                      className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </Button>
                  <Button variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500/10">
                    Desconectar
                  </Button>
                </div>
              </div>
            )}

            {selectedProvider !== 'twilio' && (
              <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Key / Account ID</Label>
                    <Input 
                      placeholder="Insira sua chave de API..."
                      className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret / Auth Token</Label>
                    <Input 
                      type="password"
                      placeholder="Insira seu token secreto..."
                      className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                </div>
                <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Ramais */}
      <TabsContent value="extensions" className="space-y-6">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Ramais Virtuais</CardTitle>
                <CardDescription>Gerencie os ramais dos operadores</CardDescription>
              </div>
              <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Ramal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {extensions.map((ext) => (
                  <div
                    key={ext.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)] flex items-center justify-center">
                        <Phone className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[hsl(var(--avivar-foreground))]">Ramal {ext.extension}</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{ext.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        ext.status === 'active' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }>
                        {ext.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Filas */}
      <TabsContent value="queues" className="space-y-6">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Filas de Atendimento</CardTitle>
                <CardDescription>Configure as filas e estratégias de distribuição</CardDescription>
              </div>
              <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                <Plus className="h-4 w-4 mr-2" />
                Nova Fila
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {queues.map((queue) => (
                  <div
                    key={queue.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)] flex items-center justify-center">
                        <Users className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{queue.name}</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                          {queue.agents} agentes • {queue.strategy.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select defaultValue={queue.strategy}>
                        <SelectTrigger className="w-[180px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="longest-idle">Longest Idle</SelectItem>
                          <SelectItem value="round-robin">Round Robin</SelectItem>
                          <SelectItem value="skills-based">Skills Based</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Webhooks */}
      <TabsContent value="webhooks" className="space-y-6">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Webhooks</CardTitle>
                <CardDescription>Configure endpoints para receber eventos em tempo real</CardDescription>
              </div>
              <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Webhook
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)] flex items-center justify-center">
                        <Webhook className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{webhook.event}</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] font-mono truncate max-w-[300px]">
                          {webhook.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                      <Button size="sm" variant="outline">
                        Testar
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Compliance */}
      <TabsContent value="compliance" className="space-y-6">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Configurações de Compliance
            </CardTitle>
            <CardDescription>Garanta conformidade com regulamentos de telecomunicações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Gravação Obrigatória</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Todas as chamadas serão gravadas automaticamente
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Aviso de Gravação</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Reproduzir aviso no início de cada chamada
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">LGPD - Consentimento</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Solicitar consentimento para armazenamento de dados
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Lista DNC (Do Not Call)</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Verificar números contra lista de bloqueio
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Horário de Discagem Permitido</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Início</Label>
                  <Input 
                    type="time" 
                    defaultValue="08:00"
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Fim</Label>
                  <Input 
                    type="time" 
                    defaultValue="20:00"
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  />
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                Chamadas outbound só serão realizadas dentro deste horário
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Retenção de Dados */}
      <TabsContent value="retention" className="space-y-6">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Database className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Políticas de Retenção
            </CardTitle>
            <CardDescription>Configure quanto tempo os dados serão armazenados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">Gravações de Áudio</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                        Arquivos de áudio das chamadas
                      </p>
                    </div>
                  </div>
                  <Select defaultValue="365">
                    <SelectTrigger className="w-[150px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="730">2 anos</SelectItem>
                      <SelectItem value="forever">Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  <Database className="h-3 w-3" />
                  <span>Uso atual: 12.5 GB de 50 GB</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">Transcrições</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                        Texto das transcrições de chamadas
                      </p>
                    </div>
                  </div>
                  <Select defaultValue="730">
                    <SelectTrigger className="w-[150px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">180 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="730">2 anos</SelectItem>
                      <SelectItem value="forever">Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">Dados Analíticos</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                        Métricas, scores e insights de IA
                      </p>
                    </div>
                  </div>
                  <Select defaultValue="forever">
                    <SelectTrigger className="w-[150px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="730">2 anos</SelectItem>
                      <SelectItem value="1825">5 anos</SelectItem>
                      <SelectItem value="forever">Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Atenção</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Dados excluídos não podem ser recuperados. Certifique-se de exportar dados importantes antes da exclusão automática.
                  </p>
                </div>
              </div>
            </div>

            <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Import for BarChart3 icon
import { BarChart3 } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
