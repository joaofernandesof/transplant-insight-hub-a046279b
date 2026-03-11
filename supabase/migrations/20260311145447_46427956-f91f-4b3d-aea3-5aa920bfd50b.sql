
CREATE TABLE public.neoteam_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.neoteam_tickets(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.neoteam_ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage ticket attachments"
  ON public.neoteam_ticket_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "Anyone can view ticket attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Authenticated users can delete ticket attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ticket-attachments');
