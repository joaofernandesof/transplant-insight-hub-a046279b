/**
 * Hook para obter os nichos permitidos da conta Avivar do usuário logado.
 * Usa a coluna `allowed_nichos` de `avivar_accounts` para controle por conta.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from './useAvivarAccount';
import type { NichoType } from '@/pages/avivar/config/types';

export function useAccountNichos() {
  const { accountId, isSuperAdmin, isLoading: isAccountLoading } = useAvivarAccount();

  const { data: allowedNichos, isLoading: isNichosLoading } = useQuery({
    queryKey: ['account-nichos', accountId],
    queryFn: async () => {
      if (!accountId) return null;

      const { data, error } = await supabase
        .from('avivar_accounts')
        .select('allowed_nichos')
        .eq('id', accountId)
        .single();

      if (error || !data) return ['saude'] as NichoType[];
      return ((data as any).allowed_nichos || ['saude']) as NichoType[];
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });

  const isNichoBlocked = (nichoId: NichoType): boolean => {
    // Super admin tem acesso a tudo
    if (isSuperAdmin) return false;
    // Se ainda carregando, não bloqueia nada pra evitar flash
    if (!allowedNichos) return false;
    return !allowedNichos.includes(nichoId);
  };

  return {
    allowedNichos: allowedNichos || [],
    isNichoBlocked,
    isLoading: isAccountLoading || isNichosLoading,
  };
}
