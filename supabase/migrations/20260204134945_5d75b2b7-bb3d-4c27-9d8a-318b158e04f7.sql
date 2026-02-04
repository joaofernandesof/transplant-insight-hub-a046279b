-- Adicionar coluna para portais permitidos por usuário
ALTER TABLE public.neohub_users
ADD COLUMN IF NOT EXISTS allowed_portals text[] DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN public.neohub_users.allowed_portals IS 'Lista de portais que o usuário tem acesso explícito (neolicense, avivar, ipromed, neocare, neoteam, academy)';

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_neohub_users_allowed_portals ON public.neohub_users USING GIN (allowed_portals);