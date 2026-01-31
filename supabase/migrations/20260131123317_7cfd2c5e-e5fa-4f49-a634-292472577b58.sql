-- Tabela para armazenar instâncias UazAPI por usuário
CREATE TABLE public.avivar_uazapi_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  instance_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected')),
  phone_number TEXT,
  profile_name TEXT,
  profile_picture_url TEXT,
  is_business BOOLEAN DEFAULT false,
  platform TEXT,
  last_sync_at TIMESTAMPTZ,
  qr_code TEXT,
  pair_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.avivar_uazapi_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own instance"
ON public.avivar_uazapi_instances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instance"
ON public.avivar_uazapi_instances FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instance"
ON public.avivar_uazapi_instances FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instance"
ON public.avivar_uazapi_instances FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_avivar_uazapi_instances_updated_at
BEFORE UPDATE ON public.avivar_uazapi_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_uazapi_instances;

-- Index for user lookups
CREATE INDEX idx_avivar_uazapi_instances_user_id ON public.avivar_uazapi_instances(user_id);