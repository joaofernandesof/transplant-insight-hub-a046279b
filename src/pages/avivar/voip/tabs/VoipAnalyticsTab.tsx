/**
 * VoipAnalyticsTab - Dashboards de Performance, Satisfação e Operacional
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  Smile,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Phone,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';

// Mock data
const agentPerformance = [
  { name: 'Ana Silva', calls: 85, conversion: 38, avgTime: 4.2, score: 94, scriptAdherence: 96 },
  { name: 'Carlos Santos', calls: 72, conversion: 32, avgTime: 3.8, score: 88, scriptAdherence: 92 },
  { name: 'Maria Oliveira', calls: 91, conversion: 42, avgTime: 5.1, score: 91, scriptAdherence: 89 },
  { name: 'João Pedro', calls: 58, conversion: 25, avgTime: 4.5, score: 82, scriptAdherence: 85 },
  { name: 'Fernanda Lima', calls: 79, conversion: 35, avgTime: 4.0, score: 90, scriptAdherence: 94 },
];

const satisfactionTrend = [
  { date: '25/01', nps: 72, csat: 4.2 },
  { date: '26/01', nps: 75, csat: 4.3 },
  { date: '27/01', nps: 71, csat: 4.1 },
  { date: '28/01', nps: 78, csat: 4.4 },
  { date: '29/01', nps: 76, csat: 4.3 },
  { date: '30/01', nps: 82, csat: 4.5 },
  { date: '31/01', nps: 85, csat: 4.6 },
];

const topKeywords = [
  { word: 'Agendamento', count: 156, sentiment: 'positive' },
  { word: 'Preço', count: 134, sentiment: 'neutral' },
  { word: 'Procedimento', count: 128, sentiment: 'positive' },
  { word: 'Dúvida', count: 98, sentiment: 'neutral' },
  { word: 'Transplante', count: 87, sentiment: 'positive' },
  { word: 'Resultado', count: 76, sentiment: 'positive' },
  { word: 'Demora', count: 45, sentiment: 'negative' },
  { word: 'Cancelar', count: 23, sentiment: 'negative' },
];

const topCustomers = [
  { name: 'Maria Santos', score: 98, calls: 5, lastSentiment: 'positive' },
  { name: 'João Silva', score: 95, calls: 3, lastSentiment: 'positive' },
  { name: 'Ana Oliveira', score: 92, calls: 4, lastSentiment: 'positive' },
  { name: 'Carlos Lima', score: 45, calls: 6, lastSentiment: 'negative' },
  { name: 'Fernanda Costa', score: 38, calls: 4, lastSentiment: 'negative' },
];

const operationalFunnel = [
  { name: 'Chamadas Recebidas', value: 247, fill: 'hsl(var(--avivar-primary))' },
  { name: 'Atendidas', value: 198, fill: '#22c55e' },
  { name: 'Qualificadas', value: 145, fill: '#3b82f6' },
  { name: 'Agendamentos', value: 82, fill: '#8b5cf6' },
  { name: 'Compareceram', value: 65, fill: '#f59e0b' },
];

const queueMetrics = [
  { queue: 'Comercial', sla: 92, abandonment: 8, avgWait: '0:45' },
  { queue: 'Suporte', sla: 88, abandonment: 12, avgWait: '1:15' },
  { queue: 'Pós-Venda', sla: 95, abandonment: 5, avgWait: '0:30' },
  { queue: 'Agendamento', sla: 97, abandonment: 3, avgWait: '0:20' },
];

const radarData = [
  { metric: 'Tempo Resposta', value: 85 },
  { metric: 'Qualidade', value: 92 },
  { metric: 'Conversão', value: 78 },
  { metric: 'Satisfação', value: 88 },
  { metric: 'Aderência Script', value: 91 },
  { metric: 'Resolução', value: 84 },
];

export default function VoipAnalyticsTab() {
  return (
    <Tabs defaultValue="performance" className="space-y-6">
      <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] p-1">
        <TabsTrigger 
          value="performance" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Performance
        </TabsTrigger>
        <TabsTrigger 
          value="satisfaction" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Smile className="h-4 w-4 mr-2" />
          Satisfação
        </TabsTrigger>
        <TabsTrigger 
          value="operational" 
          className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
        >
          <Activity className="h-4 w-4 mr-2" />
          Operacional
        </TabsTrigger>
      </TabsList>

      {/* Dashboard de Performance */}
      <TabsContent value="performance" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ranking de Colaboradores */}
          <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <Award className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Ranking de Colaboradores
              </CardTitle>
              <CardDescription>Performance baseada em múltiplos KPIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.sort((a, b) => b.score - a.score).map((agent, index) => (
                  <div
                    key={agent.name}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' :
                      'bg-[hsl(var(--avivar-muted-foreground))]'
                    }`}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">{agent.name}</p>
                      <div className="flex gap-4 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        <span>{agent.calls} ligações</span>
                        <span>{agent.conversion}% conversão</span>
                        <span>{agent.avgTime}min TMA</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        agent.score >= 90 ? 'text-green-500' :
                        agent.score >= 80 ? 'text-yellow-500' : 'text-red-500'
                      }`}>{agent.score}</p>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Radar de Métricas */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Visão 360°</CardTitle>
              <CardDescription>Métricas consolidadas da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--avivar-border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: 'hsl(var(--avivar-muted-foreground))', fontSize: 11 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Equipe"
                      dataKey="value"
                      stroke="hsl(var(--avivar-primary))"
                      fill="hsl(var(--avivar-primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparativo por Colaborador */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Aderência a Scripts</CardTitle>
            <CardDescription>Percentual de conformidade com scripts de atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--avivar-border))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--avivar-muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--avivar-muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Bar 
                    dataKey="scriptAdherence" 
                    fill="hsl(var(--avivar-primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Dashboard de Satisfação */}
      <TabsContent value="satisfaction" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">85</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">NPS Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                  <Smile className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">4.6</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">CSAT Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">58%</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Positivo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">14%</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Negativo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendência NPS/CSAT */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Evolução da Satisfação</CardTitle>
              <CardDescription>NPS e CSAT nos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--avivar-border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--avivar-muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="left" stroke="hsl(var(--avivar-muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} stroke="hsl(var(--avivar-muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="nps" 
                      name="NPS"
                      stroke="hsl(var(--avivar-primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--avivar-primary))' }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="csat" 
                      name="CSAT"
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Palavras Recorrentes */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Temas Recorrentes
              </CardTitle>
              <CardDescription>Palavras mais mencionadas nas ligações</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {topKeywords.map((keyword) => (
                    <div key={keyword.word} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        keyword.sentiment === 'positive' ? 'bg-green-500' :
                        keyword.sentiment === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="flex-1 text-[hsl(var(--avivar-foreground))]">{keyword.word}</span>
                      <div className="w-32">
                        <Progress 
                          value={(keyword.count / 156) * 100} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm text-[hsl(var(--avivar-muted-foreground))] w-12 text-right">
                        {keyword.count}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Ranking de Clientes */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Clientes por Satisfação</CardTitle>
            <CardDescription>Promotores e Detratores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-green-500 mb-3 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" /> Top Promotores
                </h4>
                <div className="space-y-2">
                  {topCustomers.filter(c => c.lastSentiment === 'positive').map((customer) => (
                    <div key={customer.name} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-500/10 text-green-500 text-xs">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-[hsl(var(--avivar-foreground))] text-sm">{customer.name}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{customer.calls} interações</p>
                      </div>
                      <span className="text-green-500 font-bold">{customer.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-500 mb-3 flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4" /> Atenção Necessária
                </h4>
                <div className="space-y-2">
                  {topCustomers.filter(c => c.lastSentiment === 'negative').map((customer) => (
                    <div key={customer.name} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-red-500/10 text-red-500 text-xs">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-[hsl(var(--avivar-foreground))] text-sm">{customer.name}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{customer.calls} interações</p>
                      </div>
                      <span className="text-red-500 font-bold">{customer.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Dashboard Operacional */}
      <TabsContent value="operational" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil de Conversão */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <Target className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Funil de Conversão
              </CardTitle>
              <CardDescription>Jornada das chamadas até comparecimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {operationalFunnel.map((stage, index) => (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--avivar-foreground))]">{stage.name}</span>
                      <span className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">{stage.value}</span>
                    </div>
                    <div className="h-8 rounded-lg overflow-hidden bg-[hsl(var(--avivar-background))]">
                      <div 
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ 
                          width: `${(stage.value / operationalFunnel[0].value) * 100}%`,
                          backgroundColor: stage.fill
                        }}
                      />
                    </div>
                    {index < operationalFunnel.length - 1 && (
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-right">
                        {((operationalFunnel[index + 1].value / stage.value) * 100).toFixed(0)}% conversão
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Fila */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <Activity className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Métricas de Fila
              </CardTitle>
              <CardDescription>SLA e taxa de abandono por fila</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queueMetrics.map((queue) => (
                  <div key={queue.queue} className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-[hsl(var(--avivar-foreground))]">{queue.queue}</span>
                      <Badge className={
                        queue.sla >= 95 ? 'bg-green-500/10 text-green-500' :
                        queue.sla >= 85 ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }>
                        SLA: {queue.sla}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className={`text-lg font-semibold ${
                          queue.sla >= 90 ? 'text-green-500' : 'text-yellow-500'
                        }`}>{queue.sla}%</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">SLA</p>
                      </div>
                      <div>
                        <p className={`text-lg font-semibold ${
                          queue.abandonment <= 5 ? 'text-green-500' :
                          queue.abandonment <= 10 ? 'text-yellow-500' : 'text-red-500'
                        }`}>{queue.abandonment}%</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Abandono</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">{queue.avgWait}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Espera</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas e Gargalos */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-500">Atenção</span>
                </div>
                <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                  Fila de Suporte com 12% de abandono
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  Acima da meta de 10%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">Normal</span>
                </div>
                <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                  Tempo médio de espera dentro do SLA
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  45 segundos (meta: 60s)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-500">Normal</span>
                </div>
                <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                  Taxa de conversão em alta
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  32.5% (+5.2% vs semana anterior)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
