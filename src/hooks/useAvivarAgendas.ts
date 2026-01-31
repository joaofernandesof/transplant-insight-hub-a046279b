import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface AvivarAgenda {
  id: string;
  user_id: string;
  name: string;
  professional_name: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface NewAgenda {
  name: string;
  professional_name?: string;
  city?: string;
  address?: string;
  phone?: string;
  color?: string;
}

export function useAvivarAgendas() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: agendas = [], isLoading, error } = useQuery({
    queryKey: ['avivar-agendas', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];
      
      const { data, error } = await supabase
        .from('avivar_agendas')
        .select('*')
        .eq('user_id', user.authUserId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as AvivarAgenda[];
    },
    enabled: !!user?.authUserId,
  });

  const createAgenda = useMutation({
    mutationFn: async (agenda: NewAgenda) => {
      if (!user?.authUserId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('avivar_agendas')
        .insert({
          ...agenda,
          user_id: user.authUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AvivarAgenda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-agendas'] });
      toast.success('Agenda criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating agenda:', error);
      toast.error('Erro ao criar agenda');
    },
  });

  const updateAgenda = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AvivarAgenda> & { id: string }) => {
      const { data, error } = await supabase
        .from('avivar_agendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AvivarAgenda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-agendas'] });
      toast.success('Agenda atualizada!');
    },
    onError: (error) => {
      console.error('Error updating agenda:', error);
      toast.error('Erro ao atualizar agenda');
    },
  });

  const deleteAgenda = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('avivar_agendas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-agendas'] });
      toast.success('Agenda removida!');
    },
    onError: (error) => {
      console.error('Error deleting agenda:', error);
      toast.error('Erro ao remover agenda');
    },
  });

  return {
    agendas,
    isLoading,
    error,
    createAgenda,
    updateAgenda,
    deleteAgenda,
  };
}
