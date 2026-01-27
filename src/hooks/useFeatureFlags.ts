// ============================================
// useFeatureFlags - Hook para Feature Flags
// ============================================
// Busca e verifica feature flags do backend
// Integrado com detecção de ambiente mobile

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMobileEnvironment, isNativePlatform } from './useMobileEnvironment';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  environment: string;
  target_profiles: string[];
  metadata: Record<string, any>;
}

export interface UseFeatureFlagsReturn {
  /** Lista de todas as flags */
  flags: FeatureFlag[];
  /** Verifica se uma flag está habilitada */
  isEnabled: (key: string) => boolean;
  /** Verifica se um módulo está habilitado no mobile */
  isModuleEnabledOnMobile: (moduleCode: string) => boolean;
  /** Se está carregando */
  isLoading: boolean;
  /** Erro se houver */
  error: Error | null;
  /** Recarregar flags */
  refetch: () => void;
}

/**
 * Hook para gerenciar feature flags
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { isNative, platform } = useMobileEnvironment();

  const { data: flags = [], isLoading, error, refetch } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key');

      if (error) throw error;
      return (data || []) as FeatureFlag[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  /**
   * Verifica se uma flag está habilitada
   */
  const isEnabled = useCallback((key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    if (!flag) return false;
    
    // Verificar ambiente
    if (flag.environment === 'mobile' && !isNative) {
      return true; // Em web, flags mobile não se aplicam (permitir)
    }
    
    if (flag.environment === 'web' && isNative) {
      return true; // Em mobile, flags web não se aplicam (permitir)
    }
    
    return flag.is_enabled;
  }, [flags, isNative]);

  /**
   * Verifica se um módulo está habilitado no mobile
   */
  const isModuleEnabledOnMobile = useCallback((moduleCode: string): boolean => {
    // Se não está em ambiente nativo, todos os módulos estão habilitados
    if (!isNative) return true;
    
    // Buscar flag específica do módulo
    const flagKey = `mobile_${moduleCode}_enabled`;
    const flag = flags.find(f => f.key === flagKey);
    
    // Se não existe flag, usar lista hardcoded de bloqueio
    if (!flag) {
      // Módulos explicitamente permitidos no mobile
      const allowedModules = ['academy', 'profile', 'notifications'];
      return allowedModules.some(m => moduleCode.startsWith(m));
    }
    
    return flag.is_enabled;
  }, [flags, isNative]);

  return {
    flags,
    isEnabled,
    isModuleEnabledOnMobile,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook simplificado para verificar uma única flag
 */
export function useFeatureFlag(key: string): { enabled: boolean; isLoading: boolean } {
  const { isEnabled, isLoading } = useFeatureFlags();
  
  return {
    enabled: isEnabled(key),
    isLoading,
  };
}

export default useFeatureFlags;
