-- Adicionar campos que faltam na tabela avivar_agents para armazenar configuração completa do wizard

-- Dados do profissional
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS crm VARCHAR(100);
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);

-- Dados da empresa/localização
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- Nicho e subnicho
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS nicho VARCHAR(50);
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS subnicho VARCHAR(50);

-- Tipos de consulta e pagamentos
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS consultation_type JSONB DEFAULT '{"presencial": true, "online": false, "domicilio": false}';
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS payment_methods JSONB;

-- Imagens e identidade
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS before_after_images JSONB DEFAULT '[]';
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS ai_identity TEXT;
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS ai_objective TEXT;
ALTER TABLE public.avivar_agents ADD COLUMN IF NOT EXISTS consultation_duration INTEGER DEFAULT 60;