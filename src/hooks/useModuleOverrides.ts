// ============================================
// useModuleOverrides - Gerenciamento de Overrides
// ============================================
// Hook para administradores gerenciarem liberações manuais de módulos.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ModuleOverride {
  id: string;
  user_id: string;
  module_code: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  reason: string | null;
  // Joined data
  user_name?: string;
  user_email?: string;
  module_name?: string;
}

export interface CreateOverrideData {
  user_id: string;
  module_code: string;
  can_read?: boolean;
  can_write?: boolean;
  can_delete?: boolean;
  expires_at?: string | null;
  reason?: string;
}

export function useModuleOverrides() {
  const [overrides, setOverrides] = useState<ModuleOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Buscar todos os overrides com dados do usuário
  const fetchOverrides = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('neohub_user_module_overrides')
        .select(`
          *,
          neohub_users!user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((o: any) => ({
        ...o,
        user_name: o.neohub_users?.full_name,
        user_email: o.neohub_users?.email,
      }));

      setOverrides(mapped);
    } catch (error) {
      console.error('Error fetching overrides:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os overrides',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Criar ou atualizar override
  const upsertOverride = useCallback(async (data: CreateOverrideData) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('neohub_user_module_overrides')
        .upsert({
          user_id: data.user_id,
          module_code: data.module_code,
          can_read: data.can_read ?? true,
          can_write: data.can_write ?? false,
          can_delete: data.can_delete ?? false,
          expires_at: data.expires_at || null,
          reason: data.reason || null,
          granted_by: authUser?.user?.id || null,
          granted_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,module_code',
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Permissão atualizada com sucesso',
      });

      await fetchOverrides();
      return { success: true };
    } catch (error: any) {
      console.error('Error upserting override:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }, [fetchOverrides, toast]);

  // Revogar override
  const revokeOverride = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('neohub_user_module_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Permissão revogada com sucesso',
      });

      await fetchOverrides();
      return { success: true };
    } catch (error: any) {
      console.error('Error revoking override:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível revogar',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }, [fetchOverrides, toast]);

  // Buscar overrides de um usuário específico
  const getOverridesForUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('neohub_user_module_overrides')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user overrides:', error);
      return [];
    }
  }, []);

  // Carregar ao montar
  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  return {
    overrides,
    isLoading,
    upsertOverride,
    revokeOverride,
    getOverridesForUser,
    refetch: fetchOverrides,
  };
}

export default useModuleOverrides;
