
-- Add doctor_id to schedule_week_locks
ALTER TABLE public.schedule_week_locks
ADD COLUMN doctor_id UUID REFERENCES public.neoteam_doctors(id);

CREATE INDEX idx_schedule_week_locks_doctor_id ON public.schedule_week_locks(doctor_id);
