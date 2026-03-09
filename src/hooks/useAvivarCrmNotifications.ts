/**
 * useAvivarCrmNotifications — Realtime visual + sound notifications for Avivar CRM
 * Listens to: inbound messages, new kanban leads, lead column moves
 * Uses Web Audio API for distinct sounds per event type
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { toast } from 'sonner';
import { useAvivarNotificationSettings } from '@/hooks/useAvivarNotificationSettings';

type SoundPlayer = { play: () => void };

function createSoundPlayer(): {
  messageSound: SoundPlayer;
  newLeadSound: SoundPlayer;
  leadMovedSound: SoundPlayer;
  close: () => void;
} {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Message received: double short high tone (WhatsApp-like)
  const messageSound: SoundPlayer = {
    play: () => {
      try {
        const now = ctx.currentTime;
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now + i * 0.12);
          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.25, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.1);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.15);
        }
      } catch {}
    },
  };

  // New lead: ascending triad (G#5 → C6 → E6)
  const newLeadSound: SoundPlayer = {
    play: () => {
      try {
        const now = ctx.currentTime;
        const notes = [830, 1046, 1318];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.3, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.25);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.3);
        });
      } catch {}
    },
  };

  // Lead moved: single medium tone
  const leadMovedSound: SoundPlayer = {
    play: () => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } catch {}
    },
  };

  return {
    messageSound,
    newLeadSound,
    leadMovedSound,
    close: () => ctx.close().catch(() => {}),
  };
}

export function useAvivarCrmNotifications() {
  const { session } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const userId = session?.user?.id;
  const soundsRef = useRef<ReturnType<typeof createSoundPlayer> | null>(null);
  const { settings } = useAvivarNotificationSettings();

  // Init sounds
  useEffect(() => {
    soundsRef.current = createSoundPlayer();
    return () => {
      soundsRef.current?.close();
      soundsRef.current = null;
    };
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'avivar-crm',
        requireInteraction: false,
      });
      setTimeout(() => n.close(), 8000);
    }
  }, []);

  // Subscribe to realtime events
  useEffect(() => {
    if (!userId || !accountId) return;

    const channel = supabase
      .channel('avivar-crm-notifications')
      // 1. Inbound messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_messages',
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg?.direction !== 'inbound') return;
          if (!settings.newMessage) return;

          soundsRef.current?.messageSound.play();
          showBrowserNotification(
            '💬 Nova mensagem recebida',
            msg.content?.slice(0, 100) || 'Nova mensagem de um lead'
          );
          toast('💬 Nova mensagem', {
            description: msg.content?.slice(0, 80) || 'Mensagem recebida de um lead',
            duration: 6000,
          });
        }
      )
      // 2. New kanban lead
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'avivar_kanban_leads',
        },
        (payload) => {
          const lead = payload.new as any;
          if (lead?.account_id !== accountId) return;
          if (!settings.newLead) return;

          soundsRef.current?.newLeadSound.play();
          showBrowserNotification(
            '🔥 Novo lead!',
            `${lead.name || 'Lead'} entrou no funil`
          );
          toast('🔥 Novo lead no funil!', {
            description: lead.name || 'Um novo lead foi adicionado',
            duration: 6000,
          });
        }
      )
      // 3. Lead column change
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'avivar_kanban_leads',
        },
        (payload) => {
          const newRec = payload.new as any;
          const oldRec = payload.old as any;
          if (newRec?.account_id !== accountId) return;
          if (!oldRec?.column_id || oldRec.column_id === newRec.column_id) return;
          if (!settings.leadMoved) return;

          soundsRef.current?.leadMovedSound.play();
          showBrowserNotification(
            '📋 Lead movido',
            `${newRec.name || 'Lead'} foi movido de etapa`
          );
          toast('📋 Lead movido de etapa', {
            description: newRec.name || 'Um lead foi movido no funil',
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, accountId, settings, showBrowserNotification]);
}
