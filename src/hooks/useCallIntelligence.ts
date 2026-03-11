/**
 * Hook for Call Intelligence module - manages sales calls and analyses
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SalesCall {
  id: string;
  account_id: string | null;
  closer_id: string;
  closer_name: string | null;
  lead_nome: string;
  produto: string | null;
  data_call: string;
  status_call: 'fechou' | 'followup' | 'perdido';
  transcricao: string | null;
  resumo_manual: string | null;
  fonte_call: 'whatsapp' | 'zoom' | 'meet' | 'telefone' | 'presencial';
  has_analysis: boolean;
  created_at: string;
}

export interface CallAnalysisRecord {
  id: string;
  call_id: string;
  account_id: string | null;
  resumo_call: string | null;
  perfil_lead: string | null;
  objecoes: string | null;
  pontos_fracos_closer: string | null;
  pontos_fortes_closer: string | null;
  bant_budget: number;
  bant_authority: number;
  bant_need: number;
  bant_timeline: number;
  bant_total: number;
  classificacao_lead: 'frio' | 'morno' | 'quente';
  urgencia: 'baixa' | 'media' | 'alta';
  dor_principal: string | null;
  motivo_nao_fechamento: string | null;
  estrategia_followup: string | null;
  acoes_realizadas: string | null;
  proximos_passos: string | null;
  conclusao: string | null;
  whatsapp_report: string | null;
  probabilidade_fechamento: number;
  ai_model: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

export function useCallIntelligence(accountId?: string) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<SalesCall[]>([]);
  const [analyses, setAnalyses] = useState<CallAnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchCalls = useCallback(async () => {
    if (!accountId) return;
    try {
      const { data, error } = await supabase
        .from('sales_calls')
        .select('*')
        .eq('account_id', accountId)
        .order('data_call', { ascending: false })
        .limit(200);
      if (error) throw error;
      setCalls((data || []) as unknown as SalesCall[]);
    } catch (err) {
      console.error('Error fetching calls:', err);
    }
  }, [accountId]);

  const fetchAnalyses = useCallback(async () => {
    if (!accountId) return;
    try {
      const { data, error } = await supabase
        .from('call_analysis')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setAnalyses((data || []) as unknown as CallAnalysisRecord[]);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchCalls();
    fetchAnalyses();
  }, [fetchCalls, fetchAnalyses]);

  // Realtime
  useEffect(() => {
    if (!accountId) return;
    const ch = supabase
      .channel('call-intelligence-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_calls', filter: `account_id=eq.${accountId}` }, () => fetchCalls())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_analysis', filter: `account_id=eq.${accountId}` }, () => fetchAnalyses())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [accountId, fetchCalls, fetchAnalyses]);

  const createCall = useCallback(async (params: {
    lead_nome: string;
    produto?: string;
    data_call: string;
    status_call: 'fechou' | 'followup' | 'perdido';
    transcricao?: string;
    resumo_manual?: string;
    fonte_call: string;
    closer_name?: string;
  }) => {
    if (!accountId || !user) { toast.error('Conta não configurada'); return null; }
    try {
      const { data, error } = await supabase.from('sales_calls').insert({
        account_id: accountId,
        closer_id: user.id,
        closer_name: params.closer_name || user.email?.split('@')[0] || 'Closer',
        lead_nome: params.lead_nome,
        produto: params.produto || null,
        data_call: params.data_call,
        status_call: params.status_call,
        transcricao: params.transcricao || null,
        resumo_manual: params.resumo_manual || null,
        fonte_call: params.fonte_call as any,
      } as any).select().single();
      if (error) throw error;
      toast.success('Call registrada!');
      return data as unknown as SalesCall;
    } catch (err: any) {
      toast.error('Erro ao registrar call: ' + (err.message || ''));
      return null;
    }
  }, [accountId, user]);

  const analyzeCall = useCallback(async (callId: string) => {
    const call = calls.find(c => c.id === callId);
    if (!call) { toast.error('Call não encontrada'); return null; }
    
    const content = call.transcricao || call.resumo_manual;
    if (!content || content.trim().length < 30) {
      toast.error('Transcrição/resumo muito curto para análise');
      return null;
    }

    setIsAnalyzing(true);
    toast.loading('Analisando call com IA...', { id: 'analyze-call' });

    try {
      const { data, error } = await supabase.functions.invoke('neoteam-analyze-call', {
        body: {
          transcript: content,
          closer_name: call.closer_name,
          lead_nome: call.lead_nome,
          produto: call.produto,
          data_call: call.data_call,
          status_call: call.status_call,
          call_id: callId,
          account_id: accountId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Análise concluída! 🎯', { id: 'analyze-call' });
      await fetchAnalyses();
      await fetchCalls();
      return data.analysis;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao analisar call', { id: 'analyze-call' });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [calls, accountId, fetchAnalyses, fetchCalls]);

  const getAnalysisForCall = useCallback((callId: string) => {
    return analyses.find(a => a.call_id === callId) || null;
  }, [analyses]);

  // Dashboard stats
  const stats = {
    totalCalls: calls.length,
    fechou: calls.filter(c => c.status_call === 'fechou').length,
    followup: calls.filter(c => c.status_call === 'followup').length,
    perdido: calls.filter(c => c.status_call === 'perdido').length,
    taxaFechamento: calls.length > 0
      ? Math.round((calls.filter(c => c.status_call === 'fechou').length / calls.length) * 100)
      : 0,
    analyzed: calls.filter(c => c.has_analysis).length,
    leadsQuentes: analyses.filter(a => a.classificacao_lead === 'quente').length,
    bantMedio: analyses.length > 0
      ? Math.round(analyses.reduce((acc, a) => acc + (a.bant_total || 0), 0) / analyses.length)
      : 0,
    probMediaFechamento: analyses.length > 0
      ? Math.round(analyses.reduce((acc, a) => acc + (a.probabilidade_fechamento || 0), 0) / analyses.length)
      : 0,
  };

  return {
    calls, analyses, isLoading, isAnalyzing, stats,
    createCall, analyzeCall, getAnalysisForCall,
    refreshCalls: fetchCalls, refreshAnalyses: fetchAnalyses,
  };
}
