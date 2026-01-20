import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageCircle, 
  Instagram, 
  Phone, 
  Mail, 
  Send, 
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Archive,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCrmConversations, CrmConversation } from '@/hooks/useCrmConversations';

const channelConfig = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  phone: { icon: Phone, label: 'Telefone', color: 'text-blue-500' },
  email: { icon: Mail, label: 'E-mail', color: 'text-orange-500' },
  manual: { icon: User, label: 'Manual', color: 'text-muted-foreground' },
};

const statusConfig = {
  open: { label: 'Aberta', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  resolved: { label: 'Resolvida', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  archived: { label: 'Arquivada', className: 'bg-muted text-muted-foreground' },
};

export function CrmInbox() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'pending'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    messages,
    isLoadingConversations,
    sendMessage,
    updateConversationStatus,
  } = useCrmConversations(selectedConversation || undefined);

  const filteredConversations = conversations.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessage.mutate({
      conversationId: selectedConversation,
      content: messageInput.trim(),
    });
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center h-[60vh]">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma conversa ainda</h3>
        <p className="text-sm text-muted-foreground mb-4">
          As conversas aparecerão aqui quando você iniciar atendimentos via WhatsApp ou Instagram.
        </p>
        <p className="text-xs text-muted-foreground">
          💡 Dica: Inicie uma conversa clicando em um lead no Funil
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      {/* Conversation List */}
      <Card className="md:col-span-1 flex flex-col">
        {/* Filter tabs */}
        <div className="flex border-b p-2 gap-1">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'open', label: 'Abertas' },
            { key: 'pending', label: 'Pendentes' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setFilter(key as typeof filter)}
            >
              {label}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.map(conversation => {
              const ChannelIcon = channelConfig[conversation.channel].icon;
              const isSelected = selectedConversation === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-colors",
                    "hover:bg-muted/50",
                    isSelected && "bg-primary/10 border border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conversation.lead?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {conversation.lead?.name || 'Lead'}
                        </span>
                        <ChannelIcon className={cn("h-4 w-4 shrink-0", channelConfig[conversation.channel].color)} />
                      </div>
                      
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.lead?.procedure_interest || 'Sem procedimento'}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className={cn("text-xs", statusConfig[conversation.status].className)}>
                          {statusConfig[conversation.status].label}
                        </Badge>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conversation.last_message_at), "HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>

                    {conversation.unread_count > 0 && (
                      <Badge className="bg-primary text-primary-foreground shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Message Thread */}
      <Card className="md:col-span-2 flex flex-col">
        {selectedConversation && currentConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentConversation.lead?.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{currentConversation.lead?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {currentConversation.lead?.phone}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updateConversationStatus.mutate({ 
                    id: currentConversation.id, 
                    status: 'resolved' 
                  })}>
                    <Check className="h-4 w-4 mr-2" />
                    Marcar como Resolvida
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateConversationStatus.mutate({ 
                    id: currentConversation.id, 
                    status: 'archived' 
                  })}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.direction === 'outbound' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2",
                        message.direction === 'outbound'
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1",
                        message.direction === 'outbound' ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        <span className="text-xs">
                          {format(new Date(message.sent_at), "HH:mm")}
                        </span>
                        {message.direction === 'outbound' && (
                          message.read_at ? (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          ) : message.delivered_at ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessage.isPending}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para visualizar</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
