-- Create table to track staff system access permissions
CREATE TABLE public.staff_system_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neohub_user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  
  -- Work info
  city TEXT,
  contract_type TEXT, -- CLT, CNPJ, SÓCIO
  job_title TEXT,
  department TEXT,
  
  -- Corporate contact
  corporate_email_domain TEXT,
  corporate_email_gmail TEXT,
  corporate_phone TEXT,
  
  -- Personal contact
  personal_email TEXT,
  personal_phone TEXT,
  
  -- Documents
  cpf_hash TEXT, -- Store hashed for privacy
  council_document TEXT, -- COREN, CRM, CRF etc
  cnpj TEXT,
  company_name TEXT,
  
  -- Address
  address_street TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_cep TEXT,
  
  -- Contract dates
  birth_date DATE,
  contract_start DATE,
  contract_end DATE,
  contract_days INTEGER,
  
  -- Benefits
  has_contract BOOLEAN DEFAULT false,
  has_health_plan BOOLEAN DEFAULT false,
  health_plan_deadline DATE,
  
  -- System access tracking (SIM / NÃO / PENDENTE / NÃO PRECISA)
  access_whatsapp_groups TEXT DEFAULT 'PENDENTE',
  access_gmail_corp TEXT DEFAULT 'PENDENTE',
  access_gmail_domain TEXT DEFAULT 'PENDENTE',
  access_google_drive TEXT DEFAULT 'PENDENTE',
  access_chip_corp TEXT DEFAULT 'PENDENTE',
  access_fireflies TEXT DEFAULT 'PENDENTE',
  access_kommo TEXT DEFAULT 'PENDENTE',
  access_clickup TEXT DEFAULT 'PENDENTE',
  access_conta_azul TEXT DEFAULT 'PENDENTE',
  access_saude_service TEXT DEFAULT 'PENDENTE',
  access_bling TEXT DEFAULT 'PENDENTE',
  access_feegow TEXT DEFAULT 'PENDENTE',
  access_shosp TEXT DEFAULT 'PENDENTE',
  access_instagram_neofolic TEXT DEFAULT 'PENDENTE',
  access_instagram_ibramec TEXT DEFAULT 'PENDENTE',
  access_instagram_hygor TEXT DEFAULT 'PENDENTE',
  access_instagram_patrick TEXT DEFAULT 'PENDENTE',
  access_linkedin_ibramec TEXT DEFAULT 'PENDENTE',
  access_linkedin_neofolic TEXT DEFAULT 'PENDENTE',
  access_clicksign TEXT DEFAULT 'PENDENTE',
  access_bubble TEXT DEFAULT 'PENDENTE',
  access_canva TEXT DEFAULT 'PENDENTE',
  access_stripe TEXT DEFAULT 'PENDENTE',
  access_notion TEXT DEFAULT 'PENDENTE',
  access_pluga TEXT DEFAULT 'PENDENTE',
  access_pluxee TEXT DEFAULT 'PENDENTE',
  access_tiktok_neofolic TEXT DEFAULT 'PENDENTE',
  access_tiktok_ibramec TEXT DEFAULT 'PENDENTE',
  access_zapier TEXT DEFAULT 'PENDENTE',
  access_wordpress_ibramec TEXT DEFAULT 'PENDENTE',
  access_wordpress_neofolic TEXT DEFAULT 'PENDENTE',
  access_beeviral TEXT DEFAULT 'PENDENTE',
  access_capcut TEXT DEFAULT 'PENDENTE',
  access_cloudflare TEXT DEFAULT 'PENDENTE',
  access_conecta_capilar TEXT DEFAULT 'PENDENTE',
  access_godaddy TEXT DEFAULT 'PENDENTE',
  access_mailchimp TEXT DEFAULT 'PENDENTE',
  access_make TEXT DEFAULT 'PENDENTE',
  access_reportei TEXT DEFAULT 'PENDENTE',
  access_manychat TEXT DEFAULT 'PENDENTE',
  access_nuvem_hospedagem TEXT DEFAULT 'PENDENTE',
  access_panda_video TEXT DEFAULT 'PENDENTE',
  access_reclame_aqui TEXT DEFAULT 'PENDENTE',
  access_registro_br TEXT DEFAULT 'PENDENTE',
  access_twilio TEXT DEFAULT 'PENDENTE',
  access_vivo_empresa TEXT DEFAULT 'PENDENTE',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_system_access ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage staff access"
ON public.staff_system_access
FOR ALL
USING (public.is_neohub_admin(auth.uid()));

-- Staff can view their own
CREATE POLICY "Staff can view own access"
ON public.staff_system_access
FOR SELECT
USING (neohub_user_id = public.get_neohub_user_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_staff_system_access_updated_at
BEFORE UPDATE ON public.staff_system_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_staff_system_access_user ON public.staff_system_access(neohub_user_id);
CREATE INDEX idx_staff_system_access_city ON public.staff_system_access(city);
CREATE INDEX idx_staff_system_access_contract_type ON public.staff_system_access(contract_type);