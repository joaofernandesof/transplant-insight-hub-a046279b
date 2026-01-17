-- Tabela para submissões de cirurgias com fotos
CREATE TABLE public.surgery_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surgery_submissions ENABLE ROW LEVEL SECURITY;

-- Policies para surgery_submissions
CREATE POLICY "Users can view their own submissions" 
ON public.surgery_submissions 
FOR SELECT 
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own submissions" 
ON public.surgery_submissions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update submissions" 
ON public.surgery_submissions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions" 
ON public.surgery_submissions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar bucket para fotos de cirurgias
INSERT INTO storage.buckets (id, name, public) VALUES ('surgery-photos', 'surgery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage de fotos de cirurgias
CREATE POLICY "Users can upload their surgery photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'surgery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Surgery photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'surgery-photos');

CREATE POLICY "Users can update their surgery photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'surgery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their surgery photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'surgery-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_surgery_submissions_updated_at
BEFORE UPDATE ON public.surgery_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for user_achievements (para timeline)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;