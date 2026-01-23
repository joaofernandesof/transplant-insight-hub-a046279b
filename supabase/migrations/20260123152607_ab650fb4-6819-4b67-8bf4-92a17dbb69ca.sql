
-- Tabela de eventos (cursos, turmas que precisam de organização)
CREATE TABLE public.event_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.course_classes(id),
  event_name TEXT NOT NULL,
  event_start_date DATE NOT NULL,
  event_end_date DATE,
  location TEXT,
  status TEXT DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluido', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de itens do checklist
CREATE TABLE public.event_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.event_checklists(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  days_offset INTEGER NOT NULL DEFAULT 0, -- dias relativos ao evento (-15 = 15 dias antes, 0 = dia do evento, +2 = 2 dias depois)
  due_date DATE,
  responsible TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  observation TEXT,
  category TEXT, -- agrupar tarefas similares
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_event_checklist_items_checklist_id ON public.event_checklist_items(checklist_id);
CREATE INDEX idx_event_checklist_items_status ON public.event_checklist_items(status);
CREATE INDEX idx_event_checklist_items_due_date ON public.event_checklist_items(due_date);
CREATE INDEX idx_event_checklist_items_responsible ON public.event_checklist_items(responsible);

-- Enable RLS
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checklist_items ENABLE ROW LEVEL SECURITY;

-- Policies: qualquer usuário autenticado pode ver e editar (equipe staff)
CREATE POLICY "Authenticated users can view checklists" 
ON public.event_checklists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert checklists" 
ON public.event_checklists FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update checklists" 
ON public.event_checklists FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view checklist items" 
ON public.event_checklist_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert checklist items" 
ON public.event_checklist_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update checklist items" 
ON public.event_checklist_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete checklist items" 
ON public.event_checklist_items FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_event_checklists_updated_at
BEFORE UPDATE ON public.event_checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_checklist_items_updated_at
BEFORE UPDATE ON public.event_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checklist_items;
