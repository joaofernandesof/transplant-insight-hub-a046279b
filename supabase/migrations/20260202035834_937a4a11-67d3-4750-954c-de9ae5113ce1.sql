-- Criar bucket para avatares de colaboradores
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-avatars', 'team-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer usuário autenticado pode fazer upload
CREATE POLICY "Authenticated users can upload team avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-avatars');

-- Policy: Avatares são públicos para visualização
CREATE POLICY "Team avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-avatars');

-- Policy: Usuário pode deletar seus próprios uploads
CREATE POLICY "Users can delete own team avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'team-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);