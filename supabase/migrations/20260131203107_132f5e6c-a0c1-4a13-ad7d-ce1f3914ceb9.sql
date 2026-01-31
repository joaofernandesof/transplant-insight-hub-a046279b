-- Adicionar coluna agent_id para vincular documentos a agentes específicos
ALTER TABLE public.avivar_knowledge_documents
ADD COLUMN agent_id UUID REFERENCES public.avivar_agents(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX idx_knowledge_documents_agent_id ON public.avivar_knowledge_documents(agent_id);

-- Comentário explicativo
COMMENT ON COLUMN public.avivar_knowledge_documents.agent_id IS 'ID do agente que possui este documento na base de conhecimento';