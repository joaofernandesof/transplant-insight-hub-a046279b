/**
 * MessageBubble - Balão de mensagem individual
 * Suporta texto, imagens, áudio e documentos
 * Diferencia mensagens de IA (robô) vs humano (avatar)
 */

import { format } from 'date-fns';
import { Check, CheckCheck, Bot, Image, FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrmMessage } from '@/hooks/useCrmConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageBubbleProps {
  message: CrmMessage;
}

function getStatusIcon(message: CrmMessage) {
  if (message.direction === 'inbound') return null;
  
  if (message.read_at) {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
  }
  if (message.delivered_at) {
    return <CheckCheck className="h-3.5 w-3.5" />;
  }
  return <Check className="h-3.5 w-3.5" />;
}

function getSenderInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const isAI = message.is_ai_generated;
  
  // Get sender display name for outbound messages
  const senderDisplayName = isOutbound 
    ? (isAI ? 'IA' : (message.sender?.name || message.sender_name || null))
    : null;
  
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isOutbound ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for outbound messages - shown on the right */}
      {isOutbound && (
        <div className="flex flex-col items-end order-2">
          {isAI ? (
            // AI Robot Avatar
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-primary)/0.7)] flex items-center justify-center shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
          ) : (
            // Human Avatar
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={message.sender?.avatar_url || undefined} 
                alt={senderDisplayName || 'Remetente'} 
              />
              <AvatarFallback className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))] text-xs font-medium">
                {getSenderInitials(senderDisplayName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm order-1",
          isOutbound
            ? "bg-[hsl(var(--avivar-primary))] text-white rounded-br-md"
            : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))] rounded-bl-md"
        )}
      >
        {/* Sender name for inbound */}
        {!isOutbound && message.sender_name && (
          <p className="text-xs font-medium mb-1 text-[hsl(var(--avivar-primary))]">
            {message.sender_name}
          </p>
        )}

        {/* Media content */}
        {message.media_url && message.media_type && (
          <div className="mb-2">
            {message.media_type === 'image' ? (
              <img
                src={message.media_url}
                alt="Imagem"
                className="rounded-lg max-w-full max-h-64 object-cover"
              />
            ) : message.media_type === 'video' ? (
              <video
                src={message.media_url}
                controls
                className="rounded-lg max-w-full max-h-64"
              >
                Seu navegador não suporta a reprodução de vídeos.
              </video>
            ) : message.media_type === 'audio' ? (
              <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                <Mic className="h-5 w-5" />
                <audio controls className="h-8 max-w-[200px]">
                  <source src={message.media_url} />
                </audio>
              </div>
            ) : message.media_type === 'document' ? (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm underline">Abrir documento</span>
              </a>
            ) : null}
          </div>
        )}

        {/* Text content */}
        {message.content && message.content !== '[Figurinha]' && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Footer: timestamp + sender name (for outbound) + status */}
        <div
          className={cn(
            "flex items-center justify-end gap-1.5 mt-2 flex-wrap",
            isOutbound ? "text-white/70" : "text-[hsl(var(--avivar-muted-foreground))]"
          )}
        >
          <span className="text-xs">
            {format(new Date(message.sent_at), "HH:mm")}
          </span>
          {isOutbound && senderDisplayName && (
            <>
              <span className="text-xs">•</span>
              <span className="text-xs font-medium">
                {senderDisplayName}
              </span>
            </>
          )}
          {getStatusIcon(message)}
        </div>
      </div>
    </div>
  );
}
