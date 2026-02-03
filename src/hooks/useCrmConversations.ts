import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CACHE_TIMES, QUERY_KEYS } from '@/lib/queryClient';

export interface CrmMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'audio' | 'document' | null;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  sender_name: string | null;
  sender_user_id: string | null;
  is_ai_generated: boolean;
  created_at: string;
  // Joined data for sender avatar
  sender?: {
    avatar_url: string | null;
    name: string;
  } | null;
}

export interface CrmConversation {
  id: string;
  lead_id: string;
  channel: 'whatsapp' | 'instagram' | 'phone' | 'email' | 'manual';
  status: 'open' | 'pending' | 'resolved' | 'archived';
  last_message_at: string | null;
  unread_count: number;
  assigned_to: string | null;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  lead?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    status: string;
    procedure_interest: string | null;
  };
  messages?: CrmMessage[];
}

export function useCrmConversations(conversationId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription for conversations list (new chats / last_message_at updates)
  useEffect(() => {
    const channel = supabase
      .channel('crm-conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch all conversations with MEDIUM cache
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_conversations')
        .select(`
          *,
          lead:leads(id, name, phone, email, status, procedure_interest)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as CrmConversation[];
    },
    // Use MEDIUM cache for conversations list
    staleTime: CACHE_TIMES.MEDIUM.staleTime,
    gcTime: CACHE_TIMES.MEDIUM.gcTime,
  });

  // Fetch messages for a specific conversation with SHORT cache
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: [...QUERY_KEYS.messages, conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('crm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      
      // Fetch sender info for outbound messages sent by humans
      const messagesWithSenders = await Promise.all(
        (data as CrmMessage[]).map(async (msg) => {
          if (msg.direction === 'outbound' && msg.sender_user_id && !msg.is_ai_generated) {
            // Try to get sender from team members first
            const { data: teamMember } = await supabase
              .from('avivar_team_members')
              .select('name, avatar_url')
              .eq('member_user_id', msg.sender_user_id)
              .single();
            
            if (teamMember) {
              return { ...msg, sender: teamMember };
            }
          }
          return msg;
        })
      );
      
      return messagesWithSenders;
    },
    enabled: !!conversationId,
    // Use SHORT cache for messages - they change often in active conversations
    staleTime: CACHE_TIMES.SHORT.staleTime,
    gcTime: CACHE_TIMES.SHORT.gcTime,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crm-messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Create a new conversation for a lead
  const createConversation = useMutation({
    mutationFn: async ({ leadId, channel }: { leadId: string; channel: CrmConversation['channel'] }) => {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('crm_conversations')
        .select('id')
        .eq('lead_id', leadId)
        .eq('channel', channel)
        .single();

      if (existing) {
        return existing;
      }

      const { data, error } = await supabase
        .from('crm_conversations')
        .insert({
          lead_id: leadId,
          channel,
          assigned_to: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
    },
    onError: () => {
      toast.error('Erro ao iniciar conversa');
    },
  });

  // Send a message via WhatsApp (UazAPI)
  const sendMessage = useMutation({
    mutationFn: async ({
      conversationId,
      content,
      mediaUrl,
      mediaType,
      audioBase64,
    }: {
      conversationId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: CrmMessage['media_type'];
      audioBase64?: string;
    }) => {
      // Call edge function to send via UazAPI
      const { data, error } = await supabase.functions.invoke('avivar-send-message', {
        body: {
          conversationId,
          content,
          mediaUrl,
          mediaType,
          audioBase64,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao enviar mensagem');

      return data.message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      toast.success(variables.audioBase64 ? 'Áudio enviado via WhatsApp' : 'Mensagem enviada via WhatsApp');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    },
  });

  // Update conversation status
  const updateConversationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CrmConversation['status'] }) => {
      const { error } = await supabase
        .from('crm_conversations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      toast.success('Conversa atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar conversa');
    },
  });

  // Toggle AI for a conversation
  const toggleAI = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('crm_conversations')
        .update({ ai_enabled: enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
    },
    onError: () => {
      toast.error('Erro ao alterar configuração de IA');
    },
  });

  // Delete lead with cascade (from chat context)
  const deleteLeadFromChat = useMutation({
    mutationFn: async (conversationId: string) => {
      // First get the lead's phone from the conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation?.lead?.phone) {
        throw new Error('Lead não encontrado');
      }

      // Find kanban lead by phone
      const { data: kanbanLeads, error: findError } = await supabase
        .from('avivar_kanban_leads')
        .select('id, name')
        .eq('phone', conversation.lead.phone)
        .limit(1);

      if (findError) throw findError;
      
      if (!kanbanLeads || kanbanLeads.length === 0) {
        // No kanban lead found, just delete conversation and messages
        await supabase.from('crm_messages').delete().eq('conversation_id', conversationId);
        await supabase.from('crm_conversations').delete().eq('id', conversationId);
        await supabase.from('leads').delete().eq('id', conversation.lead_id);
        return { success: true, lead_name: conversation.lead.name };
      }

      // Use the cascade function
      const { data, error } = await supabase.rpc('delete_avivar_kanban_lead_cascade', {
        p_lead_id: kanbanLeads[0].id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; lead_name?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao excluir lead');
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-contacts'] });
      toast.success(`Lead "${result?.lead_name}" excluído com sucesso!`);
    },
    onError: (error) => {
      console.error('Error deleting lead from chat:', error);
      toast.error('Erro ao excluir lead');
    },
  });

  // Stats
  const openConversations = conversations.filter(c => c.status === 'open');
  const pendingConversations = conversations.filter(c => c.status === 'pending');
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  return {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    openConversations,
    pendingConversations,
    totalUnread,
    createConversation,
    sendMessage,
    updateConversationStatus,
    toggleAI,
    deleteLeadFromChat,
  };
}
