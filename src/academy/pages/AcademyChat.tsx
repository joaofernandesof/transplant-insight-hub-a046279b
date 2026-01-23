import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, MessageCircle, Users, Search } from "lucide-react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  recipientCity: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function AcademyChat() {
  const { recipientId } = useParams<{ recipientId?: string }>();
  const [searchParams] = useSearchParams();
  const recipientName = searchParams.get('name') || '';
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  useEffect(() => {
    async function fetchConversations() {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Get all messages where user is sender or recipient
        const { data: messagesData, error } = await supabase
          .from('community_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const conversationMap = new Map<string, Conversation>();
        
        for (const msg of messagesData || []) {
          const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          
          if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, {
              recipientId: partnerId,
              recipientName: '',
              recipientAvatar: null,
              recipientCity: null,
              lastMessage: msg.content,
              lastMessageAt: msg.created_at,
              unreadCount: msg.recipient_id === user.id && !msg.is_read ? 1 : 0
            });
          } else if (msg.recipient_id === user.id && !msg.is_read) {
            const conv = conversationMap.get(partnerId)!;
            conv.unreadCount++;
          }
        }

        // Fetch user details for each conversation partner
        const partnerIds = Array.from(conversationMap.keys());
        if (partnerIds.length > 0) {
          const { data: users } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_url, city')
            .in('user_id', partnerIds);

          users?.forEach(u => {
            const conv = conversationMap.get(u.user_id);
            if (conv) {
              conv.recipientName = u.name || 'Usuário';
              conv.recipientAvatar = u.avatar_url;
              conv.recipientCity = u.city;
            }
          });
        }

        setConversations(Array.from(conversationMap.values()));
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!recipientId) {
      fetchConversations();
    }
  }, [user?.id, recipientId]);

  // Fetch messages for specific conversation
  useEffect(() => {
    async function fetchMessages() {
      if (!user?.id || !recipientId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('community_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages: ChatMessage[] = (data || []).map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          recipientId: msg.recipient_id,
          content: msg.content,
          createdAt: msg.created_at,
          isRead: msg.is_read || false
        }));

        setMessages(formattedMessages);

        // Mark messages as read
        await supabase
          .from('community_messages')
          .update({ is_read: true })
          .eq('recipient_id', user.id)
          .eq('sender_id', recipientId);

      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [user?.id, recipientId]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id || !recipientId) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id === recipientId) {
            setMessages(prev => [...prev, {
              id: newMsg.id,
              senderId: newMsg.sender_id,
              recipientId: newMsg.recipient_id,
              content: newMsg.content,
              createdAt: newMsg.created_at,
              isRead: true
            }]);
            
            // Mark as read
            supabase
              .from('community_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, recipientId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !recipientId) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage.trim(),
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: data.id,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        content: data.content,
        createdAt: data.created_at,
        isRead: false
      }]);

      setNewMessage('');
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Conversation List View
  if (!recipientId) {
    return (
      <div className="min-h-screen bg-background w-full overflow-x-hidden">
        <div className="p-3 sm:p-4 pt-16 lg:pt-6 pb-8 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Mensagens
              </h1>
              <p className="text-xs text-muted-foreground">Converse com seus colegas</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversations List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Nenhuma conversa ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Inicie uma conversa através da aba Network da sua turma
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <Card 
                  key={conv.recipientId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/academy/chat/${conv.recipientId}?name=${encodeURIComponent(conv.recipientName)}`)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.recipientAvatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {conv.recipientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{conv.recipientName}</p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {format(new Date(conv.lastMessageAt), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {conv.recipientCity && (
                          <p className="text-xs text-muted-foreground">{conv.recipientCity}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat View with specific recipient
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b shadow-sm px-3 sm:px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/academy/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {recipientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{recipientName}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Inicie a conversa enviando uma mensagem
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="sticky bottom-0 bg-card border-t p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
