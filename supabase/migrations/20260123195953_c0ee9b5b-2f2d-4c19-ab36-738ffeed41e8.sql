-- =============================================
-- GALERIA DE FOTOS DE CURSOS - NeoHub Academy
-- =============================================

-- 1. Tabela de Galerias
CREATE TABLE public.course_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.course_classes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  photo_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Fotos
CREATE TABLE public.course_gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public.course_galleries(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  full_url TEXT NOT NULL,
  filename VARCHAR(255),
  file_size INTEGER,
  order_index INTEGER DEFAULT 0,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX idx_course_galleries_course_id ON public.course_galleries(course_id);
CREATE INDEX idx_course_galleries_class_id ON public.course_galleries(class_id);
CREATE INDEX idx_course_galleries_status ON public.course_galleries(status);
CREATE INDEX idx_course_gallery_photos_gallery_id ON public.course_gallery_photos(gallery_id);

-- 4. Trigger para atualizar updated_at
CREATE TRIGGER update_course_galleries_updated_at
  BEFORE UPDATE ON public.course_galleries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Trigger para contar fotos automaticamente
CREATE OR REPLACE FUNCTION public.update_gallery_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.course_galleries 
    SET photo_count = photo_count + 1, updated_at = now()
    WHERE id = NEW.gallery_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.course_galleries 
    SET photo_count = photo_count - 1, updated_at = now()
    WHERE id = OLD.gallery_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_gallery_photo_count
  AFTER INSERT OR DELETE ON public.course_gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gallery_photo_count();

-- 6. Enable RLS
ALTER TABLE public.course_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_gallery_photos ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies para course_galleries
-- Admin/NeoTeam pode ver todas
CREATE POLICY "Admins can manage all galleries"
  ON public.course_galleries
  FOR ALL
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'))
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

-- Alunos/Licenciados só veem galerias publicadas das turmas em que estão matriculados
CREATE POLICY "Students see published galleries of enrolled classes"
  ON public.course_galleries
  FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      WHERE ce.class_id = course_galleries.class_id
        AND ce.user_id = auth.uid()
    )
  );

-- 8. RLS Policies para course_gallery_photos
-- Admin/NeoTeam pode gerenciar todas
CREATE POLICY "Admins can manage all photos"
  ON public.course_gallery_photos
  FOR ALL
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'))
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

-- Alunos só veem fotos de galerias publicadas das turmas em que estão
CREATE POLICY "Students see photos of enrolled class galleries"
  ON public.course_gallery_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_galleries cg
      JOIN public.class_enrollments ce ON ce.class_id = cg.class_id
      WHERE cg.id = course_gallery_photos.gallery_id
        AND cg.status = 'published'
        AND ce.user_id = auth.uid()
    )
  );

-- 9. Criar bucket de storage para fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-galleries',
  'course-galleries',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 10. Storage policies
CREATE POLICY "Anyone can view gallery photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-galleries');

CREATE POLICY "NeoTeam can upload gallery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-galleries'
    AND (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'))
  );

CREATE POLICY "NeoTeam can delete gallery photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-galleries'
    AND (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'))
  );

-- 11. Adicionar permissão do módulo na matriz
INSERT INTO public.neohub_module_permissions (module_code, module_name, portal, profile, can_read, can_write, can_delete)
VALUES
  -- Aluno pode apenas ler
  ('academy_course_gallery', 'Galeria de Fotos', 'academy', 'aluno', true, false, false),
  -- Licenciado pode apenas ler
  ('academy_course_gallery', 'Galeria de Fotos', 'academy', 'licenciado', true, false, false),
  -- Colaborador pode ler, escrever e deletar
  ('academy_course_gallery', 'Galeria de Fotos', 'neoteam', 'colaborador', true, true, true),
  -- Admin já tem bypass
  ('academy_course_gallery', 'Galeria de Fotos', 'academy', 'administrador', true, true, true)
ON CONFLICT DO NOTHING;