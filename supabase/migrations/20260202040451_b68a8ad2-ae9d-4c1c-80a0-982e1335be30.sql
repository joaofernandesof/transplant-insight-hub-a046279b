-- Add sender_user_id to track which team member sent the message
ALTER TABLE public.crm_messages 
ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_crm_messages_sender_user_id ON public.crm_messages(sender_user_id);