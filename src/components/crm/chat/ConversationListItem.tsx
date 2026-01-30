/**
 * ConversationListItem - Item individual na lista de conversas
 * Exibe: nome do lead, última mensagem, horário, ID, canal
 */

import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Instagram, Phone, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CrmConversation } from '@/hooks/useCrmConversations';

const channelIcons = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  phone: Phone,
  email: Mail,
  manual: User,
};

const channelColors = {
  whatsapp: 'text-green-500',
  instagram: 'text-pink-500',
  phone: 'text-blue-500',
  email: 'text-orange-500',
  manual: 'text-muted-foreground',
};

interface ConversationListItemProps {
  conversation: CrmConversation;
  isSelected: boolean;
  onClick: () => void;
  lastMessagePreview?: string;
}

function formatMessageTime(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return `Hoje ${format(date, 'HH:mm')}`;
  }
  
  if (isYesterday(date)) {
    return `Ontem ${format(date, 'HH:mm')}`;
  }
  
  return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
  lastMessagePreview,
}: ConversationListItemProps) {
  const ChannelIcon = channelIcons[conversation.channel];
  const channelColor = channelColors[conversation.channel];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 text-left transition-all duration-200 border-b border-[hsl(var(--avivar-border))]",
        "hover:bg-[hsl(var(--avivar-accent))]",
        isSelected && "bg-[hsl(var(--avivar-primary)/0.1)] border-l-4 border-l-[hsl(var(--avivar-primary))]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 shrink-0 border-2 border-[hsl(var(--avivar-border))]">
          <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] font-semibold text-lg">
            {conversation.lead?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header: Nome + Canal */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">
              {conversation.lead?.name || 'Lead sem nome'}
            </span>
            <ChannelIcon className={cn("h-4 w-4 shrink-0", channelColor)} />
          </div>

          {/* Última mensagem */}
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] line-clamp-2">
            {lastMessagePreview || conversation.lead?.procedure_interest || 'Sem mensagens ainda'}
          </p>

          {/* Footer: Horário + Lead ID */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Badge 
              variant="outline" 
              className="text-xs font-mono bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] border-[hsl(var(--avivar-border))]"
            >
              Lead #{conversation.lead_id?.slice(0, 8) || 'N/A'}
            </Badge>
            
            <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] whitespace-nowrap">
              {formatMessageTime(conversation.last_message_at)}
            </span>
          </div>

          {/* Unread badge */}
          {conversation.unread_count > 0 && (
            <div className="flex justify-end">
              <Badge className="bg-[hsl(var(--avivar-primary))] text-white text-xs px-2 py-0.5">
                {conversation.unread_count} {conversation.unread_count === 1 ? 'nova' : 'novas'}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
