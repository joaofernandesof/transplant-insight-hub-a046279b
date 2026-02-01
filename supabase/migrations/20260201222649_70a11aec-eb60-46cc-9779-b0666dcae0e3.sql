-- Add batch control fields to crm_conversations for message debouncing
ALTER TABLE public.crm_conversations 
ADD COLUMN IF NOT EXISTS pending_batch_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient batch lookups
CREATE INDEX IF NOT EXISTS idx_crm_conversations_pending_batch 
ON public.crm_conversations (pending_batch_id) 
WHERE pending_batch_id IS NOT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.crm_conversations.pending_batch_id IS 'UUID of current pending message batch awaiting AI response';
COMMENT ON COLUMN public.crm_conversations.pending_until IS 'Timestamp when the batch should be processed (30s debounce)';