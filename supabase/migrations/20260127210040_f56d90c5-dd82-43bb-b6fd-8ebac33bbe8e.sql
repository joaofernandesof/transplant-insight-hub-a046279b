-- Add new columns to student_referrals for PIX payment flow
-- contract_value: valor contratado pela indicação para calcular comissão
-- pix_requested_at: quando a pessoa solicitou o PIX
-- pix_request_status: status da solicitação de PIX

ALTER TABLE public.student_referrals 
ADD COLUMN IF NOT EXISTS contract_value NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_request_status TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.student_referrals.contract_value IS 'Valor total do contrato para cálculo da comissão PIX';
COMMENT ON COLUMN public.student_referrals.pix_requested_at IS 'Data/hora em que a comissão PIX foi solicitada';
COMMENT ON COLUMN public.student_referrals.pix_request_status IS 'Status da solicitação: pending, approved, paid';