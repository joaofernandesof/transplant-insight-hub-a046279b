-- Add expires_at column for pending reservations
ALTER TABLE public.avivar_appointments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient cleanup of expired reservations
CREATE INDEX IF NOT EXISTS idx_avivar_appointments_pending_expires 
ON public.avivar_appointments (status, expires_at) 
WHERE status = 'pending_confirmation';

-- Add comment for documentation
COMMENT ON COLUMN public.avivar_appointments.expires_at IS 'Expiration time for pending_confirmation reservations. After this time, the reservation is considered expired and the slot is freed.';
