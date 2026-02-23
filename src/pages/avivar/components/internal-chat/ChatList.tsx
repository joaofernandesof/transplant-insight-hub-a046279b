/**
 * ChatList - Lista de conversas do chat interno
 */
import { Plus, Users, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InternalChat } from '@/hooks/useInternalChat';

interface ChatListProps {
  chats: InternalChat[];
  isLoading: boolean;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  getChatDisplayName: (chat: InternalChat) => string;
  getChatAvatar: (chat: InternalChat) => string | null | undefined;
}

export function ChatList({ chats, isLoading, onSelectChat, onNewChat, getChatDisplayName, getChatAvatar }: ChatListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* New chat button */}
      <div className="p-3 border-b">
        <Button onClick={onNewChat} className="w-full" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova conversa
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Clique em "Nova conversa" para começar
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {chats.map(chat => {
              const displayName = getChatDisplayName(chat);
              const avatar = getChatAvatar(chat);
              const lastMsg = chat.last_message;
              const hasUnread = (chat.unread_count || 0) > 0;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${
                    hasUnread ? 'bg-primary/5' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {chat.type === 'group' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        displayName.slice(0, 2).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                        {displayName}
                      </span>
                      {lastMsg && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: false, locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {lastMsg?.is_deleted
                          ? '🚫 Mensagem apagada'
                          : lastMsg?.message_type === 'image'
                          ? '📷 Imagem'
                          : lastMsg?.message_type === 'file'
                          ? '📎 Arquivo'
                          : lastMsg?.message_type === 'system'
                          ? `ℹ️ ${lastMsg.content}`
                          : lastMsg?.content || 'Sem mensagens'}
                      </p>
                      {hasUnread && (
                        <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
