import { supabase } from '@/integrations/supabase/client';

// =============================================
// Kommo Data Service - Read from cache tables
// =============================================

export interface KommoPipeline {
  id: string;
  kommo_id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_active: boolean;
  pipeline_type: string;
  synced_at: string;
}

export interface KommoPipelineStage {
  id: string;
  kommo_id: number;
  pipeline_kommo_id: number;
  name: string;
  sort: number;
  color: string | null;
  is_closed: boolean;
  close_type: string | null;
  synced_at: string;
}

export interface KommoLead {
  id: string;
  kommo_id: number;
  name: string | null;
  price: number;
  pipeline_kommo_id: number | null;
  stage_kommo_id: number | null;
  responsible_user_kommo_id: number | null;
  status_id: number | null;
  loss_reason: string | null;
  source: string | null;
  source_name: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  tags: string[];
  is_won: boolean;
  is_lost: boolean;
  closed_at: string | null;
  created_at_kommo: string | null;
  updated_at_kommo: string | null;
  first_contact_at: string | null;
  custom_fields: Record<string, any>;
  synced_at: string;
}

export interface KommoUser {
  id: string;
  kommo_id: number;
  name: string;
  email: string | null;
  role: string | null;
  is_active: boolean;
  synced_at: string;
}

export interface KommoTask {
  id: string;
  kommo_id: number;
  lead_kommo_id: number | null;
  responsible_user_kommo_id: number | null;
  task_type: string | null;
  text: string | null;
  is_completed: boolean;
  result_text: string | null;
  complete_till: string | null;
  completed_at: string | null;
  created_at_kommo: string | null;
  synced_at: string;
}

export interface KommoContact {
  id: string;
  kommo_id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  synced_at: string;
}

export interface KommoLossReason {
  id: string;
  kommo_id: number | null;
  name: string;
  sort: number;
}

export interface KommoSyncConfig {
  id: string;
  subdomain: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_error: string | null;
  sync_frequency_minutes: number;
  auto_sync_enabled?: boolean;
  auto_sync_interval_minutes?: number;
}

export interface KommoSyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_synced: Record<string, number>;
  error_message: string | null;
  duration_ms: number | null;
}

// Fetch functions
export async function fetchPipelines(): Promise<KommoPipeline[]> {
  const { data, error } = await supabase
    .from('kommo_pipelines')
    .select('*')
    .order('sort');
  if (error) throw error;
  return (data || []) as unknown as KommoPipeline[];
}

export async function fetchPipelineStages(pipelineKommoId?: number): Promise<KommoPipelineStage[]> {
  let query = supabase.from('kommo_pipeline_stages').select('*').order('sort');
  if (pipelineKommoId) {
    query = query.eq('pipeline_kommo_id', pipelineKommoId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as KommoPipelineStage[];
}

export async function fetchLeads(): Promise<KommoLead[]> {
  const { data, error } = await supabase
    .from('kommo_leads')
    .select('*')
    .order('created_at_kommo', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as KommoLead[];
}

export async function fetchUsers(): Promise<KommoUser[]> {
  const { data, error } = await supabase
    .from('kommo_users')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data || []) as unknown as KommoUser[];
}

export async function fetchTasks(): Promise<KommoTask[]> {
  const { data, error } = await supabase
    .from('kommo_tasks')
    .select('*')
    .order('created_at_kommo', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as KommoTask[];
}

export async function fetchContacts(): Promise<KommoContact[]> {
  const { data, error } = await supabase
    .from('kommo_contacts')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data || []) as unknown as KommoContact[];
}

export async function fetchLossReasons(): Promise<KommoLossReason[]> {
  const { data, error } = await supabase
    .from('kommo_loss_reasons')
    .select('*')
    .order('sort');
  if (error) throw error;
  return (data || []) as unknown as KommoLossReason[];
}

export async function fetchSyncConfig(): Promise<KommoSyncConfig | null> {
  const { data, error } = await supabase
    .from('kommo_sync_config')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as KommoSyncConfig | null;
}

export async function fetchSyncLogs(limit = 20): Promise<KommoSyncLog[]> {
  const { data, error } = await supabase
    .from('kommo_sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as KommoSyncLog[];
}

// Trigger sync via Edge Function (split into phases to avoid timeout)
export async function triggerSync(syncType: 'full' | 'incremental' = 'full', entities?: string[]) {
  if (syncType === 'full' && (!entities || entities.length === 0)) {
    // Phase 1: pipelines + users (fast)
    const { error: err1 } = await supabase.functions.invoke('kommo-sync', {
      body: { syncType: 'incremental', entities: ['pipelines', 'users'] },
    });
    if (err1) throw err1;

    // Phase 2: leads + contacts + tasks + custom_fields + loss_reasons
    const { data, error: err2 } = await supabase.functions.invoke('kommo-sync', {
      body: { syncType: 'incremental', entities: ['leads', 'contacts', 'tasks', 'custom_fields', 'loss_reasons'] },
    });
    if (err2) throw err2;
    return data;
  }

  const { data, error } = await supabase.functions.invoke('kommo-sync', {
    body: { syncType, entities },
  });
  if (error) throw error;
  return data;
}
