// Hook: polls kommo_sync_logs for real-time progress during sync
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SyncProgress {
  current_step: number;
  total_steps: number;
  current_entity: string;
  percent: number;
}

export interface SyncStatus {
  id: string;
  status: string;
  progress: SyncProgress | null;
  records_synced: Record<string, number>;
  error_message: string | null;
  started_at: string;
  duration_ms: number | null;
}

export function useSyncProgress(isSyncing: boolean) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const fetchLatest = useCallback(async () => {
    const { data } = await supabase
      .from('kommo_sync_logs')
      .select('id, status, progress, records_synced, error_message, started_at, duration_ms')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any;

    if (data) {
      setSyncStatus({
        id: data.id,
        status: data.status,
        progress: data.progress as SyncProgress | null,
        records_synced: (data.records_synced || {}) as Record<string, number>,
        error_message: data.error_message,
        started_at: data.started_at,
        duration_ms: data.duration_ms,
      });
    }
  }, []);

  useEffect(() => {
    if (!isSyncing) {
      // Fetch once on complete to get final state
      fetchLatest();
      return;
    }

    // Poll every 2s while syncing
    fetchLatest();
    const interval = setInterval(fetchLatest, 2000);
    return () => clearInterval(interval);
  }, [isSyncing, fetchLatest]);

  return syncStatus;
}
