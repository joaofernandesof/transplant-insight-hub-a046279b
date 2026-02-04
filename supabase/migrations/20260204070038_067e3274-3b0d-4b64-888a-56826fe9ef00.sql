-- Remover duplicatas existentes (mantendo o mais antigo)
DELETE FROM user_profile_assignments a
USING user_profile_assignments b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.profile_id = b.profile_id
  AND COALESCE(a.tenant_id::text, '') = COALESCE(b.tenant_id::text, '');

-- Adicionar constraint UNIQUE para evitar duplicatas no futuro
ALTER TABLE user_profile_assignments 
ADD CONSTRAINT unique_user_profile_tenant 
UNIQUE (user_id, profile_id, tenant_id);