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
  created_at: string;
}

export interface CrmConversation {
  id: string;
  lead_id: string;
  channel: 'whatsapp' | 'instagram' | 'phone' | 'email' | 'manual';
  status: 'open' | 'pending' | 'resolved' | 'archived';
  last_message_at: string | null;
  unread_count: number;
  assigned_to: string | null;
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
      return data as CrmMessage[];
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

  // Send a message
  const sendMessage = useMutation({
    mutationFn: async ({
      conversationId,
      content,
      mediaUrl,
      mediaType,
    }: {
      conversationId: string;
      content: string;
      mediaUrl?: string;
      mediaType?: CrmMessage['media_type'];
    }) => {
      const { data, error } = await supabase
        .from('crm_messages')
        .insert({
          conversation_id: conversationId,
          direction: 'outbound',
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          sender_name: user?.email?.split('@')[0] || 'Operador',
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('crm_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          status: 'pending',
        })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      toast.success('Mensagem enviada');
    },
    onError: () => {
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
  };
}
