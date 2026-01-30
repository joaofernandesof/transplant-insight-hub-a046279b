/**
 * MessageThread - Painel central de mensagens
 * Exibe histórico da mais antiga para mais recente
 */

import { useRef, useEffect } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { CrmMessage } from '@/hooks/useCrmConversations';

interface MessageThreadProps {
  messages: CrmMessage[];
  isLoading: boolean;
}

function formatDateDivider(date: Date): string {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function MessageThread({ messages, isLoading }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[hsl(var(--avivar-muted-foreground))]">
        <MessageCircle className="h-16 w-16 opacity-30 mb-4" />
        <p className="text-lg">Nenhuma mensagem ainda</p>
        <p className="text-sm mt-1">Envie a primeira mensagem para iniciar a conversa</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: Date; messages: CrmMessage[] }[] = [];
  
  messages.forEach(message => {
    const messageDate = new Date(message.sent_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    
    if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({ date: messageDate, messages: [message] });
    }
  });

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4 py-4">
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
    </ScrollArea>
  );
}
