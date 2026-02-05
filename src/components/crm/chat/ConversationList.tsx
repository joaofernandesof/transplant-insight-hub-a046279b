/**
 * ConversationList - Lista de conversas ativas
 * Ordenada da mais recente para mais antiga
 */

import { useState, useEffect } from 'react';
import { Search, Filter, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationListItem } from './ConversationListItem';
import { CrmConversation, CrmMessage } from '@/hooks/useCrmConversations';
import { supabase } from '@/integrations/supabase/client';

interface ConversationListProps {
  conversations: CrmConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

type FilterStatus = 'all' | 'open' | 'pending' | 'resolved' | 'unread' | 'assigned';

// Map to store last message content for each conversation
type LastMessagesMap = Record<string, string>;

// Map to store unanswered inbound message count for each conversation
type UnansweredCountMap = Record<string, number>;

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [lastMessages, setLastMessages] = useState<LastMessagesMap>({});
  const [unansweredCounts, setUnansweredCounts] = useState<UnansweredCountMap>({});

  // Fetch last message for all conversations
  useEffect(() => {
    async function fetchLastMessages() {
      if (conversations.length === 0) return;

      const conversationIds = conversations.map(c => c.id);
      
      // Fetch all messages for each conversation to calculate preview and unanswered count
      const { data, error } = await supabase
        .from('crm_messages')
        .select('conversation_id, content, media_type, direction, sent_at')
        .in('conversation_id', conversationIds)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching last messages:', error);
        return;
      }

      // Group messages by conversation_id
      const messagesByConversation: Record<string, typeof data> = {};
      for (const msg of data || []) {
        if (!messagesByConversation[msg.conversation_id]) {
          messagesByConversation[msg.conversation_id] = [];
        }
        messagesByConversation[msg.conversation_id].push(msg);
      }

      // Calculate last message preview and unanswered count for each conversation
      const messagesMap: LastMessagesMap = {};
      const countsMap: UnansweredCountMap = {};

      for (const [convId, messages] of Object.entries(messagesByConversation)) {
        // Get the most recent message for preview (first in array since sorted desc)
        const lastMsg = messages[0];
        if (lastMsg) {
          if (lastMsg.media_type) {
            const mediaLabels: Record<string, string> = {
              image: '📷 Imagem',
              video: '🎥 Vídeo',
              audio: '🎤 Áudio',
              document: '📄 Documento',
            };
            messagesMap[convId] = mediaLabels[lastMsg.media_type] || '📎 Arquivo';
          } else if (lastMsg.content) {
            messagesMap[convId] = lastMsg.content.length > 50 
              ? lastMsg.content.substring(0, 50) + '...' 
              : lastMsg.content;
          }
        }

        // Calculate unanswered inbound messages:
        // Count inbound messages that came after the last outbound message
        const lastOutboundIndex = messages.findIndex(m => m.direction === 'outbound');
        
        if (lastOutboundIndex === -1) {
          // No outbound messages - all inbound messages are unanswered
          countsMap[convId] = messages.filter(m => m.direction === 'inbound').length;
        } else {
          // Count inbound messages before the last outbound (in the array, which means after in time)
          const messagesAfterLastOutbound = messages.slice(0, lastOutboundIndex);
          countsMap[convId] = messagesAfterLastOutbound.filter(m => m.direction === 'inbound').length;
        }
      }

      setLastMessages(messagesMap);
      setUnansweredCounts(countsMap);
    }

    fetchLastMessages();
  }, [conversations]);

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv => {
    // Filtro por status
    if (filterStatus === 'unread' && conv.unread_count === 0) {
      return false;
    }
    if (filterStatus === 'assigned' && !conv.assigned_to) {
      return false;
    }
    if (filterStatus !== 'all' && filterStatus !== 'unread' && filterStatus !== 'assigned' && conv.status !== filterStatus) {
      return false;
    }
    
    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        conv.lead?.name?.toLowerCase().includes(search) ||
        conv.lead?.phone?.includes(search) ||
        conv.lead?.email?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Contadores
  const counts = {
    all: conversations.length,
    unread: conversations.filter(c => c.unread_count > 0).length,
    open: conversations.filter(c => c.status === 'open').length,
    assigned: conversations.filter(c => c.assigned_to).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[hsl(var(--avivar-card))]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--avivar-border))] space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          <Input
            placeholder="Buscar por nome, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
          />
        </div>

        {/* Filter tabs - Todas | Não lidas | Responsável */}
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <TabsList className="w-full grid grid-cols-3 bg-[hsl(var(--avivar-muted))]">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Todas ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Não lidas ({counts.unread})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Responsável ({counts.assigned})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation list with visible scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-avivar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mb-4 opacity-50" />
            <p className="text-[hsl(var(--avivar-muted-foreground))]">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--avivar-border))]">
            {filteredConversations.map(conversation => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedId === conversation.id}
                onClick={() => onSelect(conversation.id)}
                lastMessagePreview={lastMessages[conversation.id]}
                unansweredCount={unansweredCounts[conversation.id] || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
