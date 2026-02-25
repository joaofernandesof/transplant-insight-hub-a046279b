
-- Add branch_id to doctor schedules
ALTER TABLE public.neoteam_doctor_schedules
ADD COLUMN branch_id UUID REFERENCES public.neoteam_branches(id);

-- Create index for performance
CREATE INDEX idx_neoteam_doctor_schedules_branch ON public.neoteam_doctor_schedules(branch_id);
