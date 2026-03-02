/**
 * useSectorDashboardData - Hook que carrega KPIs reais por setor
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withCache } from '@/lib/queryClient';

export interface SectorKpi {
  label: string;
  value: number | string;
  variant?: 'default' | 'warning' | 'success' | 'info';
  badge?: string;
}

export interface SectorDashboardData {
  kpis: SectorKpi[];
  isLoading: boolean;
}

async function fetchTecnico(): Promise<SectorKpi[]> {
  const [surgeries, tasks, pops] = await Promise.all([
    supabase.from('clinic_surgeries').select('id', { count: 'exact', head: true }),
    supabase.from('neoteam_tasks').select('id', { count: 'exact', head: true }).eq('category', 'clinico'),
    supabase.from('neoteam_pops').select('id', { count: 'exact', head: true }),
  ]);
  const tasksPending = await supabase.from('neoteam_tasks').select('id', { count: 'exact', head: true }).eq('category', 'clinico').neq('status', 'done');
  return [
    { label: 'Cirurgias Registradas', value: surgeries.count ?? 0 },
    { label: 'Tarefas Clínicas', value: tasks.count ?? 0 },
    { label: 'Pendentes', value: tasksPending.count ?? 0, variant: (tasksPending.count ?? 0) > 0 ? 'warning' : 'success' },
    { label: 'POPs Cadastrados', value: pops.count ?? 0 },
  ];
}

async function fetchSucessoPaciente(): Promise<SectorKpi[]> {
  const [chamados, chamadosAbertos] = await Promise.all([
    supabase.from('postvenda_chamados').select('id', { count: 'exact', head: true }),
    supabase.from('postvenda_chamados').select('id', { count: 'exact', head: true }).neq('status', 'resolvido'),
  ]);
  return [
    { label: 'Chamados Totais', value: chamados.count ?? 0 },
    { label: 'Chamados Abertos', value: chamadosAbertos.count ?? 0, variant: (chamadosAbertos.count ?? 0) > 0 ? 'info' : 'success' },
    { label: 'Taxa Resolução', value: chamados.count ? `${Math.round(((chamados.count - (chamadosAbertos.count ?? 0)) / chamados.count) * 100)}%` : '—', variant: 'success' },
  ];
}

async function fetchOperacional(): Promise<SectorKpi[]> {
  const [total, pending, overdue, cleaning] = await Promise.all([
    supabase.from('neoteam_tasks').select('id', { count: 'exact', head: true }),
    supabase.from('neoteam_tasks').select('id', { count: 'exact', head: true }).neq('status', 'done').neq('status', 'cancelled'),
    supabase.from('neoteam_tasks').select('id', { count: 'exact', head: true }).neq('status', 'done').lt('due_date', new Date().toISOString()),
    supabase.from('cleaning_daily_routines').select('id', { count: 'exact', head: true }),
  ]);
  const done = (total.count ?? 0) - (pending.count ?? 0);
  return [
    { label: 'Tarefas Totais', value: total.count ?? 0 },
    { label: 'Pendentes', value: pending.count ?? 0, variant: 'info' },
    { label: 'Em Atraso', value: overdue.count ?? 0, variant: (overdue.count ?? 0) > 0 ? 'warning' : 'success' },
    { label: 'Concluídas', value: done, variant: 'success', badge: total.count ? `${Math.round((done / total.count) * 100)}%` : '0%' },
  ];
}

async function fetchProcessos(): Promise<SectorKpi[]> {
  const [templates, instances] = await Promise.all([
    supabase.from('neoteam_process_templates').select('id', { count: 'exact', head: true }),
    supabase.from('neoteam_process_instances').select('id', { count: 'exact', head: true }),
  ]);
  const running = await supabase.from('neoteam_process_instances').select('id', { count: 'exact', head: true }).eq('status', 'em_andamento');
  return [
    { label: 'Templates', value: templates.count ?? 0 },
    { label: 'Instâncias', value: instances.count ?? 0 },
    { label: 'Em Andamento', value: running.count ?? 0, variant: 'info' },
  ];
}

async function fetchFinanceiro(): Promise<SectorKpi[]> {
  const [sales, contracts] = await Promise.all([
    supabase.from('clinic_sales').select('id', { count: 'exact', head: true }),
    supabase.from('clinic_contracts').select('id', { count: 'exact', head: true }),
  ]);
  return [
    { label: 'Vendas Registradas', value: sales.count ?? 0 },
    { label: 'Contratos', value: contracts.count ?? 0 },
  ];
}

async function fetchJuridico(): Promise<SectorKpi[]> {
  const [reviews, pending] = await Promise.all([
    supabase.from('contract_review_requests').select('id', { count: 'exact', head: true }),
    supabase.from('contract_review_requests').select('id', { count: 'exact', head: true }).eq('status', 'em_analise'),
  ]);
  return [
    { label: 'Revisões Solicitadas', value: reviews.count ?? 0 },
    { label: 'Pendentes', value: pending.count ?? 0, variant: (pending.count ?? 0) > 0 ? 'warning' : 'success' },
  ];
}

async function fetchMarketing(): Promise<SectorKpi[]> {
  const [events, diaryEntries] = await Promise.all([
    supabase.from('system_event_logs').select('id', { count: 'exact', head: true }),
    supabase.from('neoteam_diary_entries').select('id', { count: 'exact', head: true }),
  ]);
  return [
    { label: 'Eventos Registrados', value: events.count ?? 0 },
    { label: 'Entradas no Diário', value: diaryEntries.count ?? 0 },
  ];
}

async function fetchTI(): Promise<SectorKpi[]> {
  const [inventory] = await Promise.all([
    supabase.from('portal_inventory_items').select('id', { count: 'exact', head: true }),
  ]);
  return [
    { label: 'Itens no Inventário', value: inventory.count ?? 0 },
  ];
}

async function fetchRH(): Promise<SectorKpi[]> {
  const [colabs, vagas, cargos] = await Promise.all([
    supabase.from('rh_colaboradores').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('rh_vagas').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
    supabase.from('rh_cargos').select('id', { count: 'exact', head: true }),
  ]);
  return [
    { label: 'Colaboradores Ativos', value: colabs.count ?? 0 },
    { label: 'Vagas Abertas', value: vagas.count ?? 0, variant: 'info' },
    { label: 'Cargos Cadastrados', value: cargos.count ?? 0 },
  ];
}

const SECTOR_FETCHERS: Record<string, () => Promise<SectorKpi[]>> = {
  tecnico: fetchTecnico,
  sucesso_paciente: fetchSucessoPaciente,
  operacional: fetchOperacional,
  processos: fetchProcessos,
  financeiro: fetchFinanceiro,
  juridico: fetchJuridico,
  marketing: fetchMarketing,
  ti: fetchTI,
  rh: fetchRH,
};

export function useSectorDashboardData(sectorCode: string): SectorDashboardData {
  const { data, isLoading } = useQuery({
    queryKey: ['sector-dashboard', sectorCode],
    queryFn: () => {
      const fetcher = SECTOR_FETCHERS[sectorCode];
      if (!fetcher) return [] as SectorKpi[];
      return fetcher();
    },
    enabled: !!sectorCode,
    ...withCache('SHORT'),
  });

  return { kpis: data ?? [], isLoading };
}
