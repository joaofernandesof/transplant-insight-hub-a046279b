/**
 * VoipDashboardTab - Dashboard de KPIs e métricas em tempo real
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Clock,
  TrendingUp,
  Users,
  Smile,
  Meh,
  Frown,
  Activity,
  Target,
  Timer,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data
const kpiData = {
  totalCalls: 247,
  answeredCalls: 198,
  missedCalls: 49,
  avgDuration: '4:32',
  avgWaitTime: '0:45',
  conversionRate: 32.5,
  agentsOnline: 8,
  agentsOnCall: 5,
  queuedCalls: 3,
};

const hourlyData = [
  { hour: '08h', inbound: 12, outbound: 8 },
  { hour: '09h', inbound: 28, outbound: 15 },
  { hour: '10h', inbound: 35, outbound: 22 },
  { hour: '11h', inbound: 42, outbound: 28 },
  { hour: '12h', inbound: 18, outbound: 12 },
  { hour: '13h', inbound: 22, outbound: 18 },
  { hour: '14h', inbound: 38, outbound: 25 },
  { hour: '15h', inbound: 45, outbound: 30 },
  { hour: '16h', inbound: 32, outbound: 20 },
  { hour: '17h', inbound: 25, outbound: 15 },
];

const sentimentData = [
  { name: 'Positivo', value: 58, color: '#22c55e' },
  { name: 'Neutro', value: 28, color: '#eab308' },
  { name: 'Negativo', value: 14, color: '#ef4444' },
];

const queueStatus = [
  { queue: 'Comercial', waiting: 2, avgWait: '1:20', agents: 3 },
  { queue: 'Suporte', waiting: 1, avgWait: '0:45', agents: 2 },
  { queue: 'Pós-Venda', waiting: 0, avgWait: '0:00', agents: 2 },
  { queue: 'Agendamento', waiting: 0, avgWait: '0:00', agents: 1 },
];

const agentStatus = [
  { name: 'Ana Silva', status: 'em_ligacao', calls: 18, avgTime: '4:12' },
  { name: 'Carlos Santos', status: 'disponivel', calls: 15, avgTime: '3:45' },
  { name: 'Maria Oliveira', status: 'em_ligacao', calls: 22, avgTime: '5:10' },
  { name: 'João Pedro', status: 'pausa', calls: 12, avgTime: '4:30' },
  { name: 'Fernanda Lima', status: 'em_ligacao', calls: 20, avgTime: '4:05' },
];

export default function VoipDashboardTab() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Total Ligações</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{kpiData.totalCalls}</p>
              </div>
              <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                <Phone className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% vs ontem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Atendidas</p>
                <p className="text-2xl font-bold text-green-500">{kpiData.answeredCalls}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <PhoneIncoming className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <Progress value={(kpiData.answeredCalls / kpiData.totalCalls) * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Perdidas</p>
                <p className="text-2xl font-bold text-red-500">{kpiData.missedCalls}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <PhoneMissed className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
              {((kpiData.missedCalls / kpiData.totalCalls) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tempo Médio</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{kpiData.avgDuration}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">Duração média</p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Conversão</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-primary))]">{kpiData.conversionRate}%</p>
              </div>
              <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                <Target className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +5.2% vs semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Agentes Online</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{kpiData.agentsOnline}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
              {kpiData.agentsOnCall} em ligação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume por Hora */}
        <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Volume de Ligações por Hora</CardTitle>
            <CardDescription>Distribuição de chamadas inbound e outbound</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--avivar-border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--avivar-muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--avivar-muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--avivar-card))', 
                      border: '1px solid hsl(var(--avivar-border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inbound" 
                    name="Inbound"
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorInbound)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="outbound" 
                    name="Outbound"
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorOutbound)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentimento */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Sentimento das Ligações</CardTitle>
            <CardDescription>Análise de IA em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Filas */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Filas de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueStatus.map((queue) => (
                <div 
                  key={queue.queue}
                  className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                >
                  <div>
                    <p className="font-medium text-[hsl(var(--avivar-foreground))]">{queue.queue}</p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      {queue.agents} agentes ativos
                    </p>
                  </div>
                  <div className="text-right">
                    {queue.waiting > 0 ? (
                      <>
                        <Badge variant="destructive" className="mb-1">
                          {queue.waiting} em espera
                        </Badge>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                          Tempo médio: {queue.avgWait}
                        </p>
                      </>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Sem fila
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Agentes */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Users className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Agentes em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentStatus.map((agent) => (
                <div 
                  key={agent.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      agent.status === 'em_ligacao' ? 'bg-yellow-500 animate-pulse' :
                      agent.status === 'disponivel' ? 'bg-green-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">{agent.name}</p>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        {agent.status === 'em_ligacao' ? 'Em ligação' :
                         agent.status === 'disponivel' ? 'Disponível' : 'Em pausa'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{agent.calls} ligações</p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      TMA: {agent.avgTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
