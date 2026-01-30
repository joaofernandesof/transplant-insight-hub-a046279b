/**
 * AvivarProductivity - Dashboard de Produtividade e Análise IA
 * Métricas de equipe, performance e automação
 * Suporte a tema claro e escuro
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
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Produtividade & IA
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Métricas de equipe, performance e automação inteligente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]">
            Exportar Relatório
          </Button>
        </div>
      </div>

      <Tabs defaultValue="productivity" className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger value="productivity" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Produtividade
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Target className="h-4 w-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Bot className="h-4 w-4 mr-2" />
            IA & Automação
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Equipe
          </TabsTrigger>
        </TabsList>

        {/* Dashboard de Produtividade */}
        <TabsContent value="productivity" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Total de Conversas</p>
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.totalConversations}</p>
                <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% vs ontem
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Conversas Ativas</p>
                  <Activity className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.activeConversations}</p>
                <Progress value={(generalMetrics.activeConversations / generalMetrics.totalConversations) * 100} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa de Qualificação</p>
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.qualificationRate}%</p>
                <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  -2% vs ontem
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa de Conversão</p>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.conversionRate}%</p>
                <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5% vs ontem
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Performance */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Performance ao Longo do Dia</CardTitle>
              <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Conversas iniciadas vs respondidas</CardDescription>
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-[hsl(var(--avivar-border))]" />
                    <XAxis dataKey="time" className="text-[hsl(var(--avivar-muted-foreground))]" stroke="currentColor" fontSize={12} />
                    <YAxis className="text-[hsl(var(--avivar-muted-foreground))]" stroke="currentColor" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--avivar-card))',
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--avivar-border))',
                        color: 'hsl(var(--avivar-foreground))',
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
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Total de Mensagens</p>
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.totalMessages.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa de Reabertura</p>
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.reopenRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Total de Vendas</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{generalMetrics.totalSales}</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Valor Total</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">
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
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Automação Coverage</p>
                  <Bot className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{aiMetrics.automationCoverage}%</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Deflection Rate</p>
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{aiMetrics.deflectionRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Total com IA</p>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{aiMetrics.totalWithAi}</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Transferências IA→Humano</p>
                  <Users className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mt-2">{aiMetrics.transfers}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tipos de Atendimento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Tipos de Atendimento</CardTitle>
                <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Distribuição por tipo de atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceTypes.map((type) => (
                    <div key={type.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--avivar-secondary-foreground))]">{type.type}</span>
                        <span className="text-[hsl(var(--avivar-foreground))] font-medium">{type.value}%</span>
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

            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Métricas de Resposta</CardTitle>
                <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Performance do atendimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--avivar-secondary))]">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    <span className="text-[hsl(var(--avivar-secondary-foreground))]">Duração Média</span>
                  </div>
                  <span className="text-[hsl(var(--avivar-foreground))] font-semibold">{aiMetrics.avgDuration}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--avivar-secondary))]">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span className="text-[hsl(var(--avivar-secondary-foreground))]">Primeira Resposta</span>
                  </div>
                  <span className="text-[hsl(var(--avivar-foreground))] font-semibold">{aiMetrics.firstResponse}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--avivar-secondary))]">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span className="text-[hsl(var(--avivar-secondary-foreground))]">NPS Score</span>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    aiMetrics.npsScore >= 7 
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : aiMetrics.npsScore >= 5 
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-red-500/20 text-red-600 dark:text-red-400"
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
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Performance da Equipe</CardTitle>
              <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Métricas individuais de cada atendente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary))]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center text-white font-bold text-lg">
                          {member.avatar}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[hsl(var(--avivar-card))]",
                          member.status === 'online' ? "bg-emerald-500" :
                          member.status === 'busy' ? "bg-amber-500" : "bg-[hsl(var(--avivar-muted))]"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">{member.name}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] capitalize">{member.status === 'online' ? 'Disponível' : member.status === 'busy' ? 'Ocupado' : 'Offline'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">{member.conversations}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Conversas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">{member.avgResponseTime}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tempo Resp.</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{member.conversions}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Conversões</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">⭐ {member.satisfaction}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Satisfação</p>
                      </div>
                      <div className="w-24">
                        <Progress value={member.occupation} className="h-2" />
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center mt-1">{member.occupation}% ocupação</p>
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
