/**
 * Hook for managing voice calls via Vapi.ai
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VoiceCall {
  id: string;
  account_id: string;
  lead_id: string | null;
  phone_number: string;
  lead_name: string | null;
  status: string;
  direction: string;
  trigger_type: string;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  transcript: string | null;
  summary: string | null;
  sentiment: string | null;
  qualification_score: number | null;
  qualification_result: string | null;
  qualification_answers: any;
  meeting_scheduled: boolean;
  cost_cents: number | null;
  error_message: string | null;
  created_at: string;
  vapi_call_id: string | null;
}

export interface VoiceAgentConfig {
  id: string;
  account_id: string;
  name: string;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  voice_provider: string;
  voice_id: string;
  language: string;
  greeting_template: string;
  company_name: string | null;
  agent_name: string | null;
  qualification_questions: Array<{ id: string; question: string; type: string }>;
  auto_trigger_enabled: boolean;
  auto_trigger_column_ids: string[] | null;
  max_daily_calls: number;
  calls_today: number;
  business_hours_start: string;
  business_hours_end: string;
  is_active: boolean;
}

export function useVoiceCalls(accountId?: string) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [config, setConfig] = useState<VoiceAgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallInProgress, setIsCallInProgress] = useState(false);

  // Fetch calls
  const fetchCalls = useCallback(async () => {
    if (!accountId) return;
    try {
      const { data, error } = await supabase
        .from('avivar_voice_calls')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCalls((data || []) as unknown as VoiceCall[]);
    } catch (err) {
      console.error('Error fetching voice calls:', err);
    }
  }, [accountId]);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    if (!accountId) return;
    try {
      const { data, error } = await supabase
        .from('avivar_voice_agent_config')
        .select('*')
        .eq('account_id', accountId)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as unknown as VoiceAgentConfig | null);
    } catch (err) {
      console.error('Error fetching voice config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchCalls();
    fetchConfig();
  }, [fetchCalls, fetchConfig]);

  // Realtime subscription for call updates
  useEffect(() => {
    if (!accountId) return;

    const channel = supabase
      .channel('voice-calls-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'avivar_voice_calls',
        filter: `account_id=eq.${accountId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCalls(prev => [payload.new as unknown as VoiceCall, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setCalls(prev => prev.map(c => 
            c.id === (payload.new as any).id ? payload.new as unknown as VoiceCall : c
          ));
          // Check if call ended
          const newStatus = (payload.new as any).status;
          if (['completed', 'failed', 'no_answer', 'busy'].includes(newStatus)) {
            setIsCallInProgress(false);
            if (newStatus === 'completed') {
              const score = (payload.new as any).qualification_score;
              const result = (payload.new as any).qualification_result;
              toast.success(`Ligação concluída! Score: ${score || 'N/A'} - ${
                result === 'qualified' ? '✅ Qualificado' :
                result === 'needs_followup' ? '📋 Follow-up necessário' :
                '❌ Não qualificado'
              }`);
            } else {
              toast.error(`Ligação: ${newStatus === 'no_answer' ? 'Não atendeu' : newStatus === 'busy' ? 'Ocupado' : 'Falha'}`);
            }
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [accountId]);

  // Create a call
  const createCall = useCallback(async (params: {
    phone_number: string;
    lead_name?: string;
    lead_id?: string;
    trigger_type?: string;
  }) => {
    if (!accountId || !user) {
      toast.error('Conta não configurada');
      return null;
    }

    if (!config?.vapi_phone_number_id) {
      toast.error('Configure o número de telefone Vapi nas configurações');
      return null;
    }

    setIsCallInProgress(true);
    toast.loading('Iniciando ligação...', { id: 'voice-call' });

    try {
      const { data, error } = await supabase.functions.invoke('avivar-vapi-create-call', {
        body: {
          ...params,
          account_id: accountId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Ligação iniciada! Aguardando atendimento...', { id: 'voice-call' });
      return data;
    } catch (err: any) {
      setIsCallInProgress(false);
      toast.error(err.message || 'Erro ao criar ligação', { id: 'voice-call' });
      return null;
    }
  }, [accountId, user, config]);

  // Save config
  const saveConfig = useCallback(async (updates: Partial<VoiceAgentConfig>) => {
    if (!accountId || !user) return false;

    try {
      if (config) {
        const { error } = await supabase
          .from('avivar_voice_agent_config')
          .update(updates as any)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avivar_voice_agent_config')
          .insert({ ...updates, account_id: accountId, user_id: user.id } as any);
        if (error) throw error;
      }
      await fetchConfig();
      toast.success('Configurações salvas!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'erro desconhecido'));
      return false;
    }
  }, [accountId, user, config, fetchConfig]);

  // Bulk call
  const createBulkCalls = useCallback(async (leads: Array<{ phone: string; name: string; id: string }>) => {
    if (!leads.length) return;
    
    toast.loading(`Iniciando ${leads.length} ligações...`);
    let success = 0;
    let failed = 0;

    for (const lead of leads) {
      const result = await createCall({
        phone_number: lead.phone,
        lead_name: lead.name,
        lead_id: lead.id,
        trigger_type: 'bulk',
      });
      if (result) success++;
      else failed++;
      
      // Wait 2s between calls to avoid rate limiting
      if (leads.indexOf(lead) < leads.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    toast.success(`${success} ligações iniciadas, ${failed} falharam`);
  }, [createCall]);

  return {
    calls,
    config,
    isLoading,
    isCallInProgress,
    createCall,
    createBulkCalls,
    saveConfig,
    refreshCalls: fetchCalls,
    refreshConfig: fetchConfig,
  };
}
