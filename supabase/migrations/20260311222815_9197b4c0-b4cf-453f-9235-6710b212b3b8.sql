
-- Offboarding processes
CREATE TABLE public.rh_offboarding_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid,
  colaborador_nome text NOT NULL,
  cargo text,
  setor text,
  tipo_desligamento text NOT NULL DEFAULT 'demissao',
  data_desligamento date NOT NULL,
  responsavel_nome text,
  status text NOT NULL DEFAULT 'aberto',
  observacoes text,
  created_by text,
  validated_by text,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rh_offboarding_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage offboarding processes"
  ON public.rh_offboarding_processes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist items
CREATE TABLE public.rh_offboarding_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.rh_offboarding_processes(id) ON DELETE CASCADE,
  categoria text NOT NULL,
  tarefa text NOT NULL,
  setor_responsavel text NOT NULL DEFAULT 'RH',
  status text NOT NULL DEFAULT 'pendente',
  executado_por text,
  executado_em timestamptz,
  observacao text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rh_offboarding_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage offboarding checklist"
  ON public.rh_offboarding_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit history
CREATE TABLE public.rh_offboarding_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.rh_offboarding_processes(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text,
  user_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rh_offboarding_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage offboarding history"
  ON public.rh_offboarding_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
