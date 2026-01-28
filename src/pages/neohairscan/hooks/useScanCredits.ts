import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface ConsumeResult {
  success: boolean;
  error?: string;
  message?: string;
  credits_remaining?: number;
  plan?: string;
}

export function useScanCredits(userId?: string) {
  const [consuming, setConsuming] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAdmin } = useUnifiedAuth();

  const consumeCredit = useCallback(async (action: string): Promise<boolean> => {
    if (!userId) {
      toast.error("Você precisa estar logado para usar o scanner");
      return false;
    }

    // Admins have unlimited access - no credit consumption
    if (isAdmin) {
      return true;
    }

    setConsuming(true);
    
    try {
      const { data, error } = await supabase.rpc('consume_scan_credit', {
        _user_id: userId,
        _action: action
      });

      if (error) throw error;

      const result = data as unknown as ConsumeResult;
      
      if (!result?.success) {
        toast.error(result?.message || "Créditos insuficientes", {
          description: "Faça upgrade do seu plano para continuar usando.",
          action: {
            label: "Ver Planos",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('open-scan-plans'));
            }
          }
        });
        return false;
      }

      // Trigger refresh of credits display
      setRefreshTrigger(prev => prev + 1);
      
      return true;
    } catch (err) {
      console.error("Error consuming credit:", err);
      toast.error("Erro ao verificar créditos");
      return false;
    } finally {
      setConsuming(false);
    }
  }, [userId, isAdmin]);

  const refreshCredits = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    consumeCredit,
    consuming,
    refreshTrigger,
    refreshCredits,
    isUnlimited: isAdmin
  };
}
