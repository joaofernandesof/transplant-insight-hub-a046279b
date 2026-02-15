import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type LeadOutcome = 'vendido' | 'descartado' | 'em_atendimento';

export interface HotLead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  source: string | null;
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
  tags: string[] | null;
  release_status: string | null;
  available_at: string | null;
  lead_outcome: LeadOutcome | null;
  outcome_at: string | null;
}

export function useHotLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<HotLead[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [hotleadsProfiles, setHotleadsProfiles] = useState<Record<string, string>>({});
  const [queuedCount, setQueuedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeads = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      // Filter leads from HotLeads sources (planilha + n8n)
      // This excludes leads from Avivar CRM and other sources
      // Fetch available/claimed leads (not queued) - these are the ones shown in the UI
      const { data: activeData, error: activeError } = await supabase
        .from('leads')
        .select('id, name, email, phone, city, state, source, status, claimed_by, claimed_at, created_at, release_status, tags, available_at, lead_outcome, outcome_at')
        .in('source', ['planilha', 'n8n'])
        .neq('release_status', 'queued')
        .order('created_at', { ascending: false })
        .limit(5000);

      // Fetch count of queued leads for the banner (no need to load all 13k+ rows)
      const { count: queuedCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('source', ['planilha', 'n8n'])
        .eq('release_status', 'queued');

      if (activeError) throw activeError;
      const data = activeData || [];
      // Store queued count for banner use
      setQueuedCount(queuedCount || 0);

      if (activeError) throw activeError;
      setLeads((data) as HotLead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name');
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.user_id] = p.name; });
      setProfiles(map);

      // Fetch only users with hotleads portal access for the filter dropdown
      const { data: hotleadsData, error: hotleadsError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .contains('allowed_portals', ['hotleads']);
      if (hotleadsError) throw hotleadsError;
      const hotleadsMap: Record<string, string> = {};
      (hotleadsData as any[])?.forEach((p: any) => {
        hotleadsMap[p.user_id] = p.name;
      });
      setHotleadsProfiles(hotleadsMap);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchLeads();
    fetchProfiles();
  }, [fetchLeads, fetchProfiles, user]);

  const availableLeads = useMemo(() =>
    leads.filter(l => !l.claimed_by && l.release_status !== 'queued'), [leads]);

  const myLeads = useMemo(() =>
    leads.filter(l => l.claimed_by === user?.id), [leads, user?.id]);

  const acquiredLeads = useMemo(() =>
    leads.filter(l => !!l.claimed_by && l.claimed_by !== user?.id), [leads, user?.id]);

  const acquireLead = useCallback(async (leadId: string, userEmail: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-acquire', {
        body: { lead_id: leadId, user_email: userEmail },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        fetchLeads(true);
        return false;
      }

      toast.success(data?.message || 'Lead adquirido com sucesso!');
      // Update local state
      setLeads(prev => prev.map(l =>
        l.id === leadId
          ? { ...l, claimed_by: user?.id || '', claimed_at: new Date().toISOString(), status: 'contacted' }
          : l
      ));
      return true;
    } catch (error) {
      console.error('Error acquiring lead:', error);
      toast.error('Erro ao adquirir lead. Tente novamente.');
      fetchLeads(true);
      return false;
    }
  }, [user?.id, fetchLeads]);

  const releaseLead = useCallback(async (leadId: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem devolver leads');
      return false;
    }
    try {
      const { error } = await supabase
        .from('leads')
        .update({ claimed_by: null, claimed_at: null, status: 'new' })
        .eq('id', leadId);

      if (error) throw error;
      toast.success('Lead devolvido para disponíveis!');
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, claimed_by: null, claimed_at: null, status: 'new' } : l
      ));
      return true;
    } catch (error) {
      console.error('Error releasing lead:', error);
      toast.error('Erro ao devolver lead.');
      return false;
    }
  }, [isAdmin]);

  const importLeads = useCallback(async (
    leadsData: { name: string; phone: string; email: string; state: string; city: string; tags?: string[] }[],
    onProgress?: (progress: { current: number; total: number; success: number; errors: number }) => void,
    duplicateAction?: 'skip' | 'overwrite',
    duplicates?: { parsed: { name: string; phone: string; email: string; state: string; city: string }; existing: { id: string } }[],
  ): Promise<{ success: number; errors: number; duplicatesSkipped: number; duplicatesOverwritten: number }> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem importar leads');
      return { success: 0, errors: leadsData.length, duplicatesSkipped: 0, duplicatesOverwritten: 0 };
    }

    let success = 0;
    let errors = 0;
    let duplicatesSkipped = 0;
    let duplicatesOverwritten = 0;

    const totalWork = leadsData.length + (duplicateAction === 'overwrite' && duplicates ? duplicates.length : 0);

    // 1. Insert new leads in chunks
    const chunkSize = 500;
    const maxRetries = 3;

    for (let i = 0; i < leadsData.length; i += chunkSize) {
      const chunk = leadsData.slice(i, i + chunkSize);
      const rows = chunk.map(l => ({
        name: l.name,
        phone: l.phone,
        email: l.email || null,
        state: l.state || null,
        city: l.city || null,
        tags: l.tags && l.tags.length > 0 ? l.tags : null,
        source: 'planilha',
        status: 'new',
        interest_level: 'warm',
        release_status: 'queued',
        available_at: null,
      }));

      let chunkSuccess = false;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const { data, error } = await supabase
          .from('leads')
          .insert(rows as any)
          .select('id');

        if (!error && data) {
          success += data.length;
          chunkSuccess = true;
          break;
        }

        console.error(`[Import] Chunk ${Math.floor(i / chunkSize) + 1} attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }

      if (!chunkSuccess) {
        errors += chunk.length;
      }

      onProgress?.({
        current: Math.min(i + chunkSize, leadsData.length),
        total: totalWork,
        success,
        errors,
      });

      await new Promise(r => setTimeout(r, 50));
    }

    // 2. Handle duplicates
    if (duplicates && duplicates.length > 0) {
      if (duplicateAction === 'overwrite') {
        // Update existing leads with new data
        for (let i = 0; i < duplicates.length; i += 50) {
          const batch = duplicates.slice(i, i + 50);
          for (const dup of batch) {
            const { error } = await supabase
              .from('leads')
              .update({
                name: dup.parsed.name,
                email: dup.parsed.email || null,
                state: dup.parsed.state || null,
                city: dup.parsed.city || null,
              } as any)
              .eq('id', dup.existing.id);

            if (!error) {
              duplicatesOverwritten++;
            } else {
              errors++;
            }
          }

          onProgress?.({
            current: leadsData.length + Math.min(i + 50, duplicates.length),
            total: totalWork,
            success: success + duplicatesOverwritten,
            errors,
          });

          await new Promise(r => setTimeout(r, 50));
        }
      } else {
        duplicatesSkipped = duplicates.length;
      }
    }

    if (success > 0) {
      try {
        await supabase.functions.invoke('hotleads-release', {
          body: { action: 'schedule_next' },
        });
      } catch (e) {
        console.error('Error scheduling first release:', e);
      }
    }

    await fetchLeads(true);
    return { success, errors, duplicatesSkipped, duplicatesOverwritten };
  }, [isAdmin, fetchLeads]);

  const getClaimerName = useCallback((userId: string | null): string => {
    if (!userId) return '';
    return profiles[userId] || 'Licenciado';
  }, [profiles]);

  // Leads that are overdue (claimed > 7 days ago, no outcome set, owned by current user)
  const OVERDUE_DAYS = 7;
  const overdueLeads = useMemo(() => {
    if (!user?.id) return [];
    const cutoff = Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000;
    return myLeads.filter(l => {
      if (l.lead_outcome) return false; // already has outcome
      const claimedTime = l.claimed_at ? new Date(l.claimed_at).getTime() : new Date(l.created_at).getTime();
      return claimedTime < cutoff;
    });
  }, [myLeads, user?.id]);

  const isBlocked = overdueLeads.length > 0;

  const updateLeadOutcome = useCallback(async (leadId: string, outcome: LeadOutcome): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_outcome: outcome, 
          outcome_at: new Date().toISOString(),
          status: outcome === 'vendido' ? 'converted' : outcome === 'descartado' ? 'lost' : 'contacted'
        } as any)
        .eq('id', leadId);

      if (error) throw error;

      const labels: Record<LeadOutcome, string> = {
        vendido: '✅ Lead marcado como Vendido!',
        descartado: '❌ Lead marcado como Descartado',
        em_atendimento: '🔄 Lead marcado como Em Atendimento',
      };
      toast.success(labels[outcome]);

      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, lead_outcome: outcome, outcome_at: new Date().toISOString() } : l
      ));
      return true;
    } catch (error) {
      console.error('Error updating lead outcome:', error);
      toast.error('Erro ao atualizar status do lead.');
      return false;
    }
  }, []);

  return {
    leads,
    availableLeads,
    myLeads,
    acquiredLeads,
    queuedCount,
    isLoading,
    isRefreshing,
    isAdmin,
    fetchLeads,
    acquireLead,
    releaseLead,
    importLeads,
    getClaimerName,
    updateLeadOutcome,
    overdueLeads,
    isBlocked,
    profiles,
    hotleadsProfiles,
  };
}
