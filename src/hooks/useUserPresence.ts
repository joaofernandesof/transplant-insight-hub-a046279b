import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserPresence = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const startSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Create a new session
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error starting session:', error);
        return;
      }

      sessionIdRef.current = data.id;
      startTimeRef.current = new Date();
      console.log('Session started:', data.id);

      // Update last_seen_at
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error in startSession:', error);
    }
  }, [user?.id]);

  const updateHeartbeat = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }, [user?.id]);

  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !startTimeRef.current) return;

    try {
      const endTime = new Date();
      const durationSeconds = Math.floor(
        (endTime.getTime() - startTimeRef.current.getTime()) / 1000
      );

      await supabase
        .from('user_sessions')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', sessionIdRef.current);

      console.log('Session ended, duration:', durationSeconds, 'seconds');
      sessionIdRef.current = null;
      startTimeRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Start session when hook mounts
    startSession();

    // Set up heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(updateHeartbeat, 30000);

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      } else {
        startSession();
      }
    };

    // Handle before unload (page close)
    const handleBeforeUnload = () => {
      endSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [user?.id, startSession, endSession, updateHeartbeat]);

  return { sessionId: sessionIdRef.current };
};
