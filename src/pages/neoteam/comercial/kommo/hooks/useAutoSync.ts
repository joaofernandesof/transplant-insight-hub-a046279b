// Auto-sync: dispara sincronização automática quando há config mas tabelas vazias
import { useEffect, useRef } from 'react';
import { useKommoSyncConfig, useKommoPipelines, useKommoSync } from './useKommoData';

export function useAutoSync() {
  const { data: config, isLoading: loadingConfig } = useKommoSyncConfig();
  const { data: pipelines = [], isLoading: loadingPipelines } = useKommoPipelines();
  const syncMutation = useKommoSync();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Só dispara uma vez, quando:
    // 1. Config existe (chaves configuradas)
    // 2. Tabelas de cache estão vazias
    // 3. Não está já sincronizando
    if (
      !loadingConfig &&
      !loadingPipelines &&
      config &&
      pipelines.length === 0 &&
      !syncMutation.isPending &&
      !hasTriggered.current
    ) {
      hasTriggered.current = true;
      syncMutation.mutate({ syncType: 'full' });
    }
  }, [loadingConfig, loadingPipelines, config, pipelines.length, syncMutation.isPending]);

  return {
    isSyncing: syncMutation.isPending,
    hasConfig: !!config,
    hasData: pipelines.length > 0,
  };
}
