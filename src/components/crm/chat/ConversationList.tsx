/**
 * ConversationList - Lista de conversas ativas
 * Ordenada da mais recente para mais antiga
 */

import { useState } from 'react';
import { Search, Filter, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationListItem } from './ConversationListItem';
import { CrmConversation } from '@/hooks/useCrmConversations';

interface ConversationListProps {
  conversations: CrmConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

type FilterStatus = 'all' | 'open' | 'pending' | 'resolved' | 'unread' | 'assigned';

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

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
    <div className="h-full flex flex-col bg-[hsl(var(--avivar-card))]">
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
      <div className="flex-1 overflow-y-scroll scrollbar-avivar">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
