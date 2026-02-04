-- Limpeza de tabelas Avivar não utilizadas
-- Excluindo tabelas legadas e features nunca implementadas

-- 1. Primeiro excluir tabelas dependentes (com FKs)
DROP TABLE IF EXISTS public.avivar_agent_prompts CASCADE;
DROP TABLE IF EXISTS public.avivar_test_conversations CASCADE;
DROP TABLE IF EXISTS public.avivar_briefing_interactions CASCADE;

-- 2. Depois excluir tabelas principais
DROP TABLE IF EXISTS public.avivar_agent_configs CASCADE;
DROP TABLE IF EXISTS public.avivar_lead_briefings CASCADE;
DROP TABLE IF EXISTS public.avivar_stage_history CASCADE;
DROP TABLE IF EXISTS public.avivar_detetive_settings CASCADE;