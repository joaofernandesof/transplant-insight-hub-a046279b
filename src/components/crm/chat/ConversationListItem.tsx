/**
 * ConversationListItem - Item individual na lista de conversas
 * Exibe: nome do lead, última mensagem, horário, badge não lidas, emoji WhatsApp no avatar
 */

import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Instagram, Phone, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }
  
  return format(date, 'dd/MM', { locale: ptBR });
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
  lastMessagePreview,
}: ConversationListItemProps) {
  const isWhatsApp = conversation.channel === 'whatsapp';
  const isInstagram = conversation.channel === 'instagram';
  
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
        {/* Avatar com emoji do canal */}
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border-2 border-[hsl(var(--avivar-border))]">
            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] font-semibold text-lg">
              {conversation.lead?.name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {/* Emoji do canal no canto do avatar */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] flex items-center justify-center text-xs">
            {isWhatsApp && '💬'}
            {isInstagram && '📸'}
            {!isWhatsApp && !isInstagram && '📩'}
          </div>
        </div>

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
          {conversation.unread_count > 0 && (
            <div className="flex justify-end pt-0.5">
              <div className="min-w-5 h-5 px-1.5 rounded-full bg-[hsl(var(--avivar-primary))] text-white text-xs font-medium flex items-center justify-center">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
