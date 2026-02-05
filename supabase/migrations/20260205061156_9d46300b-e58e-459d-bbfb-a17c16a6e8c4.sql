-- Add 'processing' status to the check constraint
ALTER TABLE public.avivar_followup_executions 
DROP CONSTRAINT avivar_followup_executions_status_check;

ALTER TABLE public.avivar_followup_executions 
ADD CONSTRAINT avivar_followup_executions_status_check 
CHECK (status IN ('scheduled', 'pending', 'processing', 'sent', 'delivered', 'read', 'responded', 'failed', 'cancelled', 'skipped'));