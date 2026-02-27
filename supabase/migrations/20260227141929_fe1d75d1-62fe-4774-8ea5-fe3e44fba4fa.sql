
ALTER TABLE public.crm_conversations 
ADD COLUMN IF NOT EXISTS ai_processing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_ai_processed_at timestamptz;
