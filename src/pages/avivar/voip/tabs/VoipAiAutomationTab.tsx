/**
 * VoipAiAutomationTab - Configuração de Agentes de Voz IA e Scripts
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Bot,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  Volume2,
  Play,
  Pause,
  Settings,
  Zap,
  MessageSquare,
  Calendar,
  ClipboardList,
  Clock,
  Users,
  Sparkles,
  Edit,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data
const aiAgents = [
  {
    id: '1',
    name: 'Ana Recepcionista',
    type: 'inbound',
    status: 'active',
    voice: 'pt-BR-FranciscaNeural',
    callsToday: 45,
    avgDuration: '2:30',
    transferRate: '18%',
  },
  {
    id: '2',
    name: 'Carlos Confirmação',
    type: 'outbound',
    status: 'active',
    voice: 'pt-BR-AntonioNeural',
    callsToday: 120,
    avgDuration: '1:15',
    transferRate: '5%',
  },
  {
    id: '3',
    name: 'Maria Pesquisa NPS',
    type: 'outbound',
    status: 'paused',
    voice: 'pt-BR-FranciscaNeural',
    callsToday: 0,
    avgDuration: '0:00',
    transferRate: '0%',
  },
];

const voiceOptions = [
  { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Feminina)', lang: 'Português BR' },
  { id: 'pt-BR-AntonioNeural', name: 'Antonio (Masculino)', lang: 'Português BR' },
  { id: 'pt-BR-ManuelaNeural', name: 'Manuela (Feminina)', lang: 'Português BR' },
  { id: 'pt-BR-NicolauNeural', name: 'Nicolau (Masculino)', lang: 'Português BR' },
];

const scriptTemplates = [
  {
    id: '1',
    name: 'Atendimento Inicial',
    description: 'Qualificação de leads e direcionamento',
    steps: ['Saudação', 'Identificação', 'Qualificação', 'Encaminhamento'],
  },
  {
    id: '2',
    name: 'Confirmação de Consulta',
    description: 'Confirmar agendamentos do dia seguinte',
    steps: ['Saudação', 'Confirmação', 'Lembrete', 'Despedida'],
  },
  {
    id: '3',
    name: 'Pesquisa de Satisfação',
    description: 'NPS e feedback pós-procedimento',
    steps: ['Apresentação', 'Pergunta NPS', 'Feedback', 'Agradecimento'],
  },
];

export default function VoipAiAutomationTab() {
  const [selectedAgent, setSelectedAgent] = useState<typeof aiAgents[0] | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const [voicePitch, setVoicePitch] = useState([1.0]);
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Bot className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">2</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Agentes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                <PhoneIncoming className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">165</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Ligações Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">1:52</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Duração Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Users className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">12%</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa Transferência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Agentes IA */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <Bot className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Agentes de Voz IA
              </CardTitle>
              <Button size="sm" className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {aiAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary))]'
                        : 'bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium text-[hsl(var(--avivar-foreground))]">{agent.name}</span>
                      </div>
                      <Badge variant="outline" className={
                        agent.type === 'inbound' 
                          ? 'border-blue-500/30 text-blue-500' 
                          : 'border-green-500/30 text-green-500'
                      }>
                        {agent.type === 'inbound' ? 'Inbound' : 'Outbound'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      <div>
                        <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{agent.callsToday}</p>
                        <p>ligações</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{agent.avgDuration}</p>
                        <p>duração</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{agent.transferRate}</p>
                        <p>transf.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Configuração do Agente */}
        <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">
              {selectedAgent ? `Configurar: ${selectedAgent.name}` : 'Configuração do Agente'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAgent ? (
              <Tabs defaultValue="voice" className="space-y-4">
                <TabsList className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                  <TabsTrigger value="voice" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                    <Mic className="h-4 w-4 mr-2" />
                    Voz
                  </TabsTrigger>
                  <TabsTrigger value="script" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Script
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Horários
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                    <Zap className="h-4 w-4 mr-2" />
                    Ações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="voice" className="space-y-6">
                  {/* Seleção de Voz */}
                  <div className="space-y-2">
                    <Label>Voz do Agente</Label>
                    <Select defaultValue={selectedAgent.voice}>
                      <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center gap-2">
                              <span>{voice.name}</span>
                              <span className="text-xs text-muted-foreground">({voice.lang})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Controles de Voz */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Velocidade</Label>
                        <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{voiceSpeed[0].toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={voiceSpeed}
                        onValueChange={setVoiceSpeed}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Tom</Label>
                        <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{voicePitch[0].toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={voicePitch}
                        onValueChange={setVoicePitch}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                      />
                    </div>
                  </div>

                  {/* Teste de Voz */}
                  <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <Label className="mb-3 block">Testar Voz</Label>
                    <div className="flex gap-3">
                      <Input 
                        placeholder="Digite um texto para testar..."
                        defaultValue="Olá! Seja bem-vindo à NeoFolic. Como posso ajudá-lo hoje?"
                        className="flex-1 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                      />
                      <Button 
                        className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                        onClick={() => setIsTestPlaying(!isTestPlaying)}
                      >
                        {isTestPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Status do Agente */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Agente Ativo</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                          Pronto para atender chamadas automaticamente
                        </p>
                      </div>
                    </div>
                    <Switch checked={selectedAgent.status === 'active'} />
                  </div>
                </TabsContent>

                <TabsContent value="script" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem Inicial</Label>
                    <Textarea 
                      placeholder="O que o agente diz ao atender..."
                      className="min-h-[100px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                      defaultValue="Olá! Bem-vindo à NeoFolic, especialista em transplante capilar. Meu nome é Ana, como posso ajudar você hoje?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instruções do Agente</Label>
                    <Textarea 
                      placeholder="Defina o comportamento e personalidade..."
                      className="min-h-[150px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                      defaultValue="Você é uma recepcionista simpática e profissional da clínica NeoFolic. Seu objetivo é:
1. Identificar o interesse do cliente
2. Qualificar se é um lead quente (interesse em procedimento)
3. Coletar informações básicas (nome, telefone)
4. Agendar uma avaliação gratuita
5. Transferir para um consultor humano quando necessário"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Templates de Script</Label>
                    <div className="grid gap-2">
                      {scriptTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] cursor-pointer"
                        >
                          <div>
                            <p className="font-medium text-[hsl(var(--avivar-foreground))]">{template.name}</p>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {template.steps.map((step, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {step}
                                </Badge>
                              ))}
                            </div>
                            <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Atendimento 24/7</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                          O agente atende chamadas a qualquer hora
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Ou defina horários específicos:</Label>
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
                      <div key={day} className="flex items-center gap-4 p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                        <Switch defaultChecked={day !== 'Sábado'} />
                        <span className="w-20 text-sm font-medium text-[hsl(var(--avivar-foreground))]">{day}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Input type="time" defaultValue="08:00" className="w-28 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" />
                          <span className="text-[hsl(var(--avivar-muted-foreground))]">até</span>
                          <Input type="time" defaultValue="18:00" className="w-28 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">Agendar Consulta</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            Permite que o agente agende diretamente na agenda
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">Transferir para Humano</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            Transfere quando não conseguir resolver
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">Criar Lead no CRM</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            Registra automaticamente novos leads
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">Enviar SMS/WhatsApp</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            Envia mensagem de confirmação após agendar
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Bot className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mb-4" />
                <p className="text-[hsl(var(--avivar-muted-foreground))]">
                  Selecione um agente para configurar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
