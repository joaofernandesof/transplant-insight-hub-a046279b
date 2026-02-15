import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

/**
 * Plays a notification sound and shows a browser notification
 * when a new lead becomes available (release_status = 'available').
 */
export function useLeadNotificationSound(options?: {
  onNewLead?: () => void;
  enabled?: boolean;
}) {
  const { user, isAdmin } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabled = options?.enabled ?? true;

  // Create audio element once
  useEffect(() => {
    // Use Web Audio API with a pleasant notification chime
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // We'll use a generated tone instead of a file for reliability
    const playChime = () => {
      try {
        const now = ctx.currentTime;
        
        // First note
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(830, now); // G#5
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Second note (higher)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046, now + 0.15); // C6
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.3, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.5);

        // Third note (highest)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1318, now + 0.3); // E6
        gain3.gain.setValueAtTime(0, now);
        gain3.gain.setValueAtTime(0.25, now + 0.3);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc3.connect(gain3).connect(ctx.destination);
        osc3.start(now + 0.3);
        osc3.stop(now + 0.7);
      } catch (e) {
        console.warn('Could not play notification sound:', e);
      }
    };

    audioRef.current = { play: playChime } as any;

    return () => {
      ctx.close().catch(() => {});
    };
  }, []);

  const showBrowserNotification = useCallback((leadState?: string) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const n = new Notification('🔥 Novo HotLead disponível!', {
        body: leadState 
          ? `Um novo lead em ${leadState} está disponível para captura!`
          : 'Um novo lead está disponível para captura!',
        icon: '/favicon.ico',
        tag: 'hotlead-new',
        requireInteraction: false,
      });
      // Auto-close after 8 seconds
      setTimeout(() => n.close(), 8000);
    }
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Request permission on mount
  useEffect(() => {
    requestBrowserPermission();
  }, [requestBrowserPermission]);

  // Subscribe to leads table changes for new available leads
  useEffect(() => {
    if (!user?.id || !enabled || isAdmin) return;

    const channel = supabase
      .channel('hotlead-sound-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: 'release_status=eq.available',
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Only trigger when release_status changed TO 'available'
          if (oldRecord?.release_status !== 'available' && newRecord?.release_status === 'available') {
            console.log('🔔 New lead available! Playing sound...');
            
            // Play sound
            if (audioRef.current) {
              (audioRef.current as any).play();
            }

            // Show browser notification
            showBrowserNotification(newRecord?.state);

            // Show in-app toast
            toast('🔥 Novo lead disponível!', {
              description: newRecord?.state 
                ? `Lead em ${newRecord.state} acabou de ser liberado!`
                : 'Um novo lead foi liberado!',
              action: {
                label: 'Ver',
                onClick: () => {
                  // Focus the available tab
                  window.dispatchEvent(new CustomEvent('hotlead:focus-available'));
                },
              },
              duration: 10000,
            });

            // Callback
            options?.onNewLead?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, enabled, isAdmin, showBrowserNotification, options?.onNewLead]);

  return { requestBrowserPermission };
}
