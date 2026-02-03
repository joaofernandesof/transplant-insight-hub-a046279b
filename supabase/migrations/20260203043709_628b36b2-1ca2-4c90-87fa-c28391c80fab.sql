-- Create storage bucket for chat media (images, audio, documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avivar-media', 'avivar-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to avivar-media bucket
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avivar-media');

-- Allow public read access to avivar-media
CREATE POLICY "Public can view avivar media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avivar-media');

-- Allow service role to manage all media (for edge functions)
CREATE POLICY "Service role can manage all media"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'avivar-media')
WITH CHECK (bucket_id = 'avivar-media');