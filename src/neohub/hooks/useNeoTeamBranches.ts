import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewBranch {
  code: string;
  name: string;
  address?: string;
  phone?: string;
}

export function useNeoTeamBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('neoteam_branches')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches((data as Branch[]) || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as filiais',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createBranch = async (branch: NewBranch) => {
    try {
      const { data, error } = await supabase
        .from('neoteam_branches')
        .insert([branch])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Filial criada com sucesso',
      });

      await fetchBranches();
      return data as Branch;
    } catch (error: any) {
      console.error('Error creating branch:', error);
      toast({
        title: 'Erro',
        description: error.message?.includes('duplicate') 
          ? 'Código de filial já existe' 
          : 'Não foi possível criar a filial',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      const { error } = await supabase
        .from('neoteam_branches')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Filial atualizada',
      });

      await fetchBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a filial',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('neoteam_branches')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Filial removida',
      });

      await fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a filial',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    branches,
    isLoading,
    createBranch,
    updateBranch,
    deleteBranch,
    refetch: fetchBranches,
  };
}
