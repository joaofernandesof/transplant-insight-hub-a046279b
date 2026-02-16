/**
 * VoipSettingsTab - Now includes Vapi.ai voice agent configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings,
  Link2,
  Phone,
  Shield,
  Clock,
  Bot,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Users,
  Save,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVoiceCalls, type VoiceAgentConfig } from '@/hooks/useVoiceCalls';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';

export default function VoipSettingsTab() {
  const { accountId } = useAvivarAccount();
  const { config, saveConfig, isLoading } = useVoiceCalls(accountId || undefined);

  const [localConfig, setLocalConfig] = useState({
    name: 'Agente de Vendas',
    vapi_phone_number_id: '',
    vapi_assistant_id: '',
    voice_id: 'pFZP5JQG7iQjIQuC4Bku',
    language: 'pt-BR',
    greeting_template: 'Olá, {{lead_name}}! Aqui é {{agent_name}} da {{company_name}}. Tudo bem?',
    company_name: '',
    agent_name: '',
    qualification_questions: [
      { id: 'q1', question: 'Você está buscando esse tipo de serviço para você mesmo(a)?', type: 'open' },
      { id: 'q2', question: 'Qual é o seu principal objetivo ou preocupação?', type: 'open' },
      { id: 'q3', question: 'Você tem disponibilidade para uma consulta essa semana?', type: 'open' },
    ],
    auto_trigger_enabled: false,
    max_daily_calls: 50,
    business_hours_start: '09:00',
    business_hours_end: '18:00',
  });

  useEffect(() => {
    if (config) {
      setLocalConfig({
        name: config.name || 'Agente de Vendas',
        vapi_phone_number_id: config.vapi_phone_number_id || '',
        vapi_assistant_id: config.vapi_assistant_id || '',
        voice_id: config.voice_id || 'pFZP5JQG7iQjIQuC4Bku',
        language: config.language || 'pt-BR',
        greeting_template: config.greeting_template || localConfig.greeting_template,
        company_name: config.company_name || '',
        agent_name: config.agent_name || '',
        qualification_questions: config.qualification_questions || localConfig.qualification_questions,
        auto_trigger_enabled: config.auto_trigger_enabled || false,
        max_daily_calls: config.max_daily_calls || 50,
        business_hours_start: config.business_hours_start || '09:00',
        business_hours_end: config.business_hours_end || '18:00',
      });
    }
  }, [config]);

  const handleSave = async () => {
    await saveConfig(localConfig as any);
  };

  const updateQuestion = (index: number, question: string) => {
    const updated = [...localConfig.qualification_questions];
    updated[index] = { ...updated[index], question };
    setLocalConfig(prev => ({ ...prev, qualification_questions: updated }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-[hsl(var(--avivar-muted-foreground))]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Vapi Connection */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Conexão Vapi.ai
          </CardTitle>
          <CardDescription>Configure sua conta Vapi para chamadas telefônicas com IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-green-500 font-medium">API Key configurada</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Phone Number ID (Vapi)</Label>
              <Input
                value={localConfig.vapi_phone_number_id}
                onChange={e => setLocalConfig(prev => ({ ...prev, vapi_phone_number_id: e.target.value }))}
                placeholder="Seu Phone Number ID do Vapi Dashboard"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                Encontre em dashboard.vapi.ai → Phone Numbers
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Assistant ID (opcional)</Label>
              <Input
                value={localConfig.vapi_assistant_id}
                onChange={e => setLocalConfig(prev => ({ ...prev, vapi_assistant_id: e.target.value }))}
                placeholder="Deixe vazio para usar assistente dinâmico"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Identity */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Bot className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Identidade do Agente de Voz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Nome do Agente</Label>
              <Input
                value={localConfig.agent_name}
                onChange={e => setLocalConfig(prev => ({ ...prev, agent_name: e.target.value }))}
                placeholder="Ex: Ana"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Nome da Empresa</Label>
              <Input
                value={localConfig.company_name}
                onChange={e => setLocalConfig(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Ex: NeoFolic"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Saudação Inicial</Label>
            <Textarea
              value={localConfig.greeting_template}
              onChange={e => setLocalConfig(prev => ({ ...prev, greeting_template: e.target.value }))}
              placeholder="Olá, {{lead_name}}! Aqui é {{agent_name}} da {{company_name}}..."
              className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] min-h-[80px]"
            />
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              Variáveis: {'{{lead_name}}'}, {'{{agent_name}}'}, {'{{company_name}}'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Voz (ElevenLabs)</Label>
              <Select value={localConfig.voice_id} onValueChange={v => setLocalConfig(prev => ({ ...prev, voice_id: v }))}>
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pFZP5JQG7iQjIQuC4Bku">Lily (PT-BR Feminino)</SelectItem>
                  <SelectItem value="ErXwobaYiN019PkySvjV">Antoni (Masculino)</SelectItem>
                  <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella (Feminino)</SelectItem>
                  <SelectItem value="onwK4e9ZLuTAKqWW03F9">Daniel (Masculino)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Idioma</Label>
              <Select value={localConfig.language} onValueChange={v => setLocalConfig(prev => ({ ...prev, language: v }))}>
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (BR)</SelectItem>
                  <SelectItem value="pt">Português (PT)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qualification Questions */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Perguntas de Qualificação
          </CardTitle>
          <CardDescription>Configure as 3 perguntas que o agente fará durante a ligação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localConfig.qualification_questions.map((q, i) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[hsl(var(--avivar-primary))] text-white text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                Pergunta {i + 1}
              </Label>
              <Input
                value={q.question}
                onChange={e => updateQuestion(i, e.target.value)}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Operational Settings */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Settings className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Configurações Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Máx. ligações/dia</Label>
              <Input
                type="number"
                value={localConfig.max_daily_calls}
                onChange={e => setLocalConfig(prev => ({ ...prev, max_daily_calls: parseInt(e.target.value) || 50 }))}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Horário início</Label>
              <Input
                type="time"
                value={localConfig.business_hours_start}
                onChange={e => setLocalConfig(prev => ({ ...prev, business_hours_start: e.target.value }))}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Horário fim</Label>
              <Input
                type="time"
                value={localConfig.business_hours_end}
                onChange={e => setLocalConfig(prev => ({ ...prev, business_hours_end: e.target.value }))}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
            <div>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">Disparo automático por etapa</p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                Liga automaticamente quando lead entra em uma coluna específica do Kanban
              </p>
            </div>
            <Switch
              checked={localConfig.auto_trigger_enabled}
              onCheckedChange={v => setLocalConfig(prev => ({ ...prev, auto_trigger_enabled: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white px-8"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
