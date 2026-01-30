/**
 * CrmInbox - Interface principal de chat do Avivar
 * Layout 3 colunas: Lista de conversas | Detalhes do lead | Chat
 * Suporta initialLeadId para abrir conversa de um lead específico
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCrmConversations } from '@/hooks/useCrmConversations';

// Componentes focados
import { ConversationList } from './chat/ConversationList';
import { LeadDetailsSidebar } from './chat/LeadDetailsSidebar';
import { MessageThread } from './chat/MessageThread';
import { MessageInput } from './chat/MessageInput';
import { ChatHeader } from './chat/ChatHeader';

interface CrmInboxProps {
  initialLeadId?: string;
}

export function CrmInbox({ initialLeadId }: CrmInboxProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(!!initialLeadId);

  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    sendMessage,
    updateConversationStatus,
    createConversation,
  } = useCrmConversations(selectedConversation || undefined);

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  // Auto-select or create conversation when initialLeadId is provided
  useEffect(() => {
    if (!initialLeadId || isLoadingConversations) return;

    // Find existing conversation for this lead
    const existingConversation = conversations.find(c => c.lead_id === initialLeadId);
    
    if (existingConversation) {
      setSelectedConversation(existingConversation.id);
      setIsInitializing(false);
    } else if (isInitializing) {
      // Create new conversation for this lead
      createConversation.mutate(
        { leadId: initialLeadId, channel: 'whatsapp' },
        {
          onSuccess: (data) => {
            setSelectedConversation(data.id);
            setIsInitializing(false);
          },
          onError: () => {
            setIsInitializing(false);
          }
        }
      );
    }
  }, [initialLeadId, conversations, isLoadingConversations, isInitializing, createConversation]);

  const handleSendMessage = (content: string) => {
    if (!selectedConversation) return;
    
    sendMessage.mutate({
      conversationId: selectedConversation,
      content,
    });
  };

  const handleStatusChange = (status: 'resolved' | 'archived') => {
    if (!selectedConversation) return;
    
    updateConversationStatus.mutate({
      id: selectedConversation,
      status,
    });
  };

  // Estado de loading inicial (quando vem do Kanban)
  if (isInitializing || isLoadingConversations) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center h-full bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <Loader2 className="h-12 w-12 text-[hsl(var(--avivar-primary))] animate-spin mb-4" />
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          {initialLeadId ? 'Abrindo conversa do lead...' : 'Carregando conversas...'}
        </p>
      </Card>
    );
  }

  // Estado vazio - sem conversas
  if (conversations.length === 0 && !initialLeadId) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center h-full bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--avivar-primary)/0.1)] flex items-center justify-center mb-6">
          <MessageCircle className="h-10 w-10 text-[hsl(var(--avivar-primary))]" />
        </div>
        <h3 className="text-xl font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
          Nenhuma conversa ainda
        </h3>
        <p className="text-[hsl(var(--avivar-muted-foreground))] max-w-md mb-4">
          As conversas aparecerão aqui quando você iniciar atendimentos via WhatsApp ou Instagram.
        </p>
        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
          💡 Dica: Inicie uma conversa clicando em um lead no Pipeline
        </p>
      </Card>
    );
  }

  return (
    <div className="h-full flex rounded-lg overflow-hidden border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
      {/* Coluna 1: Lista de Conversas */}
      <div className={cn(
        "w-full md:w-[320px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex flex-col",
        selectedConversation && "hidden md:flex"
      )}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {selectedConversation && currentConversation ? (
        <>
          {/* Coluna 2: Detalhes do Lead */}
          <div className="hidden lg:flex w-[300px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex-col overflow-hidden">
            <LeadDetailsSidebar conversation={currentConversation} />
          </div>

          {/* Coluna 3: Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header do chat */}
            <ChatHeader
              conversation={currentConversation}
              onStatusChange={handleStatusChange}
              onBack={() => setSelectedConversation(null)}
              showBackButton
            />

            {/* Área de mensagens */}
            <MessageThread
              messages={messages}
              isLoading={isLoadingMessages}
            />

            {/* Input de mensagem */}
            <MessageInput
              onSend={handleSendMessage}
              disabled={sendMessage.isPending}
              placeholder={`Mensagem para ${currentConversation.lead?.name || 'Lead'}...`}
            />
          </div>
        </>
      ) : (
        /* Estado sem conversa selecionada */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-[hsl(var(--avivar-muted-foreground))] bg-[hsl(var(--avivar-card))]">
          <div className="w-24 h-24 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center mb-6">
            <MessageCircle className="h-12 w-12 opacity-50" />
          </div>
          <p className="text-lg font-medium">Selecione uma conversa</p>
          <p className="text-sm mt-1">Escolha uma conversa na lista à esquerda para visualizar</p>
        </div>
      )}
    </div>
  );
}