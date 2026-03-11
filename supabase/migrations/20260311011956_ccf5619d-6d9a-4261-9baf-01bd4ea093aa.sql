-- Storage bucket for payment attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-attachments', 'payment-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for payment attachments bucket
CREATE POLICY "Authenticated users can upload payment attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-attachments');

CREATE POLICY "Authenticated users can view payment attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-attachments');

CREATE POLICY "Users can delete own payment attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add payment_method and attachment columns to ipromed_payables if not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_payables' AND column_name = 'payment_method') THEN
    ALTER TABLE public.ipromed_payables ADD COLUMN payment_method text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_payables' AND column_name = 'attachment_urls') THEN
    ALTER TABLE public.ipromed_payables ADD COLUMN attachment_urls text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_payables' AND column_name = 'financial_account') THEN
    ALTER TABLE public.ipromed_payables ADD COLUMN financial_account text;
  END IF;
END $$;
