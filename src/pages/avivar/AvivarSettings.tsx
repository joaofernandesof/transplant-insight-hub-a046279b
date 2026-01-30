/**
 * AvivarSettings - Configurações do portal Avivar
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Bell, 
  Bot, 
  MessageSquare, 
  Users, 
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function AvivarSettings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Configurações
          <Sparkles className="h-5 w-5 text-purple-400" />
        </h1>
        <p className="text-purple-300/60">Personalize o comportamento do portal AVIVAR</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-purple-900/30 border border-purple-500/30">
          <TabsTrigger value="general" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Bot className="h-4 w-4 mr-2" />
            IA
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-gradient-to-br from-purple-950/50 to-violet-950/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Configurações Gerais</CardTitle>
              <CardDescription className="text-purple-300/60">Ajustes básicos do portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-purple-200">Nome da Empresa</Label>
                <Input 
                  placeholder="Sua empresa" 
                  className="bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400/40 focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-purple-200">E-mail de contato</Label>
                <Input 
                  type="email"
                  placeholder="contato@empresa.com" 
                  className="bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400/40 focus:border-purple-400"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Modo escuro</p>
                  <p className="text-sm text-purple-300/60">Sempre ativo para visual IA</p>
                </div>
                <Switch checked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="bg-gradient-to-br from-purple-950/50 to-violet-950/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                Configurações da IA
              </CardTitle>
              <CardDescription className="text-purple-300/60">Ajuste o comportamento da inteligência artificial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div>
                  <p className="font-medium text-white">Resposta Automática</p>
                  <p className="text-sm text-purple-300/60">IA responde leads automaticamente fora do horário</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div>
                  <p className="font-medium text-white">Qualificação Automática</p>
                  <p className="text-sm text-purple-300/60">IA classifica leads em quente/morno/frio</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div>
                  <p className="font-medium text-white">Sugestões de Follow-up</p>
                  <p className="text-sm text-purple-300/60">IA sugere próximos passos com cada lead</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-gradient-to-br from-purple-950/50 to-violet-950/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Notificações</CardTitle>
              <CardDescription className="text-purple-300/60">Configure como receber alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div>
                  <p className="font-medium text-white">Novo Lead</p>
                  <p className="text-sm text-purple-300/60">Notificar quando um novo lead chegar</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div>
                  <p className="font-medium text-white">Mensagem Recebida</p>
                  <p className="text-sm text-purple-300/60">Notificar novas mensagens de leads</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div>
                  <p className="font-medium text-white">Tarefa Atrasada</p>
                  <p className="text-sm text-purple-300/60">Alertar sobre tarefas vencidas</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="bg-gradient-to-br from-purple-950/50 to-violet-950/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Integrações</CardTitle>
              <CardDescription className="text-purple-300/60">Conecte ferramentas externas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">WhatsApp Business</p>
                    <p className="text-sm text-purple-300/60">Conectado</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20">
                  Configurar
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Instagram</p>
                    <p className="text-sm text-purple-300/60">Não conectado</p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500">
                  Conectar
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-purple-500/20 bg-purple-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Google Ads</p>
                    <p className="text-sm text-purple-300/60">Não conectado</p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500">
                  Conectar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
