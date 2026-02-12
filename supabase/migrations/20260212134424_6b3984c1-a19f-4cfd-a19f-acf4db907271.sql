
-- Table for deadline types with their checklist items
CREATE TABLE public.ipromed_deadline_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing checklist responses per appointment
CREATE TABLE public.ipromed_appointment_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.ipromed_appointments(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  check_label TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, check_key)
);

-- Add deadline_type_id to appointments
ALTER TABLE public.ipromed_appointments ADD COLUMN deadline_type_id UUID REFERENCES public.ipromed_deadline_types(id);

-- Enable RLS
ALTER TABLE public.ipromed_deadline_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_appointment_checks ENABLE ROW LEVEL SECURITY;

-- RLS policies - deadline types are shared/readable by all authenticated
CREATE POLICY "Authenticated users can read deadline types"
  ON public.ipromed_deadline_types FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage deadline types"
  ON public.ipromed_deadline_types FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read appointment checks"
  ON public.ipromed_appointment_checks FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage appointment checks"
  ON public.ipromed_appointment_checks FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Seed default types
INSERT INTO public.ipromed_deadline_types (name, checklist_items, is_default) VALUES
  ('Prazo de Documentação', '[{"key": "doc_elaborada", "label": "Documentação elaborada"}, {"key": "doc_entregue", "label": "Entregue ao cliente"}]'::jsonb, true),
  ('Prazo de Petição', '[{"key": "doc_elaborada", "label": "Documentação elaborada"}, {"key": "doc_entregue", "label": "Entregue ao cliente"}, {"key": "prazo_feito", "label": "Prazo feito"}, {"key": "prazo_protocolado", "label": "Prazo protocolado"}]'::jsonb, true);

-- Index for performance
CREATE INDEX idx_appointment_checks_appointment ON public.ipromed_appointment_checks(appointment_id);
