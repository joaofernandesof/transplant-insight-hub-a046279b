-- Criar bucket público para assets de email
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Política RLS para permitir leitura pública
CREATE POLICY "Allow public read access on email-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');