/**
 * CrmInbox - Interface principal de chat do Avivar
 * Layout 3 colunas: Lista de conversas | Detalhes do lead | Chat
 * Suporta initialLeadId para abrir conversa de um lead específico
 * Agora busca leads de avivar_patient_journeys (Kanban Comercial/Pós-Venda)
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Loader2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCrmConversations } from '@/hooks/useCrmConversations';
import { usePatientJourneys } from '@/pages/avivar/journey/hooks/usePatientJourneys';

// Componentes focados
import { ConversationList } from './chat/ConversationList';
import { LeadDetailsSidebar } from './chat/LeadDetailsSidebar';
import { PatientJourneyDetailsSidebar } from './chat/PatientJourneyDetailsSidebar';
import { MessageThread } from './chat/MessageThread';
import { MessageInput } from './chat/MessageInput';
import { ChatHeader } from './chat/ChatHeader';

interface CrmInboxProps {
  initialLeadId?: string;
  initialPhone?: string;
}

export function CrmInbox({ initialLeadId, initialPhone }: CrmInboxProps) {
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
    toggleAI,
    deleteLeadFromChat,
  } = useCrmConversations(selectedConversation || undefined);

  // Fetch journeys from avivar_patient_journeys (Kanban table)
  const { journeys, isLoading: isLoadingJourneys } = usePatientJourneys();
  const directJourney = initialLeadId ? journeys.find(j => j.id === initialLeadId) : null;

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  // Handle initialPhone - find conversation by phone number
  useEffect(() => {
    if (!initialPhone || isLoadingConversations) return;
    
    // Normalize phone for comparison (remove non-digits)
    const normalizedPhone = initialPhone.replace(/\D/g, '');
    
    // Find conversation where the lead has matching phone
    const conversationByPhone = conversations.find(c => {
      const leadPhone = c.lead?.phone?.replace(/\D/g, '');
      return leadPhone && (leadPhone === normalizedPhone || leadPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(leadPhone));
    });
    
    if (conversationByPhone) {
      setSelectedConversation(conversationByPhone.id);
      setShowLeadWithoutConversation(false);
    }
  }, [initialPhone, conversations, isLoadingConversations]);

  // Handle initialLeadId - find existing conversation or show lead panel
  // The initialLeadId can be either a journey id (from avivar_patient_journeys) or a lead id
  useEffect(() => {
    if (!initialLeadId || isLoadingConversations || isLoadingJourneys) return;

    // First: Check if there's a conversation directly linked to this ID as lead_id
    const existingConversationByLeadId = conversations.find(c => c.lead_id === initialLeadId);
    
    if (existingConversationByLeadId) {
      setSelectedConversation(existingConversationByLeadId.id);
      setShowLeadWithoutConversation(false);
      return;
    }

    // Second: If initialLeadId is a journey, find conversation by matching phone number
    const journey = journeys.find(j => j.id === initialLeadId);
    if (journey?.patient_phone) {
      // Find conversation where the lead has the same phone as the journey
      const conversationByPhone = conversations.find(c => 
        c.lead?.phone === journey.patient_phone
      );
      
      if (conversationByPhone) {
        setSelectedConversation(conversationByPhone.id);
        setShowLeadWithoutConversation(false);
        return;
      }
    }

    // No conversation exists - show lead panel without conversation
    setSelectedConversation(null);
    setShowLeadWithoutConversation(true);
  }, [initialLeadId, conversations, isLoadingConversations, isLoadingJourneys, journeys]);

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

  // Convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!selectedConversation) return;
    
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      
      sendMessage.mutate({
        conversationId: selectedConversation,
        audioBase64,
      });
    } catch (error) {
      console.error('Error converting audio:', error);
    }
  };

  const handleSendImage = async (imageBase64: string, caption?: string) => {
    if (!selectedConversation) return;
    
    sendMessage.mutate({
      conversationId: selectedConversation,
      imageBase64,
      caption,
    });
  };

  const handleSendVideo = async (videoBase64: string, caption?: string) => {
    if (!selectedConversation) return;
    
    sendMessage.mutate({
      conversationId: selectedConversation,
      videoBase64,
      caption,
    });
  };

  const handleSendDocument = async (documentBase64: string, documentName: string, caption?: string) => {
    if (!selectedConversation) return;
    
    sendMessage.mutate({
      conversationId: selectedConversation,
      documentBase64,
      documentName,
      caption,
    });
  };

  const handleStatusChange = (status: 'resolved' | 'archived') => {
    if (!selectedConversation) return;
    
    updateConversationStatus.mutate({
      id: selectedConversation,
      status,
    });
  };

  const handleAIToggle = (enabled: boolean) => {
    if (!selectedConversation) return;
    toggleAI.mutate({ id: selectedConversation, enabled });
  };

  const handleDeleteLead = () => {
    if (!selectedConversation) return;
    
    if (confirm('Tem certeza que deseja excluir este lead? Todas as mensagens e conversas serão apagadas. O contato será preservado.')) {
      deleteLeadFromChat.mutate(selectedConversation, {
        onSuccess: () => {
          setSelectedConversation(null);
        }
      });
    }
  };

  // Estado de loading inicial
  if (isLoadingConversations || (initialLeadId && isLoadingJourneys)) {
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
  if (showLeadWithoutConversation && directJourney) {
    return (
      <div className="h-full max-h-full flex rounded-lg overflow-hidden border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
        {/* Coluna 1: Lista de Conversas - scroll independente */}
        <div className="w-full md:w-[320px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex flex-col min-h-0 max-h-full overflow-hidden">
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

        {/* Coluna 2: Detalhes do Lead (Patient Journey) - scroll independente */}
        <div className="hidden lg:flex w-[300px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex-col min-h-0 max-h-full overflow-hidden">
          <PatientJourneyDetailsSidebar journey={directJourney} />
        </div>

        {/* Coluna 3: Chat vazio - scroll independente */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 max-h-full overflow-hidden bg-[hsl(var(--avivar-card))]">
          {/* Header simples - fixo */}
          <div className="p-4 border-b border-[hsl(var(--avivar-border))] flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--avivar-primary)/0.15)] flex items-center justify-center">
              <User className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">{directJourney.patient_name}</h3>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Novo lead - Sem conversas anteriores</p>
            </div>
          </div>

          {/* Área de chat vazia com mensagem UX - flex-1 para ocupar espaço disponível */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-0 overflow-auto">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center mb-6">
              <MessageCircle className="h-10 w-10 text-[hsl(var(--avivar-muted-foreground))] opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-[hsl(var(--avivar-foreground))] mb-2">
              Este lead ainda não possui conversas registradas
            </h3>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] max-w-md">
              Inicie o atendimento para começar o histórico. Você pode editar os dados do lead na coluna ao lado.
            </p>
          </div>

          {/* Input de mensagem - fixo no bottom */}
          <div className="shrink-0">
            <MessageInput
              onSend={handleSendMessage}
              disabled={createConversation.isPending || sendMessage.isPending}
              placeholder={`Iniciar conversa com ${directJourney.patient_name}...`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-full flex rounded-lg overflow-hidden border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
      {/* Coluna 1: Lista de Conversas - scroll independente */}
      <div className={cn(
        "w-full md:w-[320px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex flex-col min-h-0 max-h-full overflow-hidden",
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
          {/* Coluna 2: Detalhes do Lead - scroll independente */}
          <div className="hidden lg:flex w-[300px] shrink-0 border-r border-[hsl(var(--avivar-border))] flex-col min-h-0 max-h-full overflow-hidden">
            <LeadDetailsSidebar conversation={currentConversation} />
          </div>

          {/* Coluna 3: Chat - scroll independente */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 max-h-full overflow-hidden">
            {/* Header do chat - fixo */}
            <div className="shrink-0">
              <ChatHeader
                conversation={currentConversation}
                onStatusChange={handleStatusChange}
                onAIToggle={handleAIToggle}
                onDeleteLead={handleDeleteLead}
                isDeletingLead={deleteLeadFromChat.isPending}
                onBack={() => setSelectedConversation(null)}
                showBackButton
              />
            </div>

            {/* Área de mensagens - scroll independente */}
            <MessageThread
              messages={messages}
              isLoading={isLoadingMessages}
            />

            {/* Input de mensagem - fixo no bottom */}
            <div className="shrink-0">
              <MessageInput
                onSend={handleSendMessage}
                onSendAudio={handleSendAudio}
                onSendImage={handleSendImage}
                onSendVideo={handleSendVideo}
                onSendDocument={handleSendDocument}
                disabled={sendMessage.isPending}
                placeholder={`Mensagem para ${currentConversation.lead?.name || 'Lead'}...`}
              />
            </div>
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