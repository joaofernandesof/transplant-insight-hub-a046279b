
-- Add responsible_user_id to surgery_task_definitions
ALTER TABLE public.surgery_task_definitions
  ADD COLUMN responsible_user_id UUID REFERENCES public.neohub_users(id) ON DELETE SET NULL;

-- Add responsible_user_id to surgery_tasks
ALTER TABLE public.surgery_tasks
  ADD COLUMN responsible_user_id UUID REFERENCES public.neohub_users(id) ON DELETE SET NULL;
