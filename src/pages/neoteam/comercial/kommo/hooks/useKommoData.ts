import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withCache } from '@/lib/queryClient';
import {
  fetchPipelines,
  fetchPipelineStages,
  fetchLeads,
  fetchUsers,
  fetchTasks,
  fetchContacts,
  fetchLossReasons,
  fetchSyncConfig,
  fetchSyncLogs,
  triggerSync,
} from '../services/kommoService';
import { toast } from 'sonner';

// Query keys
const KOMMO_KEYS = {
  pipelines: ['kommo', 'pipelines'] as const,
  stages: (pipelineId?: number) => ['kommo', 'stages', pipelineId] as const,
  leads: ['kommo', 'leads'] as const,
  users: ['kommo', 'users'] as const,
  tasks: ['kommo', 'tasks'] as const,
  contacts: ['kommo', 'contacts'] as const,
  lossReasons: ['kommo', 'loss-reasons'] as const,
  syncConfig: ['kommo', 'sync-config'] as const,
  syncLogs: ['kommo', 'sync-logs'] as const,
};

export function useKommoPipelines() {
  return useQuery({
    queryKey: KOMMO_KEYS.pipelines,
    queryFn: fetchPipelines,
    ...withCache('MEDIUM'),
  });
}

export function useKommoStages(pipelineKommoId?: number) {
  return useQuery({
    queryKey: KOMMO_KEYS.stages(pipelineKommoId),
    queryFn: () => fetchPipelineStages(pipelineKommoId),
    ...withCache('MEDIUM'),
  });
}

export function useKommoLeads() {
  return useQuery({
    queryKey: KOMMO_KEYS.leads,
    queryFn: fetchLeads,
    ...withCache('SHORT'),
  });
}

export function useKommoUsers() {
  return useQuery({
    queryKey: KOMMO_KEYS.users,
    queryFn: fetchUsers,
    ...withCache('LONG'),
  });
}

export function useKommoTasks() {
  return useQuery({
    queryKey: KOMMO_KEYS.tasks,
    queryFn: fetchTasks,
    ...withCache('SHORT'),
  });
}

export function useKommoContacts() {
  return useQuery({
    queryKey: KOMMO_KEYS.contacts,
    queryFn: fetchContacts,
    ...withCache('MEDIUM'),
  });
}

export function useKommoLossReasons() {
  return useQuery({
    queryKey: KOMMO_KEYS.lossReasons,
    queryFn: fetchLossReasons,
    ...withCache('LONG'),
  });
}

export function useKommoSyncConfig() {
  return useQuery({
    queryKey: KOMMO_KEYS.syncConfig,
    queryFn: fetchSyncConfig,
    ...withCache('SHORT'),
  });
}

export function useKommoSyncLogs() {
  return useQuery({
    queryKey: KOMMO_KEYS.syncLogs,
    queryFn: () => fetchSyncLogs(20),
    ...withCache('SHORT'),
  });
}

export function useKommoSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ syncType, entities }: { syncType?: 'full' | 'incremental'; entities?: string[] } = {}) =>
      triggerSync(syncType || 'full', entities),
    onSuccess: (data) => {
      toast.success('Sincronização concluída', {
        description: `${Object.values(data.recordsSynced || {}).reduce((a: number, b: any) => a + (b as number), 0)} registros sincronizados em ${Math.round((data.durationMs || 0) / 1000)}s`,
      });
      // Invalidate all kommo queries
      queryClient.invalidateQueries({ queryKey: ['kommo'] });
    },
    onError: (error: any) => {
      toast.error('Erro na sincronização', {
        description: error.message || 'Falha ao sincronizar dados do Kommo',
      });
    },
  });
}

// Computed data hooks
export function useKommoStats() {
  const { data: leads = [] } = useKommoLeads();
  const { data: tasks = [] } = useKommoTasks();
  const { data: pipelines = [] } = useKommoPipelines();

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.is_won);
  const lostLeads = leads.filter(l => l.is_lost);
  const openLeads = leads.filter(l => !l.is_won && !l.is_lost);
  const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.price || 0), 0);
  const avgTicket = wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0;
  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
  const lossRate = totalLeads > 0 ? (lostLeads.length / totalLeads) * 100 : 0;

  const completedTasks = tasks.filter(t => t.is_completed);
  const overdueTasks = tasks.filter(t => !t.is_completed && t.complete_till && new Date(t.complete_till) < new Date());

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
    totalPipelines: pipelines.length,
  };
}
