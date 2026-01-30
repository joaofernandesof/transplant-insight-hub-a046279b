-- Tabela para armazenar sessões de integração WhatsApp por usuário
CREATE TABLE public.avivar_whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instance_id TEXT NOT NULL UNIQUE,
  session_name TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'qr_code', 'connected', 'error')),
  qr_code TEXT,
  qr_code_expires_at TIMESTAMP WITH TIME ZONE,
  phone_number TEXT,
  phone_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  webhook_url TEXT,
  settings JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_sessions_user_id ON public.avivar_whatsapp_sessions(user_id);
CREATE INDEX idx_whatsapp_sessions_status ON public.avivar_whatsapp_sessions(status);
CREATE INDEX idx_whatsapp_sessions_instance_id ON public.avivar_whatsapp_sessions(instance_id);

-- Enable RLS
ALTER TABLE public.avivar_whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own WhatsApp sessions"
  ON public.avivar_whatsapp_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp sessions"
  ON public.avivar_whatsapp_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp sessions"
  ON public.avivar_whatsapp_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp sessions"
  ON public.avivar_whatsapp_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Tabela para mensagens sincronizadas do WhatsApp
CREATE TABLE public.avivar_whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.avivar_whatsapp_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_id TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL DEFAULT false,
  contact_name TEXT,
  contact_phone TEXT,
  content TEXT,
  media_type TEXT CHECK (media_type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact')),
  media_url TEXT,
  media_mime_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'received' CHECK (status IN ('sent', 'received', 'delivered', 'read', 'failed')),
  is_group BOOLEAN DEFAULT false,
  group_name TEXT,
  quoted_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  synced_to_crm BOOLEAN DEFAULT false,
  crm_conversation_id UUID REFERENCES public.crm_conversations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mensagens
CREATE INDEX idx_whatsapp_messages_session_id ON public.avivar_whatsapp_messages(session_id);
CREATE INDEX idx_whatsapp_messages_user_id ON public.avivar_whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_remote_jid ON public.avivar_whatsapp_messages(remote_jid);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.avivar_whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_messages_message_id ON public.avivar_whatsapp_messages(message_id);
CREATE UNIQUE INDEX idx_whatsapp_messages_unique ON public.avivar_whatsapp_messages(session_id, message_id);

-- Enable RLS
ALTER TABLE public.avivar_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mensagens
CREATE POLICY "Users can view their own WhatsApp messages"
  ON public.avivar_whatsapp_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp messages"
  ON public.avivar_whatsapp_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp messages"
  ON public.avivar_whatsapp_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela de contatos sincronizados do WhatsApp
CREATE TABLE public.avivar_whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.avivar_whatsapp_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  jid TEXT NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  push_name TEXT,
  profile_picture_url TEXT,
  is_business BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  synced_to_crm BOOLEAN DEFAULT false,
  crm_lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para contatos
CREATE INDEX idx_whatsapp_contacts_session_id ON public.avivar_whatsapp_contacts(session_id);
CREATE INDEX idx_whatsapp_contacts_user_id ON public.avivar_whatsapp_contacts(user_id);
CREATE INDEX idx_whatsapp_contacts_jid ON public.avivar_whatsapp_contacts(jid);
CREATE UNIQUE INDEX idx_whatsapp_contacts_unique ON public.avivar_whatsapp_contacts(session_id, jid);

-- Enable RLS
ALTER TABLE public.avivar_whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contatos
CREATE POLICY "Users can view their own WhatsApp contacts"
  ON public.avivar_whatsapp_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp contacts"
  ON public.avivar_whatsapp_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp contacts"
  ON public.avivar_whatsapp_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_whatsapp_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_whatsapp_sessions_updated_at
  BEFORE UPDATE ON public.avivar_whatsapp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_session_updated_at();

CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.avivar_whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_session_updated_at();

-- Enable realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_whatsapp_sessions;