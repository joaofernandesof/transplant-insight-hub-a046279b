/**
 * CrmInbox - Interface principal de chat do Avivar
 * Layout 3 colunas: Lista de conversas | Detalhes do lead | Chat
 * Suporta initialLeadId para abrir conversa de um lead específico
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Loader2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCrmConversations } from '@/hooks/useCrmConversations';
import { useLeads } from '@/hooks/useLeads';

// Componentes focados
import { ConversationList } from './chat/ConversationList';
import { LeadDetailsSidebar } from './chat/LeadDetailsSidebar';
import { LeadDetailsSidebarStandalone } from './chat/LeadDetailsSidebarStandalone';
import { MessageThread } from './chat/MessageThread';
import { MessageInput } from './chat/MessageInput';
import { ChatHeader } from './chat/ChatHeader';

interface CrmInboxProps {
  initialLeadId?: string;
}

export function CrmInbox({ initialLeadId }: CrmInboxProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showLeadWithoutConversation, setShowLeadWithoutConversation] = useState(false);

  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    sendMessage,
    updateConversationStatus,
    createConversation,
  } = useCrmConversations(selectedConversation || undefined);

  // Fetch lead data directly when we have an initialLeadId
  const { leads, isLoading: isLoadingLeads } = useLeads();
  const directLead = initialLeadId ? leads.find(l => l.id === initialLeadId) : null;

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  // Handle initialLeadId - find existing conversation or show lead panel
  useEffect(() => {
    if (!initialLeadId || isLoadingConversations) return;

    // Find existing conversation for this lead
    const existingConversation = conversations.find(c => c.lead_id === initialLeadId);
    
    if (existingConversation) {
      setSelectedConversation(existingConversation.id);
      setShowLeadWithoutConversation(false);
    } else {
      // No conversation exists - show lead panel without conversation
      setSelectedConversation(null);
      setShowLeadWithoutConversation(true);
    }
  }, [initialLeadId, conversations, isLoadingConversations]);

  const handleSendMessage = async (content: string) => {
    // If we're showing a lead without conversation, create one first
    if (showLeadWithoutConversation && initialLeadId) {
      createConversation.mutate(
        { leadId: initialLeadId, channel: 'whatsapp' },
        {
          onSuccess: (data) => {
            setSelectedConversation(data.id);
            setShowLeadWithoutConversation(false);
            // Now send the message
            sendMessage.mutate({
              conversationId: data.id,
              content,
            });
          },
        }
      );
      return;
    }

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

  // Estado de loading inicial
  if (isLoadingConversations || (initialLeadId && isLoadingLeads)) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center h-full bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <Loader2 className="h-12 w-12 text-[hsl(var(--avivar-primary))] animate-spin mb-4" />
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          {initialLeadId ? 'Carregando lead...' : 'Carregando conversas...'}
        </p>
      </Card>
    );
  }

  // Estado vazio - sem conversas e sem lead selecionado
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

  // Lead novo sem conversa - mostrar layout com painel de edição e chat vazio
  if (showLeadWithoutConversation && directLead) {
    return (
      <div className="h-full flex rounded-lg overflow-hidden border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
        {/* Coluna 1: Lista de Conversas */}
        <div className={cn(
          "w-full md:w-[320px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex flex-col"
        )}>
          <ConversationList
            conversations={conversations}
            selectedId={null}
            onSelect={(id) => {
              setSelectedConversation(id);
              setShowLeadWithoutConversation(false);
            }}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Coluna 2: Detalhes do Lead */}
        <div className="hidden lg:flex w-[300px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex-col overflow-hidden">
          <LeadDetailsSidebarStandalone lead={directLead} />
        </div>

        {/* Coluna 3: Chat vazio */}
        <div className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--avivar-card))]">
          {/* Header simples */}
          <div className="p-4 border-b border-[hsl(var(--avivar-border))] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--avivar-primary)/0.15)] flex items-center justify-center">
              <User className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">{directLead.name}</h3>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Novo lead - Sem conversas anteriores</p>
            </div>
          </div>

          {/* Área de chat vazia */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center mb-6">
              <MessageCircle className="h-10 w-10 text-[hsl(var(--avivar-muted-foreground))] opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-[hsl(var(--avivar-foreground))] mb-2">
              Nenhuma conversa com este lead
            </h3>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] max-w-md">
              Este é um lead novo. Envie uma mensagem para iniciar a conversa ou edite os dados do lead na coluna ao lado.
            </p>
          </div>

          {/* Input de mensagem */}
          <MessageInput
            onSend={handleSendMessage}
            disabled={createConversation.isPending || sendMessage.isPending}
            placeholder={`Iniciar conversa com ${directLead.name}...`}
          />
        </div>
      </div>
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