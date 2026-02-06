/**
 * Hook para obter o account_id e role do usuário logado no Avivar (multi-tenant)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface AvivarAccountInfo {
  accountId: string | null;
  role: string | null;
  accountName: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function useAvivarAccount(): AvivarAccountInfo & { isLoading: boolean } {
  const { user, session } = useUnifiedAuth();
  const authUserId = session?.user?.id;
  
  // Check super admin (hardcoded UUID)
  const isSuperAdmin = authUserId === '00294ac4-0194-47bc-95ef-6efb83c316f7';

  const { data, isLoading } = useQuery({
    queryKey: ['avivar-account', authUserId],
    queryFn: async () => {
      if (!authUserId) return null;

      const { data: member, error } = await supabase
        .from('avivar_account_members')
        .select('account_id, role, avivar_accounts(name)')
        .eq('user_id', authUserId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !member) return null;

      return {
        accountId: member.account_id,
        role: member.role,
        accountName: (member as any).avivar_accounts?.name || null,
      };
    },
    enabled: !!authUserId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  return {
    accountId: data?.accountId || null,
    role: data?.role || null,
    accountName: data?.accountName || null,
    isOwner: data?.role === 'owner',
    isAdmin: data?.role === 'admin' || data?.role === 'owner',
    isSuperAdmin,
    isLoading,
  };
}
