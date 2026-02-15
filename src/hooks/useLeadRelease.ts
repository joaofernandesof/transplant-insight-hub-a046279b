import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeadReleaseInfo {
  daily_released: number;
  daily_target: number;
  next_release_at: string | null;
  last_release_at: string | null;
  queued_count: number;
  next_lead_preview: {
    id: string;
    masked_name: string;
    city: string | null;
    state: string | null;
  } | null;
}

export function useLeadRelease() {
  const [info, setInfo] = useState<LeadReleaseInfo | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const isReleasingRef = useRef(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [newlyReleasedLeadId, setNewlyReleasedLeadId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [defaultInterval, setDefaultIntervalState] = useState<number>(300);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const autoReleaseTriggeredRef = useRef<string | null>(null);

  const triggerCelebration = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  }, []);

  const fetchInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-release', {
        body: { action: 'get_info' },
      });
      if (error) throw error;
      setInfo(data);
    } catch (err) {
      console.error('Error fetching release info:', err);
    }
  }, []);

  const doRelease = useCallback(async (mode: 'scheduled' | 'manual_admin') => {
    if (isReleasingRef.current) return null;
    isReleasingRef.current = true;
    setIsReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-release', {
        body: { action: 'release', mode },
      });
      if (error) throw error;

      if (data?.success) {
        setNewlyReleasedLeadId(data.lead_id);
        await fetchInfo();
        return data;
      }
      await fetchInfo();
      return data;
    } catch (err) {
      console.error('Error releasing lead:', err);
      throw err;
    } finally {
      isReleasingRef.current = false;
      setIsReleasing(false);
    }
  }, [fetchInfo, triggerCelebration]);

  // Listen for realtime lead releases (so ALL users see confetti)
  useEffect(() => {
    const channel = supabase
      .channel('hotleads-release-events')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          // If a lead just became available (was queued before) - from planilha queue
          if (
            (newRow.source === 'planilha' || newRow.source === 'n8n') &&
            newRow.release_status === 'available' &&
            oldRow.release_status === 'queued'
          ) {
            setNewlyReleasedLeadId(newRow.id);
            fetchInfo();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          const newRow = payload.new as any;
          // n8n leads arrive directly as available - notify everyone
          if (newRow.source === 'n8n' && newRow.release_status === 'available') {
            setNewlyReleasedLeadId(newRow.id);
            fetchInfo();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [triggerCelebration, fetchInfo]);

  // Countdown timer + auto-release when it hits 0
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!info?.next_release_at) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const target = new Date(info.next_release_at!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setCountdown(diff);

      if (diff <= 0 && autoReleaseTriggeredRef.current !== info.next_release_at) {
        autoReleaseTriggeredRef.current = info.next_release_at;
        doRelease('scheduled').catch(() => {
          setTimeout(() => {
            autoReleaseTriggeredRef.current = null;
          }, 10000);
        });
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [info?.next_release_at, doRelease]);

  // Initial fetch + periodic refresh
  useEffect(() => {
    fetchInfo();
    fetchDefaultInterval();
    const interval = setInterval(fetchInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchInfo]);

  // Schedule first next_release_at when info loads with none set
  useEffect(() => {
    if (info && !info.next_release_at && info.queued_count > 0 && info.daily_released < info.daily_target) {
      supabase.functions.invoke('hotleads-release', {
        body: { action: 'schedule_next' },
      }).then(() => fetchInfo());
    }
  }, [info, fetchInfo]);

  const fetchDefaultInterval = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-release', {
        body: { action: 'get_default_interval' },
      });
      if (!error && data?.interval_seconds) {
        setDefaultIntervalState(data.interval_seconds);
      }
    } catch (err) {
      console.error('Error fetching default interval:', err);
    }
  }, []);

  const setDefaultInterval = useCallback(async (seconds: number) => {
    const { data, error } = await supabase.functions.invoke('hotleads-release', {
      body: { action: 'set_default_interval', seconds },
    });
    if (error) throw error;
    setDefaultIntervalState(seconds);
    return data;
  }, []);

  const releaseNow = useCallback(() => doRelease('manual_admin'), [doRelease]);

  const clearNewLead = useCallback(() => {
    setNewlyReleasedLeadId(null);
  }, []);

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return {
    info,
    countdown,
    formatCountdown,
    isReleasing,
    releaseNow,
    defaultInterval,
    setDefaultInterval,
    newlyReleasedLeadId,
    showConfetti,
    clearNewLead,
    refreshInfo: fetchInfo,
  };
}
