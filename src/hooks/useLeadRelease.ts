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
  const [countdown, setCountdown] = useState<number>(0);
  const [newlyReleasedLeadId, setNewlyReleasedLeadId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

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

  // Countdown timer
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

      // Auto-refresh when countdown reaches 0
      if (diff <= 0) {
        fetchInfo();
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [info?.next_release_at, fetchInfo]);

  useEffect(() => {
    fetchInfo();
    // Refresh every 30s
    const interval = setInterval(fetchInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchInfo]);

  const releaseNow = useCallback(async () => {
    setIsReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('hotleads-release', {
        body: { action: 'release', mode: 'manual_admin' },
      });
      if (error) throw error;

      if (data?.success) {
        setNewlyReleasedLeadId(data.lead_id);
        // Show confetti after fade-in (1.5s)
        setTimeout(() => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }, 1500);
        
        // Refresh info
        await fetchInfo();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Error releasing lead:', err);
      throw err;
    } finally {
      setIsReleasing(false);
    }
  }, [fetchInfo]);

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
    newlyReleasedLeadId,
    showConfetti,
    clearNewLead,
    refreshInfo: fetchInfo,
  };
}
