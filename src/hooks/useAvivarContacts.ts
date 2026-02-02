/**
 * useAvivarContacts - Hook para gerenciar contatos do CRM Avivar
 * Cada contato tem um phone único por usuário e pode ter múltiplos leads
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AvivarContact {
  id: string;
  user_id: string;
  phone: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  company_name: string | null;
  notes: string | null;
  tags: string[] | null;
  source: string;
  first_contact_at: string;
  last_contact_at: string;
  created_at: string;
  updated_at: string;
  lead_count?: number;
}

export interface CreateContactData {
  phone: string;
  name?: string;
  email?: string;
  company_name?: string;
  notes?: string;
  tags?: string[];
  source?: string;
}

export interface UpdateContactData {
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  company_name?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

export function useAvivarContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<AvivarContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContacts = useCallback(async (showRefresh = false) => {
    if (!user?.id) return;
    
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Fetch contacts with lead count
      const { data: contactsData, error: contactsError } = await supabase
        .from('avivar_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_contact_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Get lead counts for each contact
      const { data: leadCounts, error: countError } = await supabase
        .from('avivar_kanban_leads')
        .select('contact_id')
        .eq('user_id', user.id)
        .not('contact_id', 'is', null);

      if (countError) throw countError;

      // Count leads per contact
      const countsMap = (leadCounts || []).reduce((acc, lead) => {
        if (lead.contact_id) {
          acc[lead.contact_id] = (acc[lead.contact_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Merge counts with contacts
      const contactsWithCounts = (contactsData || []).map(contact => ({
        ...contact,
        lead_count: countsMap[contact.id] || 0
      }));

      setContacts(contactsWithCounts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  const createContact = useCallback(async (data: CreateContactData): Promise<AvivarContact | null> => {
    if (!user?.id) return null;

    try {
      const { data: newContact, error } = await supabase
        .from('avivar_contacts')
        .insert({
          user_id: user.id,
          phone: data.phone,
          name: data.name || null,
          email: data.email || null,
          company_name: data.company_name || null,
          notes: data.notes || null,
          tags: data.tags || null,
          source: data.source || 'manual'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este telefone já está cadastrado');
          return null;
        }
        throw error;
      }

      setContacts(prev => [{ ...newContact, lead_count: 0 }, ...prev]);
      toast.success('Contato criado com sucesso!');
      return { ...newContact, lead_count: 0 };
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Erro ao criar contato');
      return null;
    }
  }, [user?.id]);

  const updateContact = useCallback(async (id: string, data: UpdateContactData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('avivar_contacts')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.map(c => 
        c.id === id ? { ...c, ...data } : c
      ));
      toast.success('Contato atualizado!');
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Erro ao atualizar contato');
      return false;
    }
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('avivar_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contato excluído!');
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao excluir contato');
      return false;
    }
  }, []);

  // Fetch on mount and user change
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    isRefreshing,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact
  };
}
