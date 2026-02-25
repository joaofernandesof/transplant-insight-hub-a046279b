
-- Rename doctors to categories for Agenda Cirúrgica
UPDATE public.schedule_week_locks SET doctor = 'Cat A Hygor' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Hygor';
UPDATE public.schedule_week_locks SET doctor = 'Cat A Patrick' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Patrick';
UPDATE public.schedule_week_locks SET doctor = 'Cat B' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Márcia';

-- Create Cat C entries for all existing week/branch combos in Agenda Cirúrgica
INSERT INTO public.schedule_week_locks (week_number, week_start, week_end, month, branch, doctor, permitido, agenda)
SELECT DISTINCT week_number, week_start, week_end, month, branch, 'Cat C', false, 'Agenda Cirúrgica'
FROM public.schedule_week_locks
WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Cat A Hygor'
ON CONFLICT (week_number, branch, doctor, agenda) DO NOTHING;
