-- ============================================
-- AVIVAR AGENTS - Múltiplos Agentes por Usuário
-- ============================================

-- Tabela principal de agentes
CREATE TABLE public.avivar_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identidade do agente
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  personality TEXT, -- Prompt de personalidade
  
  -- Base de conhecimento (armazenada como JSON)
  knowledge_files JSONB DEFAULT '[]'::jsonb,
  
  -- Configuração de atuação
  target_kanbans TEXT[] DEFAULT ARRAY[]::TEXT[], -- comercial, pos_venda, etc
  target_stages TEXT[] DEFAULT ARRAY[]::TEXT[], -- novo_lead, agendado, etc
  
  -- Configurações herdadas do wizard
  openai_api_key_hash TEXT,
  tone_of_voice VARCHAR(50) DEFAULT 'cordial',
  ai_instructions TEXT,
  ai_restrictions TEXT,
  fluxo_atendimento JSONB DEFAULT '{}'::jsonb,
  
  -- Contexto do negócio
  company_name VARCHAR(255),
  professional_name VARCHAR(255),
  services JSONB DEFAULT '[]'::jsonb,
  schedule JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_avivar_agents_user_id ON public.avivar_agents(user_id);
CREATE INDEX idx_avivar_agents_active ON public.avivar_agents(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.avivar_agents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários da mesma conta podem ver todos os agentes
CREATE POLICY "Users can view agents from their account"
ON public.avivar_agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create agents"
ON public.avivar_agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their agents"
ON public.avivar_agents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their agents"
ON public.avivar_agents FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_avivar_agents_updated_at
  BEFORE UPDATE ON public.avivar_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna de agente atribuído nas conversas CRM
ALTER TABLE public.crm_conversations 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.avivar_agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS agent_mode VARCHAR(20) DEFAULT 'auto' CHECK (agent_mode IN ('single', 'auto'));

-- Índice para buscar conversas por agente
CREATE INDEX IF NOT EXISTS idx_crm_conversations_agent ON public.crm_conversations(assigned_agent_id) WHERE assigned_agent_id IS NOT NULL;

-- Comentários
COMMENT ON TABLE public.avivar_agents IS 'Agentes de IA configuráveis por usuário do Avivar';
COMMENT ON COLUMN public.avivar_agents.target_kanbans IS 'Tipos de kanban onde o agente atua (comercial, pos_venda)';
COMMENT ON COLUMN public.avivar_agents.target_stages IS 'Estágios específicos onde o agente atua (novo_lead, agendado, etc)';
COMMENT ON COLUMN public.crm_conversations.agent_mode IS 'single = agente fixo, auto = sistema escolhe baseado no estágio';