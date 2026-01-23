
-- Table for contact requests between users
CREATE TABLE public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (requester_id, target_user_id)
);

-- Table for direct messages between users (community messages)
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_requests
CREATE POLICY "Users can view their own contact requests"
  ON public.contact_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create contact requests"
  ON public.contact_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Target users can update request status"
  ON public.contact_requests FOR UPDATE
  USING (auth.uid() = target_user_id);

-- RLS Policies for community_messages
CREATE POLICY "Users can view their own messages"
  ON public.community_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.community_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
  ON public.community_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;

-- Add indexes for performance
CREATE INDEX idx_contact_requests_requester ON public.contact_requests(requester_id);
CREATE INDEX idx_contact_requests_target ON public.contact_requests(target_user_id);
CREATE INDEX idx_community_messages_recipient ON public.community_messages(recipient_id);
CREATE INDEX idx_community_messages_sender ON public.community_messages(sender_id);
