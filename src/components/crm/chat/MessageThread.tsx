/**
 * MessageThread - Painel central de mensagens
 * Exibe histórico da mais antiga para mais recente
 * Com scroll independente e botão "ver mais" para mensagens antigas
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, ChevronUp } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { CrmMessage } from '@/hooks/useCrmConversations';
import { Button } from '@/components/ui/button';

interface MessageThreadProps {
  messages: CrmMessage[];
  isLoading: boolean;
}

function formatDateDivider(date: Date): string {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

// Número de mensagens a exibir inicialmente (as mais recentes)
const INITIAL_MESSAGES_COUNT = 20;
const LOAD_MORE_COUNT = 20;

export function MessageThread({ messages, isLoading }: MessageThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_MESSAGES_COUNT);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  // Mensagens visíveis (as mais recentes)
  const visibleMessages = messages.slice(-visibleCount);
  const hasMoreMessages = messages.length > visibleCount;

  // Scroll to bottom within container only (not affecting page)
  const scrollToBottomInternal = (behavior: ScrollBehavior = 'auto') => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll if new messages were added
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottomInternal('smooth');
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom (only affects container, not page)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      // Small delay to ensure content is rendered
      requestAnimationFrame(() => {
        scrollToBottomInternal('auto');
      });
    }
  }, [isLoading]);

  // Reset visible count when conversation changes
  useEffect(() => {
    setVisibleCount(INITIAL_MESSAGES_COUNT);
  }, [messages[0]?.conversation_id]);

  // Handle scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollToBottom(distanceFromBottom > 200);
  }, []);

  const loadMoreMessages = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, messages.length));
  };

  const scrollToBottom = () => {
    scrollToBottomInternal('smooth');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[hsl(var(--avivar-muted-foreground))] min-h-0">
        <MessageCircle className="h-16 w-16 opacity-30 mb-4" />
        <p className="text-lg">Nenhuma mensagem ainda</p>
        <p className="text-sm mt-1">Envie a primeira mensagem para iniciar a conversa</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: Date; messages: CrmMessage[] }[] = [];
  
  visibleMessages.forEach(message => {
    const messageDate = new Date(message.sent_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    
    if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({ date: messageDate, messages: [message] });
    }
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Scrollable messages area with visible scrollbar */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll px-4 scrollbar-avivar"
      >
        <div className="space-y-4 py-4">
          {/* Load more button */}
          {hasMoreMessages && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreMessages}
                className="text-xs text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
              >
                <ChevronUp className="h-3 w-3 mr-1" />
                Ver mais ({messages.length - visibleCount} anteriores)
              </Button>
            </div>
          )}

          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] text-xs px-3 py-1 rounded-full">
                  {formatDateDivider(group.date)}
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {group.messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          variant="secondary"
          size="sm"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 rounded-full shadow-lg bg-[hsl(var(--avivar-primary))] text-white hover:bg-[hsl(var(--avivar-primary)/0.9)] h-8 w-8 p-0"
        >
          <ChevronUp className="h-4 w-4 rotate-180" />
        </Button>
      )}
    </div>
  );
}
