-- Tabela para armazenar dados de onboarding de clientes
CREATE TABLE IF NOT EXISTS public.ipromed_client_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.ipromed_client_meetings(id) ON DELETE SET NULL,
  
  -- Status do onboarding
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  progress_percentage INTEGER DEFAULT 0,
  completed_sections JSONB DEFAULT '[]',
  
  -- Dados completos do formulário
  onboarding_data JSONB NOT NULL DEFAULT '{}',
  
  -- Metadados
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_ipromed_client_onboarding_client ON public.ipromed_client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_ipromed_client_onboarding_status ON public.ipromed_client_onboarding(status);

-- Enable RLS
ALTER TABLE public.ipromed_client_onboarding ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view all onboardings" ON public.ipromed_client_onboarding FOR SELECT USING (true);
CREATE POLICY "Users can insert onboardings" ON public.ipromed_client_onboarding FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update onboardings" ON public.ipromed_client_onboarding FOR UPDATE USING (true);
CREATE POLICY "Users can delete onboardings" ON public.ipromed_client_onboarding FOR DELETE USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ipromed_client_onboarding_updated_at
  BEFORE UPDATE ON public.ipromed_client_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna de onboarding_data na tabela de reuniões também para manter junto da reunião
ALTER TABLE public.ipromed_client_meetings 
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT NULL;

-- Adicionar coluna de onboarding concluído na tabela de clientes
ALTER TABLE public.ipromed_legal_clients
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;