/**
 * ConversationListItem - Item individual na lista de conversas
 * Exibe: nome do lead, última mensagem, horário, badge não lidas, ícone de fonte no avatar
 */

import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LeadSourceAvatar } from '@/components/avivar/LeadSourceAvatar';
import { CrmConversation } from '@/hooks/useCrmConversations';

interface ConversationListItemProps {
  conversation: CrmConversation;
  isSelected: boolean;
  onClick: () => void;
  lastMessagePreview?: string;
  unansweredCount?: number;
}

function formatMessageTime(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }
  
  return format(date, 'dd/MM', { locale: ptBR });
}

// Map channel to source for the avatar component
const getSourceFromChannel = (channel: string): string => {
  switch (channel) {
    case 'whatsapp':
      return 'whatsapp';
    case 'instagram':
      return 'instagram';
    case 'facebook':
      return 'facebook';
    default:
      return channel || 'manual';
  }
};

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
  lastMessagePreview,
  unansweredCount = 0,
}: ConversationListItemProps) {
  // Determine source - use channel as source
  const source = getSourceFromChannel(conversation.channel);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left transition-all duration-200 border-b border-[hsl(var(--avivar-border))]",
        "hover:bg-[hsl(var(--avivar-accent))]",
        isSelected && "bg-[hsl(var(--avivar-primary)/0.1)] border-l-4 border-l-[hsl(var(--avivar-primary))]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar com ícone de fonte */}
        <LeadSourceAvatar 
          name={conversation.lead?.name || 'Lead'}
          source={source}
          size="lg"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Header: Nome + Horário */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[hsl(var(--avivar-foreground))] truncate text-sm">
              {conversation.lead?.name || 'Lead sem nome'}
            </span>
            <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] whitespace-nowrap">
              {formatMessageTime(conversation.last_message_at)}
            </span>
          </div>

          {/* Última mensagem */}
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] line-clamp-1">
            {lastMessagePreview || conversation.lead?.procedure_interest || 'Sem mensagens ainda'}
          </p>

          {/* Badge de não lidas */}
          {unansweredCount > 0 && (
            <div className="flex justify-end pt-0.5">
              <div className="min-w-5 h-5 px-1.5 rounded-full bg-[hsl(var(--avivar-primary))] text-white text-xs font-medium flex items-center justify-center">
                {unansweredCount > 99 ? '99+' : unansweredCount}
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
