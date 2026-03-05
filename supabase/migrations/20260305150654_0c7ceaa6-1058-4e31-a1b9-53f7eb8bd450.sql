-- Add attendance mode and chatbot flows to avivar_agents
ALTER TABLE public.avivar_agents 
ADD COLUMN IF NOT EXISTS attendance_mode text NOT NULL DEFAULT 'humanized',
ADD COLUMN IF NOT EXISTS chatbot_flows jsonb DEFAULT '[]'::jsonb;

-- Add chatbot state tracking to crm_conversations
ALTER TABLE public.crm_conversations 
ADD COLUMN IF NOT EXISTS current_chatbot_node_id text,
ADD COLUMN IF NOT EXISTS attendance_mode_override text;