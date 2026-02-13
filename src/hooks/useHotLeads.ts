import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
}

export function useHotLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<HotLead[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
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
        .select('id, name, email, phone, city, state, source, status, claimed_by, claimed_at, created_at, release_status, tags, available_at')
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

  const importLeads = useCallback(async (
    leadsData: { name: string; phone: string; email: string; state: string; city: string; tags?: string[] }[],
    onProgress?: (progress: { current: number; total: number; success: number; errors: number }) => void,
  ): Promise<{ success: number; errors: number }> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem importar leads');
      return { success: 0, errors: leadsData.length };
    }

    let success = 0;
    let errors = 0;

    const chunkSize = 50;
    const totalChunks = Math.ceil(leadsData.length / chunkSize);

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

      const { data, error } = await supabase
        .from('leads')
        .insert(rows as any)
        .select('id');

      if (error) {
        console.error('Error importing chunk:', error);
        errors += chunk.length;
      } else {
        success += data?.length || 0;
      }

      onProgress?.({
        current: Math.min(i + chunkSize, leadsData.length),
        total: leadsData.length,
        success,
        errors,
      });
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
    return { success, errors };
  }, [isAdmin, fetchLeads]);

  const getClaimerName = useCallback((userId: string | null): string => {
    if (!userId) return '';
    return profiles[userId] || 'Licenciado';
  }, [profiles]);

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
    importLeads,
    getClaimerName,
  };
}
