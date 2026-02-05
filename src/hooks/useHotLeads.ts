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
}

export function useHotLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<HotLead[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeads = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      // Filter only leads imported from spreadsheet (source = 'planilha')
      // This excludes leads from Avivar CRM and other sources
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, city, state, source, status, claimed_by, claimed_at, created_at')
        .eq('source', 'planilha')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as HotLead[]);
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
    fetchLeads();
    fetchProfiles();
  }, [fetchLeads, fetchProfiles]);

  const availableLeads = useMemo(() =>
    leads.filter(l => !l.claimed_by), [leads]);

  const acquiredLeads = useMemo(() =>
    leads.filter(l => !!l.claimed_by), [leads]);

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
    leadsData: { name: string; phone: string; email: string; state: string; city: string }[]
  ): Promise<{ success: number; errors: number }> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem importar leads');
      return { success: 0, errors: leadsData.length };
    }

    let success = 0;
    let errors = 0;

    // Batch insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < leadsData.length; i += chunkSize) {
      const chunk = leadsData.slice(i, i + chunkSize);
      const rows = chunk.map(l => ({
        name: l.name,
        phone: l.phone,
        email: l.email || null,
        state: l.state || null,
        city: l.city || null,
        source: 'planilha',
        status: 'new',
        interest_level: 'warm',
        available_at: new Date().toISOString(),
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
    acquiredLeads,
    isLoading,
    isRefreshing,
    isAdmin,
    fetchLeads,
    acquireLead,
    importLeads,
    getClaimerName,
  };
}
