import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionLog {
  id: string;
  function_name: string;
  execution_time_ms: number | null;
  status: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  model_used: string | null;
  estimated_cost_usd: number | null;
  account_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

export interface MonitoringFilters {
  period: 'today' | '7d' | '30d' | 'custom';
  functionName?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

function getDateRange(filters: MonitoringFilters) {
  const now = new Date();
  let start: Date;
  let end = now;

  switch (filters.period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      start = filters.startDate ? new Date(filters.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = filters.endDate ? new Date(filters.endDate) : now;
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

export function useEdgeFunctionLogs(filters: MonitoringFilters) {
  return useQuery({
    queryKey: ['edge-function-logs', filters],
    queryFn: async () => {
      const { start, end } = getDateRange(filters);

      let query = supabase
        .from('edge_function_logs')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (filters.functionName) {
        query = query.eq('function_name', filters.functionName);
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EdgeFunctionLog[];
    },
    refetchInterval: 30000,
  });
}

export function useMonitoringKPIs(logs: EdgeFunctionLog[]) {
  const totalExecutions = logs.length;
  const totalCost = logs.reduce((sum, l) => sum + (Number(l.estimated_cost_usd) || 0), 0);
  const errorCount = logs.filter(l => l.status === 'error').length;
  const errorRate = totalExecutions > 0 ? (errorCount / totalExecutions) * 100 : 0;

  const fnCounts: Record<string, number> = {};
  logs.forEach(l => {
    fnCounts[l.function_name] = (fnCounts[l.function_name] || 0) + 1;
  });
  const mostCalledFn = Object.entries(fnCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalExecutions,
    totalCost,
    errorRate,
    mostCalledFunction: mostCalledFn ? { name: mostCalledFn[0], count: mostCalledFn[1] } : null,
  };
}

export function useCostByAccount(logs: EdgeFunctionLog[]) {
  const map: Record<string, { accountId: string; executions: number; tokens: number; cost: number }> = {};
  logs.forEach(l => {
    if (!l.account_id) return;
    if (!map[l.account_id]) {
      map[l.account_id] = { accountId: l.account_id, executions: 0, tokens: 0, cost: 0 };
    }
    map[l.account_id].executions++;
    map[l.account_id].tokens += (l.tokens_input || 0) + (l.tokens_output || 0);
    map[l.account_id].cost += Number(l.estimated_cost_usd) || 0;
  });
  return Object.values(map).sort((a, b) => b.cost - a.cost);
}

export function useCostByFunction(logs: EdgeFunctionLog[]) {
  const map: Record<string, { functionName: string; executions: number; avgTime: number; tokensIn: number; tokensOut: number; cost: number; errors: number; totalTime: number }> = {};
  logs.forEach(l => {
    if (!map[l.function_name]) {
      map[l.function_name] = { functionName: l.function_name, executions: 0, avgTime: 0, tokensIn: 0, tokensOut: 0, cost: 0, errors: 0, totalTime: 0 };
    }
    const m = map[l.function_name];
    m.executions++;
    m.totalTime += l.execution_time_ms || 0;
    m.tokensIn += l.tokens_input || 0;
    m.tokensOut += l.tokens_output || 0;
    m.cost += Number(l.estimated_cost_usd) || 0;
    if (l.status === 'error') m.errors++;
  });
  return Object.values(map).map(m => ({
    ...m,
    avgTime: m.executions > 0 ? Math.round(m.totalTime / m.executions) : 0,
    errorRate: m.executions > 0 ? (m.errors / m.executions) * 100 : 0,
  })).sort((a, b) => b.cost - a.cost);
}

export function useNeoHubCost(logs: EdgeFunctionLog[]) {
  const neohubLogs = logs.filter(l => !l.account_id);
  const totalCost = neohubLogs.reduce((sum, l) => sum + (Number(l.estimated_cost_usd) || 0), 0);

  const breakdown: Record<string, number> = {};
  neohubLogs.forEach(l => {
    breakdown[l.function_name] = (breakdown[l.function_name] || 0) + (Number(l.estimated_cost_usd) || 0);
  });

  return {
    totalCost,
    breakdown: Object.entries(breakdown).map(([fn, cost]) => ({ functionName: fn, cost })).sort((a, b) => b.cost - a.cost),
  };
}

export function useDailyCostChart(logs: EdgeFunctionLog[]) {
  const dailyMap: Record<string, { date: string; neohub: number; avivar: number }> = {};
  logs.forEach(l => {
    const date = l.created_at.substring(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { date, neohub: 0, avivar: 0 };
    const cost = Number(l.estimated_cost_usd) || 0;
    if (l.account_id) {
      dailyMap[date].avivar += cost;
    } else {
      dailyMap[date].neohub += cost;
    }
  });
  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
}

export function useAccountNames(accountIds: string[]) {
  return useQuery({
    queryKey: ['avivar-account-names', accountIds],
    queryFn: async () => {
      if (accountIds.length === 0) return {};
      const { data, error } = await supabase
        .from('avivar_accounts')
        .select('id, name')
        .in('id', accountIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((a: { id: string; name: string }) => { map[a.id] = a.name; });
      return map;
    },
    enabled: accountIds.length > 0,
  });
}
