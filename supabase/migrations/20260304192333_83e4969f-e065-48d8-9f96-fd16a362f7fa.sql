
-- Add process_template_id to clinic_surgeries to link surgery to a process flow template
ALTER TABLE public.clinic_surgeries 
  ADD COLUMN IF NOT EXISTS process_template_id uuid REFERENCES public.neoteam_process_templates(id) ON DELETE SET NULL;

-- Add process_step_id to surgery_tasks to track which process step originated the task
ALTER TABLE public.surgery_tasks
  ADD COLUMN IF NOT EXISTS process_step_id uuid REFERENCES public.neoteam_process_steps(id) ON DELETE SET NULL;

-- Add process_instance_id to surgery_tasks to link to the specific process instance
ALTER TABLE public.surgery_tasks
  ADD COLUMN IF NOT EXISTS process_instance_id uuid REFERENCES public.neoteam_process_instances(id) ON DELETE SET NULL;
