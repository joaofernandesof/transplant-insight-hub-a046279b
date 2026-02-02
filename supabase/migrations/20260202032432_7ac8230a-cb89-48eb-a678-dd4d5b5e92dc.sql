-- Tabela para armazenar tutoriais do Avivar (gerenciado apenas por admins)
CREATE TABLE public.avivar_tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'geral',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.avivar_tutorials ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar tutoriais ativos
CREATE POLICY "Todos podem ver tutoriais ativos"
ON public.avivar_tutorials
FOR SELECT
USING (is_active = true);

-- Apenas admins podem gerenciar tutoriais
CREATE POLICY "Admins podem gerenciar tutoriais"
ON public.avivar_tutorials
FOR ALL
USING (public.is_neohub_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_avivar_tutorials_updated_at
BEFORE UPDATE ON public.avivar_tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_whatsapp_session_updated_at();