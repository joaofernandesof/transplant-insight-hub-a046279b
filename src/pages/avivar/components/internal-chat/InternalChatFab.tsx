/**
 * InternalChatFab - Botão flutuante do chat interno com badge de não lidas e som
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { InternalChatDrawer } from './InternalChatDrawer';
import { useInternalChat } from '@/hooks/useInternalChat';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';

export function InternalChatFab() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalUnread } = useInternalChat();
  const { session } = useUnifiedAuth();
  const authUserId = session?.user?.id;
  const prevUnread = useRef(totalUnread);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize audio context lazily
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      // Two-note chime (different from HotLeads)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn('Chat notification sound failed:', e);
    }
  }, [getAudioCtx]);

  // Detect new unread and notify
  useEffect(() => {
    if (totalUnread > prevUnread.current && !isOpen) {
      playNotificationSound();
      toast('💬 Nova mensagem no chat interno', {
        description: 'Você recebeu uma nova mensagem',
        action: {
          label: 'Abrir',
          onClick: () => setIsOpen(true),
        },
        duration: 6000,
      });
    }
    prevUnread.current = totalUnread;
  }, [totalUnread, isOpen, playNotificationSound]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        aria-label="Abrir chat interno"
      >
        <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      <InternalChatDrawer open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
