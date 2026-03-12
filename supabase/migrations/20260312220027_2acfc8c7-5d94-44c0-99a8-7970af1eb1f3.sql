
-- Create the neoacademy-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('neoacademy-images', 'neoacademy-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload neoacademy images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'neoacademy-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update neoacademy images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'neoacademy-images');

-- Allow anyone to view neoacademy images (public bucket)
CREATE POLICY "Anyone can view neoacademy images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'neoacademy-images');

-- Allow authenticated users to delete neoacademy images
CREATE POLICY "Authenticated users can delete neoacademy images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'neoacademy-images');
