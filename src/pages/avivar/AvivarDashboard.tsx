/**
 * AvivarDashboard - Dashboard principal do portal Avivar
 * Dados reais do Supabase - leads, tarefas, conversas, pipeline
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpRight,
  ArrowDownRight,
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
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, subMonths, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PIPELINE_COLORS: Record<string, string> = {
  'Novos': '#a855f7',
  'Contatados': '#8b5cf6',
  'Agendados': '#7c3aed',
  'Convertidos': '#22c55e',
  'Perdidos': '#64748b',
};
const DEFAULT_COLOR = '#a855f7';

export default function AvivarDashboard() {
  const navigate = useNavigate();
  const { accountId } = useAvivarAccount();
  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
  const prevMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');

  // ===== LEADS DATA =====
  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ['avivar-dashboard-leads', accountId],
    queryFn: async () => {
      if (!accountId) return null;

      // All leads for this account (from kanban)
      const { data: allLeads, error } = await supabase
        .from('avivar_kanban_leads')
        .select('id, created_at, column_id, source')
        .eq('account_id', accountId);
      if (error) throw error;

      // Get columns for pipeline mapping
      const { data: columns } = await supabase
        .from('avivar_kanban_columns')
        .select('id, name, order_index, kanban_id')
        .eq('account_id', accountId)
        .order('order_index', { ascending: true });

      // Current month leads
      const currentMonthLeads = (allLeads || []).filter(l => 
        l.created_at >= currentMonthStart && l.created_at <= currentMonthEnd + 'T23:59:59'
      );
      // Previous month leads
      const prevMonthLeads = (allLeads || []).filter(l =>
        l.created_at >= prevMonthStart && l.created_at <= prevMonthEnd + 'T23:59:59'
      );

      // Pipeline distribution
      const columnMap = new Map((columns || []).map(c => [c.id, c.name]));
      const pipelineCounts: Record<string, number> = {};
      (allLeads || []).forEach(l => {
        const colName = columnMap.get(l.column_id) || 'Outros';
        pipelineCounts[colName] = (pipelineCounts[colName] || 0) + 1;
      });

      // Source distribution
      const sourceCounts: Record<string, number> = {};
      (allLeads || []).forEach(l => {
        const src = l.source || 'Desconhecido';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });

      // Weekly trend (last 5 weeks)
      const weeklyTrend = [];
      for (let i = 4; i >= 0; i--) {
        const weekStart = subDays(now, (i + 1) * 7);
        const weekEnd = subDays(now, i * 7);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
        const weekLeads = (allLeads || []).filter(l =>
          l.created_at >= weekStartStr && l.created_at < weekEndStr + 'T23:59:59'
        );
        weeklyTrend.push({
          date: format(weekStart, 'dd/MM'),
          leads: weekLeads.length,
          converted: 0, // will be enriched below
        });
      }

      // Count converted - leads in last column (highest order_index) per kanban
      const lastColumns = new Set<string>();
      if (columns && columns.length > 0) {
        const kanbanLastCol = new Map<string, { id: string; order: number }>();
        columns.forEach(c => {
          const existing = kanbanLastCol.get(c.kanban_id);
          if (!existing || c.order_index > existing.order) {
            kanbanLastCol.set(c.kanban_id, { id: c.id, order: c.order_index });
          }
        });
        kanbanLastCol.forEach(v => lastColumns.add(v.id));
      }
      const convertedLeads = (allLeads || []).filter(l => lastColumns.has(l.column_id));

      // Enrich weekly trend with converted
      for (let i = 4; i >= 0; i--) {
        const weekStart = subDays(now, (i + 1) * 7);
        const weekEnd = subDays(now, i * 7);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
        const weekConverted = convertedLeads.filter(l =>
          l.created_at >= weekStartStr && l.created_at < weekEndStr + 'T23:59:59'
        );
        weeklyTrend[4 - i].converted = weekConverted.length;
      }

      const totalLeads = (allLeads || []).length;
      const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;
      const prevTotal = prevMonthLeads.length;
      const currTotal = currentMonthLeads.length;
      const leadGrowth = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : 0;

      return {
        totalLeads,
        currentMonthLeads: currTotal,
        prevMonthLeads: prevTotal,
        leadGrowth,
        conversionRate,
        convertedCount: convertedLeads.length,
        pipelineCounts,
        sourceCounts,
        weeklyTrend,
      };
    },
    enabled: !!accountId,
  });

  // ===== TASKS DATA =====
  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['avivar-dashboard-tasks', accountId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tasks, error } = await supabase
        .from('lead_tasks')
        .select('id, title, due_at, completed_at, priority, lead_id, assigned_to, created_by')
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .is('completed_at', null)
        .order('due_at', { ascending: true });
      if (error) throw error;

      // Get lead names for tasks
      const leadIds = [...new Set((tasks || []).filter(t => t.lead_id).map(t => t.lead_id))];
      let leadNames: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name')
          .in('id', leadIds);
        if (leads) {
          leadNames = Object.fromEntries(leads.map(l => [l.id, l.name || 'Sem nome']));
        }
      }

      const pendingTasks = tasks || [];
      const overdueTasks = pendingTasks.filter(t => t.due_at && new Date(t.due_at) < now);
      const urgentTasks = pendingTasks
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          lead: t.lead_id ? (leadNames[t.lead_id] || 'Lead') : 'Geral',
          task: t.title || 'Tarefa',
          due: t.due_at
            ? new Date(t.due_at) < now
              ? 'Atrasada'
              : format(new Date(t.due_at), "dd/MM HH:mm")
            : 'Sem prazo',
          priority: t.due_at && new Date(t.due_at) < now ? 'high' : (t.priority || 'medium'),
        }));

      return {
        totalPending: pendingTasks.length,
        overdueCount: overdueTasks.length,
        urgentTasks,
      };
    },
    enabled: !!accountId,
  });

  // ===== CONVERSATIONS DATA =====
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['avivar-dashboard-conversations'],
    queryFn: async () => {
      const { data: conversations, error } = await supabase
        .from('crm_conversations')
        .select('id, lead_id, last_message, last_message_at, unread_count')
        .gt('unread_count', 0)
        .order('last_message_at', { ascending: false })
        .limit(5);
      if (error) throw error;

      // Get lead names
      const leadIds = [...new Set((conversations || []).filter(c => c.lead_id).map(c => c.lead_id!))];
      let leadNames: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name')
          .in('id', leadIds);
        if (leads) {
          leadNames = Object.fromEntries(leads.map(l => [l.id, l.name || 'Sem nome']));
        }
      }

      const recentConversations = (conversations || []).map(c => {
        const timeDiff = c.last_message_at 
          ? Math.floor((now.getTime() - new Date(c.last_message_at).getTime()) / 60000)
          : 0;
        const timeLabel = timeDiff < 60 ? `${timeDiff} min` : timeDiff < 1440 ? `${Math.floor(timeDiff / 60)}h` : `${Math.floor(timeDiff / 1440)}d`;
        
        return {
          id: c.id,
          lead: c.lead_id ? (leadNames[c.lead_id] || 'Lead') : 'Desconhecido',
          message: c.last_message || 'Nova mensagem',
          time: timeLabel,
          unread: (c.unread_count || 0) > 0,
          leadId: c.lead_id,
          phone: null as string | null,
        };
      });

      return { recentConversations };
    },
  });

  // ===== AI ACTIVITY DATA =====
  const { data: aiData } = useQuery({
    queryKey: ['avivar-dashboard-ai', accountId],
    queryFn: async () => {
      if (!accountId) return { qualifiedToday: 0, messagesSent: 0 };
      
      const todayStr = format(now, 'yyyy-MM-dd');
      
      // Count messages sent today by AI (via crm_messages)
      const { count: aiMessages } = await supabase
        .from('crm_messages')
        .select('id', { count: 'exact', head: true })
        .eq('direction', 'outbound')
        .eq('is_ai_generated', true)
        .gte('created_at', todayStr + 'T00:00:00');

      return {
        qualifiedToday: 0, // Could track via kanban moves but skipping for now
        messagesSent: aiMessages || 0,
      };
    },
    enabled: !!accountId,
  });

  // Derived data
  const pipelineChartData = useMemo(() => {
    if (!leadsData?.pipelineCounts) return [];
    return Object.entries(leadsData.pipelineCounts).map(([stage, count]) => ({
      stage,
      count,
      color: PIPELINE_COLORS[stage] || DEFAULT_COLOR,
    }));
  }, [leadsData]);

  const sourceChartData = useMemo(() => {
    if (!leadsData?.sourceCounts) return [];
    return Object.entries(leadsData.sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
  }, [leadsData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isLoading = loadingLeads || loadingTasks || loadingConversations;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Dashboard
            <Badge className="bg-[hsl(var(--avivar-primary))] border-0 text-white">
              <Bot className="h-3 w-3 mr-1" />
              IA Ativa
            </Badge>
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Visão geral do seu funil comercial com IA</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]" asChild>
            <Link to="/avivar/leads">Ver Todos Leads</Link>
          </Button>
          <Button 
            size="sm" 
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.25)]"
            onClick={() => navigate('/avivar/inbox')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[hsl(var(--avivar-primary)/0.1)] rounded-full blur-2xl group-hover:bg-[hsl(var(--avivar-primary)/0.2)] transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-[hsl(var(--avivar-muted-foreground))]">
              <span>Total de Leads</span>
              <Flame className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLeads ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{leadsData?.totalLeads || 0}</div>
                <div className={cn(
                  "flex items-center text-xs mt-1",
                  (leadsData?.leadGrowth || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {(leadsData?.leadGrowth || 0) >= 0 
                    ? <ArrowUpRight className="h-3 w-3 mr-1" /> 
                    : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {Math.abs(leadsData?.leadGrowth || 0).toFixed(0)}% vs mês anterior
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-[hsl(var(--avivar-muted-foreground))]">
              <span>Taxa de Conversão</span>
              <Target className="h-4 w-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLeads ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                {(leadsData?.conversionRate || 0).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads this month */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[hsl(var(--avivar-accent)/0.1)] rounded-full blur-2xl group-hover:bg-[hsl(var(--avivar-accent)/0.2)] transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-[hsl(var(--avivar-muted-foreground))]">
              <span>Leads no Mês</span>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--avivar-accent))]" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLeads ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{leadsData?.currentMonthLeads || 0}</div>
                <div className="flex items-center text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  Mês anterior: {leadsData?.prevMonthLeads || 0}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-[hsl(var(--avivar-muted-foreground))]">
              <span>Tarefas Pendentes</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTasks ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{tasksData?.totalPending || 0}</div>
                {(tasksData?.overdueCount || 0) > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {tasksData?.overdueCount} atrasadas
                    </Badge>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Card */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[hsl(var(--avivar-primary)/0.1)] via-transparent to-transparent" />
        <CardContent className="p-4 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--avivar-primary))] flex items-center justify-center shadow-lg shadow-[hsl(var(--avivar-primary)/0.3)]">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">Assistente AVIVAR IA</h3>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              {aiData?.messagesSent || 0} mensagens automáticas enviadas hoje
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
            onClick={() => navigate('/avivar/inbox')}
          >
            Ver Atividades
          </Button>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Trend */}
        <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">Evolução de Leads</CardTitle>
            <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Leads captados vs convertidos (últimas 5 semanas)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {loadingLeads ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadsData?.weeklyTrend || []}>
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-[hsl(var(--avivar-border))]" />
                    <XAxis dataKey="date" className="text-[hsl(var(--avivar-muted-foreground))]" stroke="currentColor" fontSize={12} />
                    <YAxis className="text-[hsl(var(--avivar-muted-foreground))]" stroke="currentColor" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--avivar-card))', 
                        borderRadius: '12px', 
                        border: '1px solid hsl(var(--avivar-border))',
                        color: 'hsl(var(--avivar-foreground))'
                      }} 
                    />
                    <Area type="monotone" dataKey="leads" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorLeadsAvivar)" name="Leads" />
                    <Area type="monotone" dataKey="converted" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorConvertedAvivar)" name="Convertidos" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">Pipeline</CardTitle>
            <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Distribuição por etapa</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLeads ? (
              <Skeleton className="h-[180px] w-full rounded-lg" />
            ) : pipelineChartData.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pipelineChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="count">
                        {pipelineChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--avivar-card))', borderRadius: '12px', border: '1px solid hsl(var(--avivar-border))', color: 'hsl(var(--avivar-foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {pipelineChartData.map((item) => (
                    <div key={item.stage} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[hsl(var(--avivar-muted-foreground))] text-xs truncate">{item.stage}</span>
                      <span className="font-medium ml-auto text-xs text-[hsl(var(--avivar-foreground))]">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-center text-[hsl(var(--avivar-muted-foreground))] py-8">Nenhum lead no pipeline</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tasks */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">Tarefas Urgentes</CardTitle>
              <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Follow-ups prioritários</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]" asChild>
              <Link to="/avivar/tasks">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (tasksData?.urgentTasks || []).length > 0 ? (
              <div className="space-y-3">
                {(tasksData?.urgentTasks || []).map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary))] cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.05)] transition-colors"
                    onClick={() => navigate('/avivar/tasks')}
                  >
                    <div>
                      <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">{task.lead}</p>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{task.task}</p>
                    </div>
                    <Badge className={cn(
                      "text-xs",
                      task.priority === 'high' 
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' 
                        : 'bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]'
                    )}>
                      {task.due}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-[hsl(var(--avivar-muted-foreground))] py-6">Nenhuma tarefa pendente 🎉</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">Conversas Recentes</CardTitle>
              <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Mensagens não lidas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]" asChild>
              <Link to="/avivar/inbox">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingConversations ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (conversationsData?.recentConversations || []).length > 0 ? (
              <div className="space-y-3">
                {(conversationsData?.recentConversations || []).map((conv) => (
                  <div 
                    key={conv.id} 
                    className="flex items-start gap-3 p-3 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary))] cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.05)] transition-colors"
                    onClick={() => navigate('/avivar/inbox')}
                  >
                    <MessageSquare className={cn(
                      "h-5 w-5 mt-0.5",
                      conv.unread ? "text-[hsl(var(--avivar-primary))]" : "text-[hsl(var(--avivar-muted-foreground))]"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">{conv.lead}</p>
                        <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{conv.time}</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate">{conv.message}</p>
                    </div>
                    {conv.unread && (
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--avivar-primary))] animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-[hsl(var(--avivar-muted-foreground))] py-6">Sem mensagens não lidas</p>
            )}
          </CardContent>
        </Card>

        {/* Sources */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">Leads por Fonte</CardTitle>
            <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">Origem dos leads</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLeads ? (
              <Skeleton className="h-[200px] w-full rounded-lg" />
            ) : sourceChartData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-[hsl(var(--avivar-border))]" />
                    <XAxis type="number" className="text-[hsl(var(--avivar-muted-foreground))]" stroke="currentColor" fontSize={10} />
                    <YAxis dataKey="source" type="category" className="text-[hsl(var(--avivar-muted-foreground))]" stroke="currentColor" fontSize={10} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--avivar-card))', borderRadius: '12px', border: '1px solid hsl(var(--avivar-border))', color: 'hsl(var(--avivar-foreground))' }} />
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
            ) : (
              <p className="text-sm text-center text-[hsl(var(--avivar-muted-foreground))] py-8">Sem dados de fontes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
