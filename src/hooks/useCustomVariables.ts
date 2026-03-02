import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface CustomVariable {
  id: string;
  account_id: string;
  user_id: string;
  key: string;
  label: string;
  description: string | null;
  default_value: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomVariableInput {
  key: string;
  label: string;
  description?: string;
  default_value?: string;
}

export function useCustomVariables() {
  const { accountId } = useAvivarAccount();
  const { session } = useUnifiedAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const { data: customVariables = [], isLoading } = useQuery({
    queryKey: ['avivar-custom-variables', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('avivar_custom_variables')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CustomVariable[];
    },
    enabled: !!accountId,
  });

  const createVariable = useMutation({
    mutationFn: async (input: CreateCustomVariableInput) => {
      if (!accountId || !userId) throw new Error('Não autenticado');
      const formattedKey = input.key.startsWith('{{') ? input.key : `{{${input.key.replace(/[{}]/g, '')}}}`;
      const { data, error } = await supabase
        .from('avivar_custom_variables')
        .insert({
          account_id: accountId,
          user_id: userId,
          key: formattedKey,
          label: input.label,
          description: input.description || null,
          default_value: input.default_value || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-custom-variables'] });
      toast.success('Variável criada!');
    },
    onError: (err: any) => {
      if (err?.message?.includes('duplicate')) {
        toast.error('Já existe uma variável com essa chave');
      } else {
        toast.error('Erro ao criar variável');
      }
    },
  });

  const deleteVariable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avivar_custom_variables')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-custom-variables'] });
      toast.success('Variável removida!');
    },
    onError: () => {
      toast.error('Erro ao remover variável');
    },
  });

  return { customVariables, isLoading, createVariable, deleteVariable };
}
