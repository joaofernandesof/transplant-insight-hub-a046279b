import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  source: string | null;
  interest_level: 'cold' | 'warm' | 'hot';
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  available_at: string | null;
  converted_value: number | null;
  procedures_sold: string[] | null;
  converted_at: string | null;
}

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  source?: string;
  interest_level?: 'cold' | 'warm' | 'hot';
}

export interface UpdateLeadData {
  name?: string;
  phone?: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  interest_level?: 'cold' | 'warm' | 'hot';
  status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  notes?: string | null;
  converted_value?: number | null;
  procedures_sold?: string[] | null;
  converted_at?: string | null;
}

export function useLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeads = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const createLead = useCallback(async (data: CreateLeadData): Promise<Lead | null> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar leads');
      return null;
    }

    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          city: data.city || null,
          state: data.state || null,
          source: data.source || 'manual',
          interest_level: data.interest_level || 'warm',
          status: 'new',
          available_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => [newLead as Lead, ...prev]);
      toast.success('Lead criado com sucesso!');
      return newLead as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
      return null;
    }
  }, [isAdmin]);

  const updateLead = useCallback(async (id: string, data: UpdateLeadData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === id ? { ...l, ...data } as Lead : l
      ));
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
      return false;
    }
  }, []);

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir leads');
      return false;
    }

    try {
      // Use cascade delete function to remove lead and all related data
      const { data, error } = await supabase.rpc('delete_lead_cascade', {
        p_lead_id: id
      });

      if (error) throw error;
      
      // Cast data to expected type
      const result = data as { success: boolean; error?: string; lead_name?: string; deleted?: { messages: number; conversations: number; contacts: number; journeys: number } } | null;
      
      if (!result?.success) {
        toast.error(result?.error || 'Erro ao excluir lead');
        return false;
      }
      
      setLeads(prev => prev.filter(l => l.id !== id));
      
      const deleted = result.deleted;
      toast.success(
        `Lead "${result.lead_name}" excluído! ` +
        `(${deleted?.messages || 0} msgs, ${deleted?.conversations || 0} conversas, ${deleted?.journeys || 0} jornadas)`
      );
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
      return false;
    }
  }, [isAdmin]);

  const claimLead = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
          status: 'contacted'
        })
        .eq('id', id)
        .is('claimed_by', null);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === id ? { 
          ...l, 
          claimed_by: user.id, 
          claimed_at: new Date().toISOString(),
          status: 'contacted' as const
        } : l
      ));
      toast.success('Lead capturado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error claiming lead:', error);
      toast.error('Erro ao capturar lead. Talvez já foi pego por outro licenciado.');
      fetchLeads(true);
      return false;
    }
  }, [user, fetchLeads]);

  const releaseLead = useCallback(async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem liberar leads');
      return false;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          claimed_by: null,
          claimed_at: null,
          status: 'new',
          available_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === id ? { 
          ...l, 
          claimed_by: null, 
          claimed_at: null,
          status: 'new' as const,
          available_at: new Date().toISOString()
        } : l
      ));
      toast.success('Lead liberado!');
      return true;
    } catch (error) {
      console.error('Error releasing lead:', error);
      toast.error('Erro ao liberar lead');
      return false;
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    isLoading,
    isRefreshing,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    claimLead,
    releaseLead
  };
}
