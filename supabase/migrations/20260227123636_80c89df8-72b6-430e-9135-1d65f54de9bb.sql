
-- Permitir criação de agente em rascunho
ALTER TABLE public.avivar_agents ALTER COLUMN name SET DEFAULT 'Novo Agente';

-- Adicionar coluna wizard_step para rastrear progresso
ALTER TABLE public.avivar_agents ADD COLUMN wizard_step integer DEFAULT 0;

-- Adicionar coluna is_draft para distinguir rascunhos
ALTER TABLE public.avivar_agents ADD COLUMN is_draft boolean DEFAULT true;

-- Marcar agentes existentes como finalizados
UPDATE public.avivar_agents SET is_draft = false WHERE is_draft IS NULL OR is_draft = true;
