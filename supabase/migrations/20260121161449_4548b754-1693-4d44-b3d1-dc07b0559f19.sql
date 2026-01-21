
-- ====================================
-- Migration: Unificar usuários em neohub_users
-- ====================================
-- Migra todos os usuários de profiles para neohub_users
-- Mapeia roles: admin -> administrador, licensee -> licenciado

-- 1. Migrar usuários de profiles que não existem em neohub_users
INSERT INTO public.neohub_users (
  user_id,
  email,
  full_name,
  phone,
  avatar_url,
  address_city,
  address_state,
  is_active,
  created_at,
  updated_at
)
SELECT 
  p.user_id,
  p.email,
  p.name as full_name,
  p.phone,
  p.avatar_url,
  p.city as address_city,
  p.state as address_state,
  CASE WHEN p.status = 'active' THEN true ELSE false END as is_active,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.neohub_users n WHERE n.user_id = p.user_id
);

-- 2. Criar perfis para os usuários migrados baseado na tabela user_roles
INSERT INTO public.neohub_user_profiles (neohub_user_id, profile, is_active, granted_at)
SELECT 
  n.id as neohub_user_id,
  CASE 
    WHEN ur.role = 'admin' THEN 'administrador'::neohub_profile
    ELSE 'licenciado'::neohub_profile
  END as profile,
  true as is_active,
  NOW() as granted_at
FROM public.neohub_users n
JOIN public.profiles p ON p.user_id = n.user_id
LEFT JOIN public.user_roles ur ON ur.user_id = n.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.neohub_user_profiles nup 
  WHERE nup.neohub_user_id = n.id
);

-- 3. Adicionar colunas extras em neohub_users para dados do licenciado
ALTER TABLE public.neohub_users 
ADD COLUMN IF NOT EXISTS clinic_name text,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS instagram_personal text,
ADD COLUMN IF NOT EXISTS whatsapp_personal text,
ADD COLUMN IF NOT EXISTS instagram_clinic text,
ADD COLUMN IF NOT EXISTS whatsapp_clinic text,
ADD COLUMN IF NOT EXISTS clinic_logo_url text,
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS referral_code text,
ADD COLUMN IF NOT EXISTS crm text,
ADD COLUMN IF NOT EXISTS rqe text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone;

-- 4. Atualizar os dados extras dos licenciados que vieram de profiles
UPDATE public.neohub_users n
SET 
  clinic_name = p.clinic_name,
  tier = p.tier,
  instagram_personal = p.instagram_personal,
  whatsapp_personal = p.whatsapp_personal,
  instagram_clinic = p.instagram_clinic,
  whatsapp_clinic = p.whatsapp_clinic,
  clinic_logo_url = p.clinic_logo_url,
  services = p.services,
  referral_code = p.referral_code,
  crm = p.crm,
  rqe = p.rqe,
  onboarding_completed = p.onboarding_completed,
  onboarding_completed_at = p.onboarding_completed_at,
  total_points = p.total_points,
  last_seen_at = p.last_seen_at
FROM public.profiles p
WHERE p.user_id = n.user_id
  AND (n.clinic_name IS NULL OR n.tier IS NULL);

-- 5. Criar índice para referral_code
CREATE INDEX IF NOT EXISTS idx_neohub_users_referral_code 
ON public.neohub_users(referral_code) WHERE referral_code IS NOT NULL;

-- 6. Criar função para gerar referral_code automaticamente
CREATE OR REPLACE FUNCTION public.generate_neohub_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7. Trigger para gerar referral_code em novos usuários
DROP TRIGGER IF EXISTS generate_neohub_referral_code_trigger ON public.neohub_users;
CREATE TRIGGER generate_neohub_referral_code_trigger
BEFORE INSERT ON public.neohub_users
FOR EACH ROW
EXECUTE FUNCTION public.generate_neohub_referral_code();
