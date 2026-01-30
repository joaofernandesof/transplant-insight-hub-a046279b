-- Tabela de configurações do agente Avivar
CREATE TABLE public.avivar_agent_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template TEXT NOT NULL,
  professional_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  attendant_name TEXT NOT NULL,
  crm TEXT,
  instagram TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  calendar_email TEXT,
  calendar_connected BOOLEAN DEFAULT false,
  services JSONB DEFAULT '[]'::jsonb,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  consultation_type JSONB DEFAULT '{"presencial": true, "online": false}'::jsonb,
  before_after_images JSONB DEFAULT '[]'::jsonb,
  schedule JSONB NOT NULL,
  welcome_message TEXT,
  transfer_message TEXT,
  tone_of_voice TEXT DEFAULT 'cordial',
  consultation_duration INTEGER DEFAULT 60,
  openai_api_key_hash TEXT,
  is_complete BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de prompts gerados
CREATE TABLE public.avivar_agent_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_config_id UUID NOT NULL REFERENCES public.avivar_agent_configs(id) ON DELETE CASCADE,
  prompt_content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de base de conhecimento
CREATE TABLE public.avivar_knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  chunk_size INTEGER DEFAULT 1000,
  overlap INTEGER DEFAULT 200,
  chunks_count INTEGER DEFAULT 0,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de chunks para RAG (embedding será TEXT por enquanto)
CREATE TABLE public.avivar_knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.avivar_knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding_json TEXT, -- Armazenar embedding como JSON string por enquanto
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de testes de chat
CREATE TABLE public.avivar_test_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_config_id UUID NOT NULL REFERENCES public.avivar_agent_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_test_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for avivar_agent_configs
CREATE POLICY "Users can view their own agent configs"
ON public.avivar_agent_configs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent configs"
ON public.avivar_agent_configs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent configs"
ON public.avivar_agent_configs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent configs"
ON public.avivar_agent_configs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for avivar_agent_prompts
CREATE POLICY "Users can view prompts of their configs"
ON public.avivar_agent_prompts FOR SELECT
USING (EXISTS (SELECT 1 FROM public.avivar_agent_configs c WHERE c.id = agent_config_id AND c.user_id = auth.uid()));

CREATE POLICY "Users can manage prompts of their configs"
ON public.avivar_agent_prompts FOR ALL
USING (EXISTS (SELECT 1 FROM public.avivar_agent_configs c WHERE c.id = agent_config_id AND c.user_id = auth.uid()));

-- RLS Policies for avivar_knowledge_documents
CREATE POLICY "Users can view their own documents"
ON public.avivar_knowledge_documents FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
ON public.avivar_knowledge_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.avivar_knowledge_documents FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.avivar_knowledge_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for avivar_knowledge_chunks
CREATE POLICY "Users can view chunks of their documents"
ON public.avivar_knowledge_chunks FOR SELECT
USING (EXISTS (SELECT 1 FROM public.avivar_knowledge_documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can manage chunks of their documents"
ON public.avivar_knowledge_chunks FOR ALL
USING (EXISTS (SELECT 1 FROM public.avivar_knowledge_documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

-- RLS Policies for avivar_test_conversations
CREATE POLICY "Users can view their test conversations"
ON public.avivar_test_conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their test conversations"
ON public.avivar_test_conversations FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_avivar_agent_configs_updated_at
BEFORE UPDATE ON public.avivar_agent_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avivar_test_conversations_updated_at
BEFORE UPDATE ON public.avivar_test_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_avivar_agent_configs_user_id ON public.avivar_agent_configs(user_id);
CREATE INDEX idx_avivar_knowledge_documents_user_id ON public.avivar_knowledge_documents(user_id);
CREATE INDEX idx_avivar_knowledge_chunks_document_id ON public.avivar_knowledge_chunks(document_id);
CREATE INDEX idx_avivar_test_conversations_config_id ON public.avivar_test_conversations(agent_config_id);