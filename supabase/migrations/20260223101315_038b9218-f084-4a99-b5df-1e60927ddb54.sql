
-- ============================================
-- Chat Interno do Avivar CRM
-- ============================================

-- Tabela de conversas internas (1:1 ou grupo)
CREATE TABLE public.avivar_internal_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name VARCHAR(100), -- NULL para 1:1, nome do grupo para grupos
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Membros de cada chat
CREATE TABLE public.avivar_internal_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.avivar_internal_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Mensagens
CREATE TABLE public.avivar_internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.avivar_internal_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mentions JSONB DEFAULT '[]'::jsonb,
  reply_to UUID REFERENCES public.avivar_internal_messages(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_internal_chats_account ON public.avivar_internal_chats(account_id);
CREATE INDEX idx_internal_chat_members_user ON public.avivar_internal_chat_members(user_id);
CREATE INDEX idx_internal_chat_members_chat ON public.avivar_internal_chat_members(chat_id);
CREATE INDEX idx_internal_messages_chat ON public.avivar_internal_messages(chat_id, sent_at DESC);
CREATE INDEX idx_internal_messages_sender ON public.avivar_internal_messages(sender_id);

-- Enable RLS
ALTER TABLE public.avivar_internal_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_internal_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_internal_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Chats - members and super admin can see
CREATE POLICY "Members can view their chats" ON public.avivar_internal_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.avivar_internal_chat_members m 
      WHERE m.chat_id = id AND m.user_id = auth.uid() AND m.is_active = true
    )
    OR auth.uid() = '00294ac4-0194-47bc-95ef-6efb83c316f7'::uuid
  );

CREATE POLICY "Account members can create chats" ON public.avivar_internal_chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.avivar_account_members am 
      WHERE am.account_id = avivar_internal_chats.account_id 
      AND am.user_id = auth.uid() AND am.is_active = true
    )
  );

CREATE POLICY "Chat admins can update" ON public.avivar_internal_chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.avivar_internal_chat_members m 
      WHERE m.chat_id = id AND m.user_id = auth.uid() AND m.role = 'admin'
    )
    OR created_by = auth.uid()
  );

-- RLS: Members
CREATE POLICY "Chat members can view members" ON public.avivar_internal_chat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.avivar_internal_chat_members m2 
      WHERE m2.chat_id = chat_id AND m2.user_id = auth.uid() AND m2.is_active = true
    )
    OR auth.uid() = '00294ac4-0194-47bc-95ef-6efb83c316f7'::uuid
  );

CREATE POLICY "Members can be added" ON public.avivar_internal_chat_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.avivar_internal_chat_members m2 
      WHERE m2.chat_id = chat_id AND m2.user_id = auth.uid() AND m2.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.avivar_internal_chats c 
      WHERE c.id = chat_id AND c.created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can update own read status" ON public.avivar_internal_chat_members
  FOR UPDATE USING (user_id = auth.uid());

-- RLS: Messages
CREATE POLICY "Chat members can view messages" ON public.avivar_internal_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.avivar_internal_chat_members m 
      WHERE m.chat_id = avivar_internal_messages.chat_id AND m.user_id = auth.uid() AND m.is_active = true
    )
    OR auth.uid() = '00294ac4-0194-47bc-95ef-6efb83c316f7'::uuid
  );

CREATE POLICY "Chat members can send messages" ON public.avivar_internal_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.avivar_internal_chat_members m 
      WHERE m.chat_id = avivar_internal_messages.chat_id AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

CREATE POLICY "Senders can soft-delete own messages" ON public.avivar_internal_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_internal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_internal_chat_members;

-- Trigger to update chat updated_at on new message
CREATE OR REPLACE FUNCTION public.update_internal_chat_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.avivar_internal_chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_chat_timestamp
  AFTER INSERT ON public.avivar_internal_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_internal_chat_timestamp();

-- Storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('internal-chat-files', 'internal-chat-files', false);

-- Storage RLS - only chat members can upload/read
CREATE POLICY "Chat members can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'internal-chat-files' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Chat members can read files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'internal-chat-files' AND auth.uid() IS NOT NULL
  );
