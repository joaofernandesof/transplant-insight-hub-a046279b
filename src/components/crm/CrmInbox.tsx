/**
 * CrmInbox - Interface principal de chat do Avivar
 * Layout: Lista de conversas | Detalhes do lead | Histórico de mensagens
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCrmConversations } from '@/hooks/useCrmConversations';

// Componentes focados
import { ConversationList } from './chat/ConversationList';
import { LeadDetailsSidebar } from './chat/LeadDetailsSidebar';
import { MessageThread } from './chat/MessageThread';
import { MessageInput } from './chat/MessageInput';
import { ChatHeader } from './chat/ChatHeader';

export function CrmInbox() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showLeadDetails, setShowLeadDetails] = useState(true);

  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    sendMessage,
    updateConversationStatus,
  } = useCrmConversations(selectedConversation || undefined);

  const currentConversation = conversations.find(c => c.id === selectedConversation);

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

  // Estado vazio - sem conversas
  if (!isLoadingConversations && conversations.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center h-[calc(100vh-12rem)] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
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
    <div className="h-[calc(100vh-12rem)] flex rounded-lg overflow-hidden border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
      {/* Coluna 1: Lista de Conversas */}
      <div className={cn(
        "w-full md:w-[350px] shrink-0 border-r border-[hsl(var(--avivar-border))]",
        selectedConversation && "hidden md:block"
      )}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Coluna 2: Painel de Chat */}
      {selectedConversation && currentConversation ? (
        <>
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header do chat */}
            <ChatHeader
              conversation={currentConversation}
              onStatusChange={handleStatusChange}
              onBack={() => setSelectedConversation(null)}
              showBackButton
            />

            {/* Toggle para mostrar/ocultar detalhes do lead */}
            <div className="flex items-center justify-end px-2 py-1 border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadDetails(!showLeadDetails)}
                className="text-xs text-[hsl(var(--avivar-muted-foreground))] gap-1"
              >
                {showLeadDetails ? (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    Ocultar detalhes
                  </>
                ) : (
                  <>
                    <PanelLeft className="h-4 w-4" />
                    Mostrar detalhes
                  </>
                )}
              </Button>
            </div>

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

          {/* Coluna 3: Detalhes do Lead (sidebar direita) */}
          {showLeadDetails && (
            <div className="hidden lg:block w-[300px] shrink-0">
              <LeadDetailsSidebar conversation={currentConversation} />
            </div>
          )}
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
