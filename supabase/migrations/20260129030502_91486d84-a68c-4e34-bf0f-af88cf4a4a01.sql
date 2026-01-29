-- Add RLS policy for IPROMED users to manage contracts
CREATE POLICY "IPROMED users can manage contracts" 
ON public.ipromed_contracts 
FOR ALL 
TO authenticated
USING (
  has_neohub_profile(auth.uid(), 'ipromed')
)
WITH CHECK (
  has_neohub_profile(auth.uid(), 'ipromed')
);

-- Also add policy for SELECT on ipromed_legal_clients for IPROMED users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ipromed_legal_clients' 
    AND policyname = 'IPROMED users can view clients'
  ) THEN
    CREATE POLICY "IPROMED users can view clients"
    ON public.ipromed_legal_clients
    FOR SELECT
    TO authenticated
    USING (
      has_neohub_profile(auth.uid(), 'ipromed') OR is_neohub_admin(auth.uid())
    );
  END IF;
END $$;