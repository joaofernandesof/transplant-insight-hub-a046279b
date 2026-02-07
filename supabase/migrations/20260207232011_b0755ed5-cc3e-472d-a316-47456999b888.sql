-- Make lead_id nullable so tasks can be created without a lead
ALTER TABLE public.lead_tasks ALTER COLUMN lead_id DROP NOT NULL;