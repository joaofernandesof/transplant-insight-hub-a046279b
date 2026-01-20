import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export interface CrmMetrics {
  totalLeads: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  leadGrowth: number;
  
  conversionRate: number;
  convertedThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  byState: { state: string; count: number }[];
  byProcedure: { procedure: string; count: number; revenue: number }[];
  
  dailyLeads: { date: string; count: number; converted: number }[];
  funnelConversion: { from: string; to: string; rate: number }[];
  
  pendingTasks: number;
  overdueTasks: number;
  openConversations: number;
}

export function useCrmMetrics(dateRange?: { start: Date; end: Date }) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  return useQuery({
    queryKey: ['crm-metrics', dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: async (): Promise<CrmMetrics> => {
      // Fetch all leads
      const { data: leads = [] } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch tasks
      const { data: tasks = [] } = await supabase
        .from('lead_tasks')
        .select('*')
        .is('completed_at', null);

      // Fetch conversations
      const { data: conversations = [] } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('status', 'open');

      // Calculate metrics
      const totalLeads = leads.length;
      
      const leadsThisMonth = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= thisMonthStart && created <= thisMonthEnd;
      }).length;

      const leadsLastMonth = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= lastMonthStart && created <= lastMonthEnd;
      }).length;

      const leadGrowth = leadsLastMonth > 0 
        ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100 
        : 100;

      const convertedLeads = leads.filter(l => l.status === 'converted');
      const convertedThisMonth = convertedLeads.filter(l => {
        const converted = l.converted_at ? new Date(l.converted_at) : new Date(l.updated_at);
        return converted >= thisMonthStart && converted <= thisMonthEnd;
      }).length;

      const conversionRate = totalLeads > 0 
        ? (convertedLeads.length / totalLeads) * 100 
        : 0;

      const totalRevenue = convertedLeads.reduce((acc, l) => acc + (l.converted_value || 0), 0);
      const revenueThisMonth = convertedLeads
        .filter(l => {
          const converted = l.converted_at ? new Date(l.converted_at) : new Date(l.updated_at);
          return converted >= thisMonthStart && converted <= thisMonthEnd;
        })
        .reduce((acc, l) => acc + (l.converted_value || 0), 0);

      // By status
      const statusCounts: Record<string, number> = {};
      leads.forEach(l => {
        const status = l.status || 'new';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      // By source
      const sourceCounts: Record<string, number> = {};
      leads.forEach(l => {
        const source = l.source || 'Direto';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const bySource = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      // By state
      const stateCounts: Record<string, number> = {};
      leads.forEach(l => {
        if (l.state) {
          stateCounts[l.state] = (stateCounts[l.state] || 0) + 1;
        }
      });
      const byState = Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);

      // By procedure
      const procedureCounts: Record<string, { count: number; revenue: number }> = {};
      leads.forEach(l => {
        const procedures = l.procedures_sold || [l.procedure_interest].filter(Boolean);
        procedures.forEach((p: string) => {
          if (!procedureCounts[p]) {
            procedureCounts[p] = { count: 0, revenue: 0 };
          }
          procedureCounts[p].count += 1;
          if (l.status === 'converted') {
            procedureCounts[p].revenue += (l.converted_value || 0) / procedures.length;
          }
        });
      });
      const byProcedure = Object.entries(procedureCounts)
        .map(([procedure, data]) => ({ procedure, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Daily leads (last 30 days)
      const thirtyDaysAgo = subMonths(now, 1);
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
      const dailyLeads = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dayLeads = leads.filter(l => {
          const created = new Date(l.created_at);
          return created >= dayStart && created <= dayEnd;
        });
        const converted = dayLeads.filter(l => l.status === 'converted').length;
        return {
          date: format(day, 'yyyy-MM-dd'),
          count: dayLeads.length,
          converted,
        };
      });

      // Funnel conversion rates
      const statusOrder = ['new', 'contacted', 'scheduled', 'converted'];
      const funnelConversion = [];
      for (let i = 0; i < statusOrder.length - 1; i++) {
        const fromCount = statusCounts[statusOrder[i]] || 0;
        const toCount = statusCounts[statusOrder[i + 1]] || 0;
        const rate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;
        funnelConversion.push({
          from: statusOrder[i],
          to: statusOrder[i + 1],
          rate: Math.round(rate * 10) / 10,
        });
      }

      // Tasks metrics
      const pendingTasks = tasks.length;
      const overdueTasks = tasks.filter(t => t.due_at && new Date(t.due_at) < now).length;

      return {
        totalLeads,
        leadsThisMonth,
        leadsLastMonth,
        leadGrowth: Math.round(leadGrowth * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
        convertedThisMonth,
        totalRevenue,
        revenueThisMonth,
        byStatus,
        bySource,
        byState,
        byProcedure,
        dailyLeads,
        funnelConversion,
        pendingTasks,
        overdueTasks,
        openConversations: conversations.length,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
