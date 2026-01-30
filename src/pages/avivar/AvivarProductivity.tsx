/**
 * AvivarProductivity - Dashboard de Produtividade e Análise IA
 * Métricas de equipe, performance e automação
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Users,
  Bot,
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Target,
  Timer,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

// Dados de produtividade da equipe
const teamMembers = [
  { 
    id: 1, 
    name: 'Ana Silva', 
    avatar: 'A',
    status: 'online',
    conversations: 45,
    avgResponseTime: '1.2 min',
    satisfaction: 4.8,
    conversions: 12,
    occupation: 78,
  },
  { 
    id: 2, 
    name: 'Carlos Santos', 
    avatar: 'C',
    status: 'online',
    conversations: 38,
    avgResponseTime: '1.8 min',
    satisfaction: 4.6,
    conversions: 9,
    occupation: 65,
  },
  { 
    id: 3, 
    name: 'Maria Oliveira', 
    avatar: 'M',
    status: 'busy',
    conversations: 52,
    avgResponseTime: '0.9 min',
    satisfaction: 4.9,
    conversions: 15,
    occupation: 92,
  },
  { 
    id: 4, 
    name: 'João Costa', 
    avatar: 'J',
    status: 'offline',
    conversations: 28,
    avgResponseTime: '2.1 min',
    satisfaction: 4.4,
    conversions: 6,
    occupation: 45,
  },
];

// Métricas gerais
const generalMetrics = {
  totalConversations: 304,
  activeConversations: 171,
  qualificationRate: 6.6,
  conversionRate: 20,
  totalMessages: 1137,
  reopenRate: 6.6,
  totalSales: 4,
  totalRevenue: 1806,
};

// Dados de automação IA
const aiMetrics = {
  automationCoverage: 0.3,
  deflectionRate: 0,
  totalWithAi: 4,
  transfers: 4,
  avgDuration: '3.5 min',
  firstResponse: '0.5 min',
  npsScore: 2,
};

// Tipos de atendimento
const serviceTypes = [
  { type: 'Apenas Humano', value: 100, color: '#a855f7' },
  { type: 'Misto (IA + Humano)', value: 4, color: '#8b5cf6' },
  { type: 'Apenas IA', value: 0, color: '#22c55e' },
];

// Dados do gráfico de performance
const performanceData = [
  { time: '08:00', conversations: 12, responses: 11 },
  { time: '10:00', conversations: 28, responses: 26 },
  { time: '12:00', conversations: 35, responses: 32 },
  { time: '14:00', conversations: 42, responses: 38 },
  { time: '16:00', conversations: 48, responses: 45 },
  { time: '18:00', conversations: 38, responses: 36 },
];

export default function AvivarProductivity() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Produtividade & IA
            <Sparkles className="h-5 w-5 text-purple-400" />
          </h1>
          <p className="text-slate-400">Métricas de equipe, performance e automação inteligente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20">
            Exportar Relatório
          </Button>
        </div>
      </div>

      <Tabs defaultValue="productivity" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-purple-500/30">
          <TabsTrigger value="productivity" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Produtividade
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Target className="h-4 w-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Bot className="h-4 w-4 mr-2" />
            IA & Automação
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Equipe
          </TabsTrigger>
        </TabsList>

        {/* Dashboard de Produtividade */}
        <TabsContent value="productivity" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Total de Conversas</p>
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.totalConversations}</p>
                <div className="flex items-center text-xs text-emerald-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% vs ontem
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Conversas Ativas</p>
                  <Activity className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.activeConversations}</p>
                <Progress value={(generalMetrics.activeConversations / generalMetrics.totalConversations) * 100} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Taxa de Qualificação</p>
                  <Target className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.qualificationRate}%</p>
                <div className="flex items-center text-xs text-red-400 mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  -2% vs ontem
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Taxa de Conversão</p>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.conversionRate}%</p>
                <div className="flex items-center text-xs text-emerald-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5% vs ontem
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Performance */}
          <Card className="bg-slate-900/80 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Performance ao Longo do Dia</CardTitle>
              <CardDescription className="text-slate-400">Conversas iniciadas vs respondidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.15)" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorConversations)"
                      name="Conversas"
                    />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorResponses)"
                      name="Respondidas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard de Vendas */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Total de Mensagens</p>
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.totalMessages.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Taxa de Reabertura</p>
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.reopenRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Total de Vendas</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{generalMetrics.totalSales}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Valor Total</p>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  R$ {generalMetrics.totalRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dashboard de IA & Automação */}
        <TabsContent value="ai" className="space-y-6">
          {/* KPIs de IA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Automação Coverage</p>
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{aiMetrics.automationCoverage}%</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Deflection Rate</p>
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{aiMetrics.deflectionRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Total com IA</p>
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{aiMetrics.totalWithAi}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Transferências IA→Humano</p>
                  <Users className="h-4 w-4 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{aiMetrics.transfers}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tipos de Atendimento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Tipos de Atendimento</CardTitle>
                <CardDescription className="text-slate-400">Distribuição por tipo de atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceTypes.map((type) => (
                    <div key={type.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{type.type}</span>
                        <span className="text-white font-medium">{type.value}%</span>
                      </div>
                      <Progress 
                        value={type.value} 
                        className="h-2" 
                        style={{ '--progress-background': type.color } as any}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Métricas de Resposta</CardTitle>
                <CardDescription className="text-slate-400">Performance do atendimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-purple-400" />
                    <span className="text-slate-300">Duração Média</span>
                  </div>
                  <span className="text-white font-semibold">{aiMetrics.avgDuration}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <span className="text-slate-300">Primeira Resposta</span>
                  </div>
                  <span className="text-white font-semibold">{aiMetrics.firstResponse}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span className="text-slate-300">NPS Score</span>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    aiMetrics.npsScore >= 7 
                      ? "bg-emerald-500/20 text-emerald-300" 
                      : aiMetrics.npsScore >= 5 
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                  )}>
                    {aiMetrics.npsScore}/10
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dashboard de Equipe */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Usuários Ativos</p>
                  <Users className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {teamMembers.filter(m => m.status !== 'offline').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">de {teamMembers.length} totais</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Taxa Média de Ocupação</p>
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {Math.round(teamMembers.reduce((acc, m) => acc + m.occupation, 0) / teamMembers.length)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/80 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">Produtividade da Equipe</CardTitle>
              <CardDescription className="text-slate-400">Performance individual dos atendentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-medium">
                          {member.avatar}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800",
                          member.status === 'online' ? "bg-emerald-500" :
                          member.status === 'busy' ? "bg-amber-500" : "bg-slate-500"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{member.status}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{member.conversations}</p>
                        <p className="text-xs text-slate-400">Conversas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{member.avgResponseTime}</p>
                        <p className="text-xs text-slate-400">Resposta</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-amber-400">{member.satisfaction}</p>
                        <p className="text-xs text-slate-400">Satisfação</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-emerald-400">{member.conversions}</p>
                        <p className="text-xs text-slate-400">Conversões</p>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Ocupação</span>
                          <span className="text-white">{member.occupation}%</span>
                        </div>
                        <Progress value={member.occupation} className="h-2" />
                      </div>
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
