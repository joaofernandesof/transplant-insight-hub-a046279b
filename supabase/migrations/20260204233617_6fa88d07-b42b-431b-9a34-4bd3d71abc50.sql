-- Remove a foreign key constraint que impede atribuir membros de equipe
-- A coluna assigned_to agora pode receber qualquer UUID (de auth.users ou avivar_team_members)
ALTER TABLE public.crm_conversations 
DROP CONSTRAINT IF EXISTS crm_conversations_assigned_to_fkey;