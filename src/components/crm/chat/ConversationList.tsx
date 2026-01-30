/**
 * ConversationList - Lista de conversas ativas
 * Ordenada da mais recente para mais antiga
 */

import { useState } from 'react';
import { Search, Filter, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationListItem } from './ConversationListItem';
import { CrmConversation } from '@/hooks/useCrmConversations';

interface ConversationListProps {
  conversations: CrmConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

type FilterStatus = 'all' | 'open' | 'pending' | 'resolved';

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
    if (filterStatus !== 'all' && conv.status !== filterStatus) {
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
    open: conversations.filter(c => c.status === 'open').length,
    pending: conversations.filter(c => c.status === 'pending').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Conversas
          </h2>
          <Button variant="ghost" size="icon" className="text-[hsl(var(--avivar-muted-foreground))]">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

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

        {/* Filter tabs */}
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <TabsList className="w-full grid grid-cols-4 bg-[hsl(var(--avivar-muted))]">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Todas ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="open" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Abertas ({counts.open})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Pendentes ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Resolvidas ({counts.resolved})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
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
      </ScrollArea>
    </div>
  );
}
