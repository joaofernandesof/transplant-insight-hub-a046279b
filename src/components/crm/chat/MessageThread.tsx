/**
 * MessageThread - Painel central de mensagens
 * Exibe histórico da mais antiga para mais recente
 * Com scroll independente e botão "ver mais" para mensagens antigas
 * Inclui eventos de automação inline na timeline
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, ChevronUp } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { AutomationEventBadge } from './AutomationEventBadge';
import { CrmMessage } from '@/hooks/useCrmConversations';
import { useAvivarAutomationExecutionsByConversation, type AvivarAutomationExecution } from '@/hooks/useAvivarAutomations';
import { Button } from '@/components/ui/button';

interface MessageThreadProps {
  messages: CrmMessage[];
  isLoading: boolean;
}

type TimelineItem =
  | { type: 'message'; data: CrmMessage; timestamp: string }
  | { type: 'automation'; data: AvivarAutomationExecution; timestamp: string };

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

  // Get conversation_id from the first message
  const conversationId = messages[0]?.conversation_id;
  const { data: automationExecutions = [] } = useAvivarAutomationExecutionsByConversation(conversationId);

  // Merge messages + automation events into a single sorted timeline
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    messages.forEach(m => items.push({ type: 'message', data: m, timestamp: m.sent_at }));
    automationExecutions.forEach(e => items.push({ type: 'automation', data: e, timestamp: e.created_at }));
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return items;
  }, [messages, automationExecutions]);

  // Visible items (most recent)
  const visibleItems = timeline.slice(-visibleCount);
  const hasMoreItems = timeline.length > visibleCount;

  // Scroll to bottom within container only (not affecting page)
  const scrollToBottomInternal = (behavior: ScrollBehavior = 'auto') => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottomInternal('smooth');
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottomInternal('auto');
      });
    }
  }, [isLoading]);

  // Reset visible count when conversation changes
  useEffect(() => {
    setVisibleCount(INITIAL_MESSAGES_COUNT);
  }, [conversationId]);

  // Handle scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollToBottom(distanceFromBottom > 200);
  }, []);

  const loadMoreMessages = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, timeline.length));
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

  // Group timeline items by date
  const groupedItems: { date: Date; items: TimelineItem[] }[] = [];
  
  visibleItems.forEach(item => {
    const itemDate = new Date(item.timestamp);
    const lastGroup = groupedItems[groupedItems.length - 1];
    
    if (lastGroup && isSameDay(lastGroup.date, itemDate)) {
      lastGroup.items.push(item);
    } else {
      groupedItems.push({ date: itemDate, items: [item] });
    }
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 max-h-full relative overflow-hidden">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-4 scrollbar-avivar"
      >
        <div className="space-y-4 py-4">
          {hasMoreItems && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreMessages}
                className="text-xs text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
              >
                <ChevronUp className="h-3 w-3 mr-1" />
                Ver mais ({timeline.length - visibleCount} anteriores)
              </Button>
            </div>
          )}

          {groupedItems.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] text-xs px-3 py-1 rounded-full">
                  {formatDateDivider(group.date)}
                </div>
              </div>

              {/* Items for this date */}
              <div className="space-y-3">
                {group.items.map(item => {
                  if (item.type === 'message') {
                    return <MessageBubble key={item.data.id} message={item.data as CrmMessage} />;
                  }
                  return <AutomationEventBadge key={`auto-${(item.data as AvivarAutomationExecution).id}`} execution={item.data as AvivarAutomationExecution} />;
                })}
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