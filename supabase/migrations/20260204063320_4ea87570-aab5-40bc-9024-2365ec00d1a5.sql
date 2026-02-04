-- Add participants column to meetings table
ALTER TABLE public.ipromed_client_meetings 
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;

-- Create comment for documentation
COMMENT ON COLUMN public.ipromed_client_meetings.participants IS 'Array of participant objects: [{id, name, email, type: "client"|"team"|"partner"}]';