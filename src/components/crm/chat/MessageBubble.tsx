/**
 * MessageBubble - Balão de mensagem individual
 * Suporta texto, imagens, áudio e documentos
 */

import { format } from 'date-fns';
import { Check, CheckCheck, Clock, Image, FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrmMessage } from '@/hooks/useCrmConversations';

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

function getMediaIcon(mediaType: CrmMessage['media_type']) {
  switch (mediaType) {
    case 'image':
      return <Image className="h-4 w-4" />;
    case 'audio':
      return <Mic className="h-4 w-4" />;
    case 'document':
      return <FileText className="h-4 w-4" />;
    default:
      return null;
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  
  return (
    <div
      className={cn(
        "flex w-full",
        isOutbound ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
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
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Footer: timestamp + status */}
        <div
          className={cn(
            "flex items-center justify-end gap-1.5 mt-2",
            isOutbound ? "text-white/70" : "text-[hsl(var(--avivar-muted-foreground))]"
          )}
        >
          <span className="text-xs">
            {format(new Date(message.sent_at), "HH:mm")}
          </span>
          {getStatusIcon(message)}
        </div>
      </div>
    </div>
  );
}
