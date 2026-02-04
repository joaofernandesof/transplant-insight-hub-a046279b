-- Add DELETE policy for ipromed_client_meetings table
CREATE POLICY "Authenticated users can delete meetings"
ON public.ipromed_client_meetings
FOR DELETE
TO authenticated
USING (true);