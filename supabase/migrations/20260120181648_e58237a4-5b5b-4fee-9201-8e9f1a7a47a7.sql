-- Criar bucket para documentos de pacientes (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para patient-documents
-- Pacientes podem ver apenas seus próprios documentos
CREATE POLICY "Patients can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' 
  AND (
    -- Admins podem ver todos
    public.is_neohub_admin(auth.uid())
    OR
    -- Paciente pode ver seus próprios arquivos (pasta com seu user_id)
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Profissionais podem fazer upload de documentos para pacientes
CREATE POLICY "Staff can upload patient documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents'
  AND (
    public.is_neohub_admin(auth.uid())
    OR public.has_neohub_profile(auth.uid(), 'colaborador')
  )
);

-- Staff pode deletar documentos
CREATE POLICY "Staff can delete patient documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-documents'
  AND (
    public.is_neohub_admin(auth.uid())
    OR public.has_neohub_profile(auth.uid(), 'colaborador')
  )
);

-- Políticas RLS para portal_attachments
-- Habilitar RLS se ainda não estiver
ALTER TABLE public.portal_attachments ENABLE ROW LEVEL SECURITY;

-- Pacientes podem ver seus próprios anexos
CREATE POLICY "Patients can view own attachments"
ON public.portal_attachments FOR SELECT
USING (
  public.is_neohub_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.portal_patients pp
    JOIN public.portal_users pu ON pu.id = pp.portal_user_id
    WHERE pp.id = portal_attachments.patient_id
    AND pu.user_id = auth.uid()
  )
);

-- Staff pode inserir anexos
CREATE POLICY "Staff can insert attachments"
ON public.portal_attachments FOR INSERT
WITH CHECK (
  public.is_neohub_admin(auth.uid())
  OR public.has_neohub_profile(auth.uid(), 'colaborador')
);

-- Staff pode atualizar anexos
CREATE POLICY "Staff can update attachments"
ON public.portal_attachments FOR UPDATE
USING (
  public.is_neohub_admin(auth.uid())
  OR public.has_neohub_profile(auth.uid(), 'colaborador')
);

-- Staff pode deletar anexos
CREATE POLICY "Staff can delete attachments"
ON public.portal_attachments FOR DELETE
USING (
  public.is_neohub_admin(auth.uid())
  OR public.has_neohub_profile(auth.uid(), 'colaborador')
);