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
  webhook_slug: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  target_kanban_id: string | null;
  target_column_id: string | null;
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
    mutationFn: async ({ name, permissions, target_kanban_id, target_column_id }: { name: string; permissions: string[]; target_kanban_id?: string; target_column_id?: string }) => {
      if (!accountId || !session?.user) throw new Error('Not authenticated');
      
      const rawToken = generateToken();
      const tokenHash = await hashToken(rawToken);
      const tokenPrefix = rawToken.slice(0, 8);
      const webhookSlug = generateSlug();

      const { error } = await supabase
        .from('avivar_api_tokens')
        .insert({
          account_id: accountId,
          name,
          token_prefix: tokenPrefix,
          token_hash: tokenHash,
          webhook_slug: webhookSlug,
          permissions,
          created_by: session.user.id,
          target_kanban_id: target_kanban_id || null,
          target_column_id: target_column_id || null,
        } as any);

      if (error) throw error;
      return { rawToken, webhookSlug };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-api-tokens'] });
      toast.success('Webhook criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar webhook'),
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
