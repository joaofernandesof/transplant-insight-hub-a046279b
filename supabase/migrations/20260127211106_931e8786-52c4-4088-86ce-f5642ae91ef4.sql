-- Add partner fields to contracts table for supporting multiple partners
ALTER TABLE public.ipromed_contracts
ADD COLUMN IF NOT EXISTS partner1_client_id UUID REFERENCES public.ipromed_legal_clients(id),
ADD COLUMN IF NOT EXISTS partner2_client_id UUID REFERENCES public.ipromed_legal_clients(id);

-- Add partner reference field to clients table
ALTER TABLE public.ipromed_legal_clients
ADD COLUMN IF NOT EXISTS partner_client_id UUID REFERENCES public.ipromed_legal_clients(id),
ADD COLUMN IF NOT EXISTS shared_contract_id UUID REFERENCES public.ipromed_contracts(id);

COMMENT ON COLUMN public.ipromed_contracts.partner1_client_id IS 'First partner/client linked to this contract';
COMMENT ON COLUMN public.ipromed_contracts.partner2_client_id IS 'Second partner/client linked to this contract (for joint contracts)';
COMMENT ON COLUMN public.ipromed_legal_clients.partner_client_id IS 'Reference to partner client if this is a joint contract situation';
COMMENT ON COLUMN public.ipromed_legal_clients.shared_contract_id IS 'Reference to shared contract between partners';