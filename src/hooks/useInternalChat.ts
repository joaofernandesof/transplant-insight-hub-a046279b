/**
 * useInternalChat - Hook completo para o chat interno do Avivar CRM
 * Gerencia chats, mensagens, membros e realtime
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { useQueryClient } from '@tanstack/react-query';

// Types
export interface InternalChat {
  id: string;
  account_id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed
  members?: ChatMember[];
  last_message?: InternalMessage | null;
  unread_count?: number;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'admin' | 'member';
  last_read_at: string | null;
  is_active: boolean;
  created_at: string;
  // Joined
  profile_name?: string;
  avatar_url?: string;
}

export interface InternalMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mentions: { type: 'user' | 'lead'; id: string; name: string }[];
  reply_to: string | null;
  is_deleted: boolean;
  sent_at: string;
  // Computed
  sender_name?: string;
  sender_avatar?: string;
}

export interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

export function useInternalChat() {
  const { user, session } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const authUserId = session?.user?.id;

  const [chats, setChats] = useState<InternalChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const profilesCache = useRef<Record<string, { name: string; avatar: string | null }>>({});

  // Fetch profiles for user IDs
  const fetchProfiles = useCallback(async (userIds: string[]) => {
    const missing = userIds.filter(id => !profilesCache.current[id]);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', missing);

    data?.forEach(p => {
      profilesCache.current[p.user_id] = { name: p.name || 'Usuário', avatar: p.avatar_url };
    });
  }, []);

  // Fetch team members for the account
  const fetchTeamMembers = useCallback(async () => {
    if (!accountId) return;
    const { data } = await supabase
      .from('avivar_account_members')
      .select('user_id, role')
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (!data) return;
    const userIds = data.map(m => m.user_id);
    await fetchProfiles(userIds);

    setTeamMembers(data.map(m => ({
      user_id: m.user_id,
      full_name: profilesCache.current[m.user_id]?.name || 'Usuário',
      avatar_url: profilesCache.current[m.user_id]?.avatar || null,
      role: m.role,
    })));
  }, [accountId, fetchProfiles]);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    if (!authUserId) return;
    setIsLoading(true);

    try {
      // Get chats
      const { data: chatData } = await supabase
        .from('avivar_internal_chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!chatData) { setIsLoading(false); return; }

      // Get members for all chats
      const chatIds = chatData.map(c => c.id);
      const { data: membersData } = await supabase
        .from('avivar_internal_chat_members')
        .select('*')
        .in('chat_id', chatIds)
        .eq('is_active', true);

      // Get last message for each chat
      const enrichedChats: InternalChat[] = [];
      const allUserIds = new Set<string>();
      
      membersData?.forEach(m => allUserIds.add(m.user_id));
      chatData.forEach(c => allUserIds.add(c.created_by));
      
      await fetchProfiles(Array.from(allUserIds));

      // Get last messages
      for (const chat of chatData) {
        const chatMembers = (membersData || []).filter(m => m.chat_id === chat.id);
        const myMembership = chatMembers.find(m => m.user_id === authUserId);

        // Get last message
        const { data: lastMsgData } = await supabase
          .from('avivar_internal_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('sent_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMsgData?.[0] || null;

        // Calculate unread count
        let unreadCount = 0;
        if (myMembership) {
          const { count } = await supabase
            .from('avivar_internal_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .gt('sent_at', myMembership.last_read_at || '1970-01-01');

          unreadCount = count || 0;
        }

        enrichedChats.push({
          ...chat,
          type: chat.type as 'direct' | 'group',
          members: chatMembers.map(m => ({
            ...m,
            role: m.role as 'admin' | 'member',
            profile_name: profilesCache.current[m.user_id]?.name,
            avatar_url: profilesCache.current[m.user_id]?.avatar || undefined,
          })),
          last_message: lastMessage ? {
            ...lastMessage,
            message_type: lastMessage.message_type as InternalMessage['message_type'],
            mentions: (lastMessage.mentions as any) || [],
            sender_name: profilesCache.current[lastMessage.sender_id]?.name,
          } : null,
          unread_count: unreadCount,
        });
      }

      setChats(enrichedChats);
      setTotalUnread(enrichedChats.reduce((sum, c) => sum + (c.unread_count || 0), 0));
    } finally {
      setIsLoading(false);
    }
  }, [authUserId, fetchProfiles]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data } = await supabase
        .from('avivar_internal_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true })
        .limit(200);

      if (!data) return;

      const senderIds = [...new Set(data.map(m => m.sender_id))];
      await fetchProfiles(senderIds);

      setMessages(data.map(m => ({
        ...m,
        message_type: m.message_type as InternalMessage['message_type'],
        mentions: (m.mentions as any) || [],
        sender_name: profilesCache.current[m.sender_id]?.name,
        sender_avatar: profilesCache.current[m.sender_id]?.avatar || undefined,
      })));

      // Mark as read
      if (authUserId) {
        await supabase
          .from('avivar_internal_chat_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('chat_id', chatId)
          .eq('user_id', authUserId);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [authUserId, fetchProfiles]);

  // Send message
  const sendMessage = useCallback(async (params: {
    chatId: string;
    content: string;
    messageType?: InternalMessage['message_type'];
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mentions?: InternalMessage['mentions'];
    replyTo?: string;
  }) => {
    if (!authUserId) return false;

    const { error } = await supabase
      .from('avivar_internal_messages')
      .insert({
        chat_id: params.chatId,
        sender_id: authUserId,
        content: params.content,
        message_type: params.messageType || 'text',
        file_url: params.fileUrl || null,
        file_name: params.fileName || null,
        file_size: params.fileSize || null,
        mentions: params.mentions || [],
        reply_to: params.replyTo || null,
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }
    return true;
  }, [authUserId]);

  // Create chat (direct or group)
  const createChat = useCallback(async (params: {
    type: 'direct' | 'group';
    memberIds: string[];
    name?: string;
  }) => {
    if (!authUserId || !accountId) return null;

    // For direct chats, check if one already exists
    if (params.type === 'direct' && params.memberIds.length === 1) {
      const existingChat = chats.find(c =>
        c.type === 'direct' &&
        c.members?.some(m => m.user_id === params.memberIds[0]) &&
        c.members?.some(m => m.user_id === authUserId)
      );
      if (existingChat) return existingChat.id;
    }

    // Create the chat
    const { data: chatData, error: chatError } = await supabase
      .from('avivar_internal_chats')
      .insert({
        account_id: accountId,
        type: params.type,
        name: params.name || null,
        created_by: authUserId,
      })
      .select()
      .single();

    if (chatError || !chatData) {
      console.error('Error creating chat:', chatError);
      return null;
    }

    // Add creator as admin
    const memberInserts = [
      { chat_id: chatData.id, user_id: authUserId, role: 'admin' },
      ...params.memberIds
        .filter(id => id !== authUserId)
        .map(id => ({ chat_id: chatData.id, user_id: id, role: 'member' as const })),
    ];

    await supabase.from('avivar_internal_chat_members').insert(memberInserts);

    // Send system message for groups
    if (params.type === 'group') {
      await supabase.from('avivar_internal_messages').insert({
        chat_id: chatData.id,
        sender_id: authUserId,
        content: `Grupo "${params.name}" criado`,
        message_type: 'system',
      });
    }

    await fetchChats();
    return chatData.id;
  }, [authUserId, accountId, chats, fetchChats]);

  // Upload file
  const uploadFile = useCallback(async (file: File, chatId: string) => {
    if (!authUserId) return null;
    const path = `${chatId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('internal-chat-files')
      .upload(path, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('internal-chat-files')
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
    };
  }, [authUserId]);

  // Open chat
  const openChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    fetchMessages(chatId);
  }, [fetchMessages]);

  // Close chat
  const closeChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
  }, []);

  // Active chat data
  const activeChat = useMemo(
    () => chats.find(c => c.id === activeChatId) || null,
    [chats, activeChatId]
  );

  // Get display name for a chat
  const getChatDisplayName = useCallback((chat: InternalChat) => {
    if (chat.type === 'group') return chat.name || 'Grupo';
    const otherMember = chat.members?.find(m => m.user_id !== authUserId);
    return otherMember?.profile_name || 'Chat';
  }, [authUserId]);

  // Get avatar for a chat
  const getChatAvatar = useCallback((chat: InternalChat) => {
    if (chat.type === 'group') return chat.avatar_url;
    const otherMember = chat.members?.find(m => m.user_id !== authUserId);
    return otherMember?.avatar_url || null;
  }, [authUserId]);

  // Initial load
  useEffect(() => {
    if (authUserId && accountId) {
      fetchChats();
      fetchTeamMembers();
    }
  }, [authUserId, accountId, fetchChats, fetchTeamMembers]);

  // Realtime: new messages
  useEffect(() => {
    if (!authUserId) return;

    const channel = supabase
      .channel('internal-chat-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'avivar_internal_messages' },
        async (payload) => {
          const newMsg = payload.new as any;
          await fetchProfiles([newMsg.sender_id]);

          const enrichedMsg: InternalMessage = {
            ...newMsg,
            message_type: newMsg.message_type,
            mentions: newMsg.mentions || [],
            sender_name: profilesCache.current[newMsg.sender_id]?.name,
            sender_avatar: profilesCache.current[newMsg.sender_id]?.avatar || undefined,
          };

          // If it's the active chat, add to messages
          if (newMsg.chat_id === activeChatId) {
            setMessages(prev => [...prev, enrichedMsg]);
            // Mark as read immediately
            await supabase
              .from('avivar_internal_chat_members')
              .update({ last_read_at: new Date().toISOString() })
              .eq('chat_id', newMsg.chat_id)
              .eq('user_id', authUserId);
          }

          // Update chat list (move to top, update last message, unread count)
          setChats(prev => {
            const updated = prev.map(c => {
              if (c.id !== newMsg.chat_id) return c;
              const isActive = newMsg.chat_id === activeChatId;
              return {
                ...c,
                updated_at: newMsg.sent_at,
                last_message: enrichedMsg,
                unread_count: isActive ? 0 : (c.unread_count || 0) + (newMsg.sender_id !== authUserId ? 1 : 0),
              };
            });
            return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          });

          // Update total unread
          if (newMsg.sender_id !== authUserId && newMsg.chat_id !== activeChatId) {
            setTotalUnread(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authUserId, activeChatId, fetchProfiles]);

  return {
    chats,
    activeChat,
    activeChatId,
    messages,
    teamMembers,
    isLoading,
    isLoadingMessages,
    totalUnread,
    openChat,
    closeChat,
    sendMessage,
    createChat,
    uploadFile,
    getChatDisplayName,
    getChatAvatar,
    fetchChats,
  };
}
