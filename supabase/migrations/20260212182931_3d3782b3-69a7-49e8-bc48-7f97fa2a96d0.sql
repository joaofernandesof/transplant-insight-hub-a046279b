
-- FIX: Make surgery-photos bucket private and restrict SELECT policy
UPDATE storage.buckets SET public = false WHERE id = 'surgery-photos';

DROP POLICY IF EXISTS "Surgery photos are publicly accessible" ON storage.objects;

CREATE POLICY "Authenticated users can view surgery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'surgery-photos' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_neohub_admin(auth.uid())
  )
);
