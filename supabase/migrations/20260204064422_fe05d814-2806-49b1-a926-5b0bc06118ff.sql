-- Add missing columns to ipromed_legal_tasks
ALTER TABLE public.ipromed_legal_tasks 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create subtasks table
CREATE TABLE IF NOT EXISTS public.ipromed_legal_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.ipromed_legal_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subtasks
ALTER TABLE public.ipromed_legal_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for subtasks
CREATE POLICY "Users can view subtasks of their tasks" 
  ON public.ipromed_legal_subtasks FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.ipromed_legal_tasks 
    WHERE ipromed_legal_tasks.id = ipromed_legal_subtasks.task_id 
    AND ipromed_legal_tasks.created_by = auth.uid()
  ));

CREATE POLICY "Users can create subtasks for their tasks" 
  ON public.ipromed_legal_subtasks FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ipromed_legal_tasks 
    WHERE ipromed_legal_tasks.id = task_id 
    AND ipromed_legal_tasks.created_by = auth.uid()
  ));

CREATE POLICY "Users can update subtasks of their tasks" 
  ON public.ipromed_legal_subtasks FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.ipromed_legal_tasks 
    WHERE ipromed_legal_tasks.id = ipromed_legal_subtasks.task_id 
    AND ipromed_legal_tasks.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete subtasks of their tasks" 
  ON public.ipromed_legal_subtasks FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.ipromed_legal_tasks 
    WHERE ipromed_legal_tasks.id = ipromed_legal_subtasks.task_id 
    AND ipromed_legal_tasks.created_by = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ipromed_legal_tasks_status ON public.ipromed_legal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ipromed_legal_tasks_priority ON public.ipromed_legal_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_ipromed_legal_tasks_due_date ON public.ipromed_legal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_ipromed_legal_subtasks_task_id ON public.ipromed_legal_subtasks(task_id);