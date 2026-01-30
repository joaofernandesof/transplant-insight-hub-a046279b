import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  DollarSign,
  Clock,
  TrendingUp,
  Flame,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle2,
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
import { Link } from 'react-router-dom';

// Mock data
const leadsTrend = [
  { date: '01/01', leads: 12, converted: 3 },
  { date: '08/01', leads: 18, converted: 5 },
  { date: '15/01', leads: 15, converted: 4 },
  { date: '22/01', leads: 22, converted: 7 },
  { date: '29/01', leads: 28, converted: 9 },
];

const pipelineData = [
  { stage: 'Novos', count: 45, color: '#E5E7EB' },
  { stage: 'Contatados', count: 32, color: '#FEF3C7' },
  { stage: 'Agendados', count: 18, color: '#E9D5FF' },
  { stage: 'Convertidos', count: 12, color: '#BBF7D0' },
  { stage: 'Perdidos', count: 8, color: '#FECACA' },
];

const sourceData = [
  { source: 'Instagram', count: 35 },
  { source: 'Google Ads', count: 28 },
  { source: 'Indicação', count: 20 },
  { source: 'WhatsApp', count: 15 },
  { source: 'Site', count: 12 },
];

const urgentTasks = [
  { id: 1, lead: 'Maria Silva', task: 'Retornar ligação', due: 'Atrasado 2h', priority: 'high' },
  { id: 2, lead: 'João Santos', task: 'Enviar orçamento', due: 'Em 1h', priority: 'high' },
  { id: 3, lead: 'Ana Costa', task: 'Confirmar agendamento', due: 'Hoje 15:00', priority: 'medium' },
];

const recentConversations = [
  { id: 1, lead: 'Carlos Mendes', message: 'Olá, gostaria de saber mais...', time: '5 min', unread: true },
  { id: 2, lead: 'Patricia Lima', message: 'Qual o valor do procedimento?', time: '12 min', unread: true },
  { id: 3, lead: 'Roberto Alves', message: 'Ok, vou pensar e retorno', time: '1h', unread: false },
];

export default function NeoCrmDashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">Visão geral do seu funil comercial</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/neocrm/leads">Ver Todos Leads</Link>
          </Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Users className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total de Leads</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +18% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Taxa de Conversão</span>
              <Target className="h-4 w-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +3.2% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Receita do Mês</span>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(87500)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(425000)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Tarefas Pendentes</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                3 atrasadas
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução de Leads</CardTitle>
            <CardDescription>Leads captados vs convertidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsTrend}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                    name="Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConverted)"
                    name="Convertidos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
            <CardDescription>Distribuição por etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pipelineData.slice(0, 4).map((item) => (
                <div key={item.stage} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground text-xs">{item.stage}</span>
                  <span className="font-medium ml-auto text-xs">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Tarefas Urgentes</CardTitle>
              <CardDescription>Follow-ups prioritários</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/neocrm/tasks">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{task.lead}</p>
                    <p className="text-xs text-muted-foreground">{task.task}</p>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                    {task.due}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Conversas Recentes</CardTitle>
              <CardDescription>Mensagens não lidas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/neocrm/inbox">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div key={conv.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <MessageSquare className={cn(
                    "h-5 w-5 mt-0.5",
                    conv.unread ? "text-orange-500" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{conv.lead}</p>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.message}</p>
                  </div>
                  {conv.unread && (
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por Fonte</CardTitle>
            <CardDescription>Origem dos leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="source" type="category" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
