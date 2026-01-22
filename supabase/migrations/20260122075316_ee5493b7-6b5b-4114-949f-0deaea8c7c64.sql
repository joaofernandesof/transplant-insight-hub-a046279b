-- Adicionar coluna patient_id à tabela neoteam_tasks para vincular tarefas a pacientes
ALTER TABLE public.neoteam_tasks
ADD COLUMN patient_id UUID REFERENCES public.neohub_users(id) ON DELETE SET NULL;

-- Criar índice para consultas por paciente
CREATE INDEX idx_neoteam_tasks_patient_id ON public.neoteam_tasks(patient_id);

-- Comentário para documentação
COMMENT ON COLUMN public.neoteam_tasks.patient_id IS 'Referência ao paciente vinculado à tarefa';