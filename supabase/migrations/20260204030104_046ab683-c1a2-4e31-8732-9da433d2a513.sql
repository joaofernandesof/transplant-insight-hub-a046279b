-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ipromed-contracts', 'ipromed-contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for contract documents storage
CREATE POLICY "Authenticated users can upload contract documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ipromed-contracts');

CREATE POLICY "Authenticated users can view contract documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ipromed-contracts');

CREATE POLICY "Authenticated users can delete contract documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ipromed-contracts');

-- Create table for contract documents
CREATE TABLE public.ipromed_contract_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.ipromed_contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  document_type TEXT NOT NULL DEFAULT 'contract',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ipromed_contract_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view contract documents"
ON public.ipromed_contract_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert contract documents"
ON public.ipromed_contract_documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contract documents"
ON public.ipromed_contract_documents FOR DELETE
TO authenticated
USING (true);

-- Add sent_at column to contracts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ipromed_contracts' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.ipromed_contracts ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;