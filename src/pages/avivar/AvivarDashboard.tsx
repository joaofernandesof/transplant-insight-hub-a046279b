/**
 * AvivarDashboard - Dashboard principal do portal Avivar com visual IA contemporâneo
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Users,
  Target,
  DollarSign,
  Clock,
  Flame,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
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
import { cn } from '@/lib/utils';

// Mock data
const leadsTrend = [
  { date: '01/01', leads: 12, converted: 3 },
  { date: '08/01', leads: 18, converted: 5 },
  { date: '15/01', leads: 15, converted: 4 },
  { date: '22/01', leads: 22, converted: 7 },
  { date: '29/01', leads: 28, converted: 9 },
];

const pipelineData = [
  { stage: 'Novos', count: 45, color: '#a855f7' },
  { stage: 'Contatados', count: 32, color: '#8b5cf6' },
  { stage: 'Agendados', count: 18, color: '#7c3aed' },
  { stage: 'Convertidos', count: 12, color: '#22c55e' },
  { stage: 'Perdidos', count: 8, color: '#64748b' },
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

export default function AvivarDashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Dashboard
            <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 border-0 text-white">
              <Bot className="h-3 w-3 mr-1" />
              IA Ativa
            </Badge>
          </h1>
          <p className="text-purple-300/60">Visão geral do seu funil comercial com IA</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20" asChild>
            <Link to="/avivar/leads">Ver Todos Leads</Link>
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
            <Zap className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-purple-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-slate-300">
              <span>Total de Leads</span>
              <Flame className="h-4 w-4 text-purple-400" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">127</div>
            <div className="flex items-center text-xs text-emerald-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +18% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-slate-300">
              <span>Taxa de Conversão</span>
              <Target className="h-4 w-4 text-emerald-400" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">24.5%</div>
            <div className="flex items-center text-xs text-emerald-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +3.2% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-slate-300">
              <span>Receita do Mês</span>
              <DollarSign className="h-4 w-4 text-violet-400" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(87500)}</div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              Total: {formatCurrency(425000)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-slate-300">
              <span>Tarefas Pendentes</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                3 atrasadas
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Card */}
      <Card className="bg-slate-900/90 border-purple-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <CardContent className="p-4 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Assistente AVIVAR IA</h3>
            <p className="text-sm text-slate-300">5 leads qualificados automaticamente hoje • 12 mensagens automáticas enviadas</p>
          </div>
          <Button variant="outline" size="sm" className="border-purple-400/50 text-white hover:bg-purple-500/20">
            Ver Atividades
          </Button>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Trend */}
        <Card className="lg:col-span-2 bg-slate-900/80 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-base text-white">Evolução de Leads</CardTitle>
            <CardDescription className="text-slate-400">Leads captados vs convertidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsTrend}>
                  <defs>
                    <linearGradient id="colorLeadsAvivar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConvertedAvivar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.15)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#fff'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeadsAvivar)"
                    name="Leads"
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConvertedAvivar)"
                    name="Convertidos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-base text-white">Pipeline</CardTitle>
            <CardDescription className="text-slate-400">Distribuição por etapa</CardDescription>
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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 10, 30, 0.9)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#fff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pipelineData.slice(0, 4).map((item) => (
                <div key={item.stage} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400 text-xs">{item.stage}</span>
                  <span className="font-medium ml-auto text-xs text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tasks */}
        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-white">Tarefas Urgentes</CardTitle>
              <CardDescription className="text-slate-400">Follow-ups prioritários</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-purple-500/20" asChild>
              <Link to="/avivar/tasks">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-700/50 bg-slate-800/50">
                  <div>
                    <p className="font-medium text-sm text-white">{task.lead}</p>
                    <p className="text-xs text-slate-400">{task.task}</p>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    task.priority === 'high' 
                      ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                      : 'bg-purple-500/20 text-purple-200 border-purple-500/30'
                  )}>
                    {task.due}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-white">Conversas Recentes</CardTitle>
              <CardDescription className="text-slate-400">Mensagens não lidas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-purple-500/20" asChild>
              <Link to="/avivar/inbox">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div key={conv.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/50">
                  <MessageSquare className={cn(
                    "h-5 w-5 mt-0.5",
                    conv.unread ? "text-purple-400" : "text-slate-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-white">{conv.lead}</p>
                      <span className="text-xs text-slate-500">{conv.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{conv.message}</p>
                  </div>
                  {conv.unread && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-base text-white">Leads por Fonte</CardTitle>
            <CardDescription className="text-slate-400">Origem dos leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.15)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="source" type="category" stroke="#94a3b8" fontSize={10} width={70} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 4, 4, 0]}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
