/**
 * AvivarFollowUp - Sistema de Follow-up Automático
 * Configuração de tentativas automáticas com prazos e agendamento
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Clock, 
  Bell, 
  Zap,
  Calendar,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Users,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data para follow-ups configurados
const followUpRules = [
  { 
    id: 1, 
    attempt: 1, 
    time: '30 minutos', 
    message: 'Olá! Vi que você demonstrou interesse. Posso ajudar?', 
    active: true 
  },
  { 
    id: 2, 
    attempt: 2, 
    time: '2 horas', 
    message: 'Ainda está interessado? Tenho condições especiais hoje!', 
    active: true 
  },
  { 
    id: 3, 
    attempt: 3, 
    time: '24 horas', 
    message: 'Última tentativa: posso te ajudar com algo?', 
    active: true 
  },
  { 
    id: 4, 
    attempt: 4, 
    time: '3 dias', 
    message: 'Passando para verificar se ainda tem interesse...', 
    active: false 
  },
];

// Mock data para follow-ups agendados
const scheduledFollowUps = [
  { 
    id: 1, 
    lead: 'Maria Silva', 
    attempt: 2, 
    scheduledFor: '14:30 hoje', 
    status: 'pending',
    channel: 'WhatsApp' 
  },
  { 
    id: 2, 
    lead: 'João Santos', 
    attempt: 1, 
    scheduledFor: '15:00 hoje', 
    status: 'pending',
    channel: 'WhatsApp' 
  },
  { 
    id: 3, 
    lead: 'Ana Costa', 
    attempt: 3, 
    scheduledFor: '16:45 hoje', 
    status: 'pending',
    channel: 'WhatsApp' 
  },
  { 
    id: 4, 
    lead: 'Carlos Lima', 
    attempt: 1, 
    scheduledFor: '09:00 amanhã', 
    status: 'scheduled',
    channel: 'Instagram' 
  },
  { 
    id: 5, 
    lead: 'Patricia Dias', 
    attempt: 2, 
    scheduledFor: '10:30 amanhã', 
    status: 'scheduled',
    channel: 'WhatsApp' 
  },
];

// Estatísticas de follow-up
const followUpStats = {
  total: 12,
  today: 5,
  tomorrow: 7,
  successRate: 32,
  avgResponseTime: '1.2 min',
};

export default function AvivarFollowUp() {
  const [rules, setRules] = useState(followUpRules);

  const toggleRule = (id: number) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, active: !rule.active } : rule
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Follow-up Automático
            <Sparkles className="h-5 w-5 text-purple-400" />
          </h1>
          <p className="text-slate-400">Nunca perca um lead! Sistema inteligente de follow-up com IA</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Follow-ups Agendados</p>
                <p className="text-2xl font-bold text-white">{followUpStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Próximas 24 horas</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Para Hoje</p>
                <p className="text-2xl font-bold text-white">{followUpStats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-xs text-amber-400 mt-1">3 nas próximas 2h</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-white">{followUpStats.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-xs text-emerald-400 mt-1">+5% vs semana passada</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Tempo de Resposta</p>
                <p className="text-2xl font-bold text-white">{followUpStats.avgResponseTime}</p>
              </div>
              <Timer className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-blue-400 mt-1">Média após follow-up</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-purple-500/30">
          <TabsTrigger value="config" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Agendados ({followUpStats.total})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Configuração de Regras */}
        <TabsContent value="config">
          <Card className="bg-slate-900/90 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Configuração de Follow-up</CardTitle>
              <CardDescription className="text-slate-400">
                Defina as regras de follow-up automático para leads que não respondem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    rule.active 
                      ? "border-purple-500/40 bg-slate-800/50" 
                      : "border-slate-700/50 bg-slate-800/30 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                        rule.active 
                          ? "bg-purple-600/30 text-purple-300" 
                          : "bg-slate-700/50 text-slate-500"
                      )}>
                        {rule.attempt}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">Tentativa {rule.attempt}</p>
                          <Badge className={cn(
                            "text-xs",
                            rule.active 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-700/50 text-slate-400 border-slate-600"
                          )}>
                            {rule.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Após {rule.time} sem resposta
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={rule.active}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                    <p className="text-sm text-slate-300 flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      {rule.message}
                    </p>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full border-dashed border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Nova Tentativa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups Agendados */}
        <TabsContent value="scheduled">
          <Card className="bg-slate-900/90 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Follow-ups Agendados
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {scheduledFollowUps.length} pendentes
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Mensagens automáticas programadas para os próximos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledFollowUps.map((followUp) => (
                  <div 
                    key={followUp.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-medium">
                        {followUp.lead.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{followUp.lead}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            Tentativa {followUp.attempt}
                          </Badge>
                          <span>•</span>
                          <span>{followUp.channel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-medium",
                          followUp.status === 'pending' ? "text-amber-400" : "text-slate-300"
                        )}>
                          {followUp.scheduledFor}
                        </p>
                        <p className="text-xs text-slate-500">
                          {followUp.status === 'pending' ? 'Próximo' : 'Agendado'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history">
          <Card className="bg-slate-900/90 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Follow-ups</CardTitle>
              <CardDescription className="text-slate-400">
                Mensagens enviadas automaticamente nos últimos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { lead: 'Ricardo Ferreira', result: 'Respondeu', time: 'há 2h', attempt: 1 },
                  { lead: 'Fernanda Souza', result: 'Respondeu', time: 'há 4h', attempt: 2 },
                  { lead: 'Lucas Mendes', result: 'Sem resposta', time: 'há 6h', attempt: 3 },
                  { lead: 'Juliana Rocha', result: 'Converteu', time: 'há 1 dia', attempt: 1 },
                  { lead: 'Roberto Alves', result: 'Sem resposta', time: 'há 1 dia', attempt: 3 },
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        item.result === 'Converteu' 
                          ? "bg-emerald-500/20" 
                          : item.result === 'Respondeu' 
                            ? "bg-blue-500/20" 
                            : "bg-slate-700/50"
                      )}>
                        {item.result === 'Converteu' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : item.result === 'Respondeu' ? (
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.lead}</p>
                        <p className="text-xs text-slate-400">Tentativa {item.attempt}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(
                        "text-xs",
                        item.result === 'Converteu' 
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : item.result === 'Respondeu'
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-slate-700/50 text-slate-400 border-slate-600"
                      )}>
                        {item.result}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                    </div>
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
