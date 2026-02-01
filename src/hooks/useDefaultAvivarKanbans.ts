/**
 * Hook para criar kanbans padrão para novos usuários
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export function useDefaultAvivarKanbans() {
  const { session } = useUnifiedAuth();
  const authUserId = session?.user?.id; // auth.uid() for RLS
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeKanbans = async () => {
      if (!authUserId) {
        setIsInitializing(false);
        return;
      }

      try {
        // Verificar se usuário já tem kanbans
        const { data: existingKanbans, error: checkError } = await supabase
          .from('avivar_kanbans')
          .select('id')
          .limit(1);

        if (checkError) {
          console.error('Error checking kanbans:', checkError);
          setIsInitializing(false);
          return;
        }

        // Se já tem kanbans, não precisa criar
        if (existingKanbans && existingKanbans.length > 0) {
          setIsInitializing(false);
          return;
        }

        // Chamar função do banco para criar kanbans padrão
        const { error: rpcError } = await supabase.rpc('create_default_avivar_kanbans', {
          p_user_id: authUserId
        });

        if (rpcError) {
          console.error('Error creating default kanbans:', rpcError);
        }
      } catch (error) {
        console.error('Error initializing kanbans:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeKanbans();
  }, [authUserId]);

  return { isInitializing };
}
