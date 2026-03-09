
CREATE POLICY "Public can view active links"
ON public.neoteam_portal_links
FOR SELECT
TO anon
USING (is_active = true);
