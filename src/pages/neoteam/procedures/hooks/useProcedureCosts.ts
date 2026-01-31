/**
 * Hooks for Procedure Costs - Integration with Financial Module
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProcedureCostSummary {
  procedure_id: string;
  procedure_name: string;
  total_executions: number;
  total_cost: number;
  avg_cost_per_execution: number;
  min_cost: number;
  max_cost: number;
}

export interface ExecutionCostDetail {
  execution_id: string;
  procedure_name: string;
  patient_name: string;
  clinic_name: string;
  executed_at: string;
  total_cost: number;
  items_count: number;
  has_divergence: boolean;
}

export interface CostByPeriod {
  period: string;
  total_cost: number;
  executions_count: number;
  avg_cost: number;
}

export interface CostByCategory {
  category: string;
  category_label: string;
  total_cost: number;
  total_quantity: number;
  items_count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  material_descartavel: 'Material Descartável',
  medicamento: 'Medicamento',
  epi: 'EPI',
  insumo: 'Insumo'
};

/**
 * Get cost summary by procedure
 */
export function useProcedureCostSummary(filters?: {
  clinicId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['procedure-cost-summary', filters],
    queryFn: async () => {
      // Get all executions with costs
      let query = supabase
        .from('procedure_executions')
        .select(`
          id,
          procedure_id,
          total_cost,
          executed_at,
          procedure:procedures(name)
        `)
        .eq('status', 'finalizado')
        .order('executed_at', { ascending: false });
      
      if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters?.startDate) {
        query = query.gte('executed_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('executed_at', filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Group by procedure
      const grouped = (data || []).reduce((acc, exec) => {
        const procId = exec.procedure_id;
        if (!acc[procId]) {
          acc[procId] = {
            procedure_id: procId,
            procedure_name: (exec.procedure as any)?.name || 'Desconhecido',
            executions: [],
            total_cost: 0
          };
        }
        acc[procId].executions.push(exec);
        acc[procId].total_cost += exec.total_cost || 0;
        return acc;
      }, {} as Record<string, any>);
      
      // Calculate summaries
      const summaries: ProcedureCostSummary[] = Object.values(grouped).map((g: any) => {
        const costs = g.executions.map((e: any) => e.total_cost || 0);
        return {
          procedure_id: g.procedure_id,
          procedure_name: g.procedure_name,
          total_executions: g.executions.length,
          total_cost: g.total_cost,
          avg_cost_per_execution: g.total_cost / g.executions.length,
          min_cost: Math.min(...costs),
          max_cost: Math.max(...costs)
        };
      });
      
      return summaries.sort((a, b) => b.total_cost - a.total_cost);
    }
  });
}

/**
 * Get detailed costs by execution
 */
export function useExecutionCosts(filters?: {
  clinicId?: string;
  procedureId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['execution-costs', filters],
    queryFn: async () => {
      let query = supabase
        .from('procedure_executions')
        .select(`
          id,
          total_cost,
          executed_at,
          procedure:procedures(name),
          patient:clinic_patients(full_name),
          clinic:clinics(name)
        `)
        .eq('status', 'finalizado')
        .order('executed_at', { ascending: false })
        .limit(filters?.limit || 50);
      
      if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters?.procedureId) {
        query = query.eq('procedure_id', filters.procedureId);
      }
      if (filters?.startDate) {
        query = query.gte('executed_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('executed_at', filters.endDate);
      }
      
      const { data: executions, error } = await query;
      if (error) throw error;
      
      // Get consumption entries count and divergence info
      const execIds = (executions || []).map(e => e.id);
      const { data: entries } = await supabase
        .from('consumption_entries')
        .select('execution_id, has_divergence')
        .in('execution_id', execIds);
      
      const entryMap = (entries || []).reduce((acc, e) => {
        if (!acc[e.execution_id]) {
          acc[e.execution_id] = { count: 0, hasDivergence: false };
        }
        acc[e.execution_id].count++;
        if (e.has_divergence) acc[e.execution_id].hasDivergence = true;
        return acc;
      }, {} as Record<string, { count: number; hasDivergence: boolean }>);
      
      const details: ExecutionCostDetail[] = (executions || []).map(exec => ({
        execution_id: exec.id,
        procedure_name: (exec.procedure as any)?.name || 'Desconhecido',
        patient_name: (exec.patient as any)?.full_name || 'N/A',
        clinic_name: (exec.clinic as any)?.name || 'N/A',
        executed_at: exec.executed_at,
        total_cost: exec.total_cost || 0,
        items_count: entryMap[exec.id]?.count || 0,
        has_divergence: entryMap[exec.id]?.hasDivergence || false
      }));
      
      return details;
    }
  });
}

/**
 * Get costs grouped by time period (daily/weekly/monthly)
 */
export function useCostsByPeriod(groupBy: 'day' | 'week' | 'month' = 'day', filters?: {
  clinicId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['costs-by-period', groupBy, filters],
    queryFn: async () => {
      let query = supabase
        .from('procedure_executions')
        .select('executed_at, total_cost')
        .eq('status', 'finalizado')
        .order('executed_at', { ascending: true });
      
      if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters?.startDate) {
        query = query.gte('executed_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('executed_at', filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Group by period
      const grouped = (data || []).reduce((acc, exec) => {
        const date = new Date(exec.executed_at);
        let periodKey: string;
        
        if (groupBy === 'day') {
          periodKey = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
        } else {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        if (!acc[periodKey]) {
          acc[periodKey] = { total_cost: 0, count: 0 };
        }
        acc[periodKey].total_cost += exec.total_cost || 0;
        acc[periodKey].count++;
        return acc;
      }, {} as Record<string, { total_cost: number; count: number }>);
      
      const periods: CostByPeriod[] = Object.entries(grouped).map(([period, data]) => ({
        period,
        total_cost: data.total_cost,
        executions_count: data.count,
        avg_cost: data.total_cost / data.count
      }));
      
      return periods.sort((a, b) => a.period.localeCompare(b.period));
    }
  });
}

/**
 * Get costs by item category
 */
export function useCostsByCategory(filters?: {
  clinicId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['costs-by-category', filters],
    queryFn: async () => {
      // Get consumption entries with stock item info
      let query = supabase
        .from('consumption_entries')
        .select(`
          total_cost,
          quantity_used,
          stock_item:stock_items(category),
          execution:procedure_executions(executed_at, clinic_id, status)
        `);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by execution status and optional filters
      const filtered = (data || []).filter(entry => {
        const exec = entry.execution as any;
        if (exec?.status !== 'finalizado') return false;
        if (filters?.clinicId && exec?.clinic_id !== filters.clinicId) return false;
        if (filters?.startDate && exec?.executed_at < filters.startDate) return false;
        if (filters?.endDate && exec?.executed_at > filters.endDate) return false;
        return true;
      });
      
      // Group by category
      const grouped = filtered.reduce((acc, entry) => {
        const category = (entry.stock_item as any)?.category || 'outros';
        if (!acc[category]) {
          acc[category] = { total_cost: 0, total_quantity: 0, items: new Set() };
        }
        acc[category].total_cost += entry.total_cost || 0;
        acc[category].total_quantity += entry.quantity_used || 0;
        acc[category].items.add((entry.stock_item as any)?.id);
        return acc;
      }, {} as Record<string, { total_cost: number; total_quantity: number; items: Set<string> }>);
      
      const categories: CostByCategory[] = Object.entries(grouped).map(([cat, data]) => ({
        category: cat,
        category_label: CATEGORY_LABELS[cat] || 'Outros',
        total_cost: data.total_cost,
        total_quantity: data.total_quantity,
        items_count: data.items.size
      }));
      
      return categories.sort((a, b) => b.total_cost - a.total_cost);
    }
  });
}

/**
 * Get total financial summary
 */
export function useProcedureFinancialSummary(filters?: {
  clinicId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['procedure-financial-summary', filters],
    queryFn: async () => {
      let query = supabase
        .from('procedure_executions')
        .select('total_cost, status, executed_at, clinic_id')
        .eq('status', 'finalizado');
      
      if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters?.startDate) {
        query = query.gte('executed_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('executed_at', filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const executions = data || [];
      const totalCost = executions.reduce((sum, e) => sum + (e.total_cost || 0), 0);
      const avgCost = executions.length > 0 ? totalCost / executions.length : 0;
      
      // Get today's costs
      const today = new Date().toISOString().split('T')[0];
      const todayExecutions = executions.filter(e => e.executed_at.startsWith(today));
      const todayCost = todayExecutions.reduce((sum, e) => sum + (e.total_cost || 0), 0);
      
      // Get this month's costs
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthExecutions = executions.filter(e => e.executed_at.startsWith(thisMonth));
      const monthCost = monthExecutions.reduce((sum, e) => sum + (e.total_cost || 0), 0);
      
      return {
        total_cost: totalCost,
        total_executions: executions.length,
        avg_cost_per_execution: avgCost,
        today_cost: todayCost,
        today_executions: todayExecutions.length,
        month_cost: monthCost,
        month_executions: monthExecutions.length
      };
    }
  });
}
