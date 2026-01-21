-- Create tasks table for NeoTeam task management
CREATE TABLE IF NOT EXISTS public.neoteam_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  due_time TIME,
  assignee_id UUID,
  assignee_name TEXT,
  branch TEXT,
  category TEXT,
  tags TEXT[],
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.neoteam_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view tasks" 
ON public.neoteam_tasks FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tasks" 
ON public.neoteam_tasks FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_neoteam_tasks_updated_at
BEFORE UPDATE ON public.neoteam_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();