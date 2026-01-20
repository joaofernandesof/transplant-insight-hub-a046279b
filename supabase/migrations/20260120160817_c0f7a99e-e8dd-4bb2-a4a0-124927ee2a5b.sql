-- =====================================================
-- CRM Médico Neo - Database Schema
-- =====================================================

-- 1. Lead Tasks/Follow-ups Table
CREATE TABLE public.lead_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CRM Conversations Table (simulated inbox)
CREATE TABLE public.crm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'phone', 'email', 'manual')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'archived')),
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CRM Messages Table
CREATE TABLE public.crm_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  sender_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_tasks
CREATE POLICY "Users can view all lead tasks" 
  ON public.lead_tasks FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert lead tasks" 
  ON public.lead_tasks FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update lead tasks" 
  ON public.lead_tasks FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete lead tasks" 
  ON public.lead_tasks FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for crm_conversations
CREATE POLICY "Users can view all conversations" 
  ON public.crm_conversations FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert conversations" 
  ON public.crm_conversations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update conversations" 
  ON public.crm_conversations FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete conversations" 
  ON public.crm_conversations FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for crm_messages
CREATE POLICY "Users can view all messages" 
  ON public.crm_messages FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert messages" 
  ON public.crm_messages FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update messages" 
  ON public.crm_messages FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_lead_tasks_lead_id ON public.lead_tasks(lead_id);
CREATE INDEX idx_lead_tasks_due_at ON public.lead_tasks(due_at);
CREATE INDEX idx_lead_tasks_assigned_to ON public.lead_tasks(assigned_to);
CREATE INDEX idx_crm_conversations_lead_id ON public.crm_conversations(lead_id);
CREATE INDEX idx_crm_conversations_status ON public.crm_conversations(status);
CREATE INDEX idx_crm_messages_conversation_id ON public.crm_messages(conversation_id);

-- Triggers for updated_at
CREATE TRIGGER update_lead_tasks_updated_at
  BEFORE UPDATE ON public.lead_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_conversations_updated_at
  BEFORE UPDATE ON public.crm_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_messages;