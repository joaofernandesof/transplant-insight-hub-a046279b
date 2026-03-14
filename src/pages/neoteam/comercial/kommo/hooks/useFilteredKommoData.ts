// ====================================
// useFilteredKommoData - Dados Kommo filtrados pelo contexto global
// ====================================

import { useMemo } from 'react';
import { useKommoFilters } from '../contexts/KommoFiltersContext';
import { useKommoLeads, useKommoTasks, useKommoStages } from './useKommoData';
import type { KommoLead, KommoTask } from '../services/kommoService';

function isInDateRange(dateStr: string | null, from: Date, to: Date): boolean {
  if (!dateStr) return true; // include if no date
  const d = new Date(dateStr);
  return d >= from && d <= to;
}

export function useFilteredLeads() {
  const { filters } = useKommoFilters();
  const { data: leads = [], isLoading } = useKommoLeads();

  const filtered = useMemo(() => {
    return leads.filter(lead => {
      // Date filter
      if (!isInDateRange(lead.created_at_kommo, filters.dateFrom, filters.dateTo)) return false;

      // Pipeline filter
      if (filters.pipelineKommoIds.length > 0) {
        const leadPipelineId = lead.pipeline_kommo_id != null ? Number(lead.pipeline_kommo_id) : null;
        if (leadPipelineId == null || !filters.pipelineKommoIds.some(id => Number(id) === leadPipelineId)) return false;
      }

      // Responsible filter
      if (filters.responsibleUserKommoIds.length > 0) {
        const leadResponsibleId = lead.responsible_user_kommo_id != null ? Number(lead.responsible_user_kommo_id) : null;
        if (leadResponsibleId == null || !filters.responsibleUserKommoIds.some(id => Number(id) === leadResponsibleId)) return false;
      }

      // Source filter
      if (filters.sources.length > 0) {
        const src = lead.source_name || lead.source || '';
        if (!filters.sources.includes(src)) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const leadTags = lead.tags || [];
        if (!filters.tags.some(t => leadTags.includes(t))) return false;
      }

      return true;
    });
  }, [leads, filters]);

  return { data: filtered, allLeads: leads, isLoading };
}

export function useFilteredTasks() {
  const { filters } = useKommoFilters();
  const { data: tasks = [], isLoading } = useKommoTasks();

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      if (!isInDateRange(task.created_at_kommo, filters.dateFrom, filters.dateTo)) return false;

      if (filters.responsibleUserKommoIds.length > 0 && task.responsible_user_kommo_id) {
        if (!filters.responsibleUserKommoIds.includes(task.responsible_user_kommo_id)) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  return { data: filtered, isLoading };
}

export function useFilteredStats() {
  const { data: leads } = useFilteredLeads();
  const { data: tasks } = useFilteredTasks();

  return useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.is_won);
    const lostLeads = leads.filter(l => l.is_lost);
    const openLeads = leads.filter(l => !l.is_won && !l.is_lost);
    const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.price || 0), 0);
    const avgTicket = wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0;
    const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    const lossRate = totalLeads > 0 ? (lostLeads.length / totalLeads) * 100 : 0;

    const completedTasks = tasks.filter(t => t.is_completed);
    const now = new Date();
    const overdueTasks = tasks.filter(t => !t.is_completed && t.complete_till && new Date(t.complete_till) < now);

    return {
      totalLeads,
      wonLeads: wonLeads.length,
      lostLeads: lostLeads.length,
      openLeads: openLeads.length,
      totalRevenue,
      avgTicket,
      conversionRate,
      lossRate,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
    };
  }, [leads, tasks]);
}
