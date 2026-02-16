/**
 * Hook for managing AI call analyses (SPIN Selling)
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpinItem {
  quote: string;
  insight: string;
  quality: 'excellent' | 'good' | 'weak';
}

export interface Objection {
  text: string;
  category: 'price' | 'timing' | 'trust' | 'need' | 'competition' | 'other';
  severity: 'low' | 'medium' | 'high';
  suggested_response: string;
}

export interface CallAnalysis {
  id: string;
  call_id: string;
  account_id: string;
  spin_situation: SpinItem[];
  spin_problem: SpinItem[];
  spin_implication: SpinItem[];
  spin_need: SpinItem[];
  spin_score: number;
  spin_missing: string[];
  spin_suggested_questions: string[];
  objections: Objection[];
  dominant_pain: string | null;
  emotional_trigger: string | null;
  urgency_level: string;
  close_probability: number;
  temperature: 'cold' | 'warm' | 'hot';
  interest_area: string | null;
  discussed_value: string | null;
  barriers: string[];
  keywords: string[];
  followup_script: string | null;
  followup_whatsapp_message: string | null;
  followup_timing: string | null;
  followup_arguments: string[];
  next_action: string | null;
  executive_summary: string | null;
  suggested_stage: string | null;
  ai_model: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

export function useCallAnalysis(accountId?: string) {
  const [analyses, setAnalyses] = useState<CallAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchAnalyses = useCallback(async () => {
    if (!accountId) return;
    try {
      const { data, error } = await supabase
        .from('avivar_call_analyses')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnalyses((data || []) as unknown as CallAnalysis[]);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Realtime subscription
  useEffect(() => {
    if (!accountId) return;

    const channel = supabase
      .channel('call-analyses-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'avivar_call_analyses',
        filter: `account_id=eq.${accountId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAnalyses(prev => [payload.new as unknown as CallAnalysis, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAnalyses(prev => prev.map(a => 
            a.id === (payload.new as any).id ? payload.new as unknown as CallAnalysis : a
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [accountId]);

  const analyzeCall = useCallback(async (callId: string) => {
    if (!accountId) return null;

    setIsAnalyzing(true);
    toast.loading('Analisando ligação com IA...', { id: 'analyze-call' });

    try {
      const { data, error } = await supabase.functions.invoke('avivar-analyze-call', {
        body: { call_id: callId, account_id: accountId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Análise concluída! 🎯', { id: 'analyze-call' });
      await fetchAnalyses();
      return data.analysis;
    } catch (err: any) {
      const msg = err.message || 'Erro ao analisar ligação';
      toast.error(msg, { id: 'analyze-call' });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [accountId, fetchAnalyses]);

  const getAnalysisForCall = useCallback((callId: string) => {
    return analyses.find(a => a.call_id === callId) || null;
  }, [analyses]);

  return {
    analyses,
    isLoading,
    isAnalyzing,
    analyzeCall,
    getAnalysisForCall,
    refreshAnalyses: fetchAnalyses,
  };
}
