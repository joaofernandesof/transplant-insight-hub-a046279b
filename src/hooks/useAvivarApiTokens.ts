import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface AvivarApiToken {
  id: string;
  account_id: string;
  name: string;
  token_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'avr_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAvivarApiTokens() {
  const { session } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['avivar-api-tokens', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('avivar_api_tokens')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AvivarApiToken[];
    },
    enabled: !!accountId,
  });

  const createToken = useMutation({
    mutationFn: async ({ name, permissions }: { name: string; permissions: string[] }) => {
      if (!accountId || !session?.user) throw new Error('Not authenticated');
      
      const rawToken = generateToken();
      const tokenHash = await hashToken(rawToken);
      const tokenPrefix = rawToken.slice(0, 8);

      const { error } = await supabase
        .from('avivar_api_tokens')
        .insert({
          account_id: accountId,
          name,
          token_prefix: tokenPrefix,
          token_hash: tokenHash,
          permissions,
          created_by: session.user.id,
        } as any);

      if (error) throw error;
      return rawToken; // Return raw token only once
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-api-tokens'] });
      toast.success('Token criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar token'),
  });

  const deleteToken = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('avivar_api_tokens')
        .delete()
        .eq('id', tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-api-tokens'] });
      toast.success('Token excluído');
    },
    onError: () => toast.error('Erro ao excluir token'),
  });

  const toggleToken = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('avivar_api_tokens')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-api-tokens'] });
    },
  });

  return { tokens, isLoading, createToken, deleteToken, toggleToken };
}
