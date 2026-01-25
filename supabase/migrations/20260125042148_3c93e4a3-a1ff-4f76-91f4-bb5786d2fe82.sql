-- Tabela para rastrear visualizações e downloads de fotos
CREATE TABLE public.gallery_photo_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.course_gallery_photos(id) ON DELETE CASCADE,
  gallery_id UUID NOT NULL REFERENCES public.course_galleries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para consultas rápidas
CREATE INDEX idx_gallery_photo_analytics_photo_id ON public.gallery_photo_analytics(photo_id);
CREATE INDEX idx_gallery_photo_analytics_gallery_id ON public.gallery_photo_analytics(gallery_id);
CREATE INDEX idx_gallery_photo_analytics_action_type ON public.gallery_photo_analytics(action_type);
CREATE INDEX idx_gallery_photo_analytics_created_at ON public.gallery_photo_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.gallery_photo_analytics ENABLE ROW LEVEL SECURITY;

-- Política para leitura: apenas admins e colaboradores com permissão
CREATE POLICY "Staff can view analytics"
ON public.gallery_photo_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = auth.uid()
    AND nup.profile IN ('administrador', 'colaborador')
  )
);

-- Política para inserção: qualquer usuário autenticado pode registrar ações
CREATE POLICY "Authenticated users can log actions"
ON public.gallery_photo_analytics
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- View para agregar estatísticas por foto
CREATE OR REPLACE VIEW public.gallery_photo_stats AS
SELECT 
  photo_id,
  gallery_id,
  COUNT(*) FILTER (WHERE action_type = 'view') as view_count,
  COUNT(*) FILTER (WHERE action_type = 'download') as download_count,
  MAX(created_at) FILTER (WHERE action_type = 'view') as last_viewed_at,
  MAX(created_at) FILTER (WHERE action_type = 'download') as last_downloaded_at
FROM public.gallery_photo_analytics
GROUP BY photo_id, gallery_id;

-- View para agregar estatísticas por galeria
CREATE OR REPLACE VIEW public.gallery_stats AS
SELECT 
  gallery_id,
  COUNT(*) FILTER (WHERE action_type = 'view') as total_views,
  COUNT(*) FILTER (WHERE action_type = 'download') as total_downloads,
  COUNT(DISTINCT photo_id) FILTER (WHERE action_type = 'view') as photos_viewed,
  COUNT(DISTINCT photo_id) FILTER (WHERE action_type = 'download') as photos_downloaded,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_activity_at
FROM public.gallery_photo_analytics
GROUP BY gallery_id;