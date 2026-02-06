
-- Drop insecure legacy policies on avivar_patient_journeys
DROP POLICY IF EXISTS "Authenticated users can view journeys" ON public.avivar_patient_journeys;
DROP POLICY IF EXISTS "Authenticated users can update journeys" ON public.avivar_patient_journeys;
DROP POLICY IF EXISTS "Authenticated users can create journeys" ON public.avivar_patient_journeys;
