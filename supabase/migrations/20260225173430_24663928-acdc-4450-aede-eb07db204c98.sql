
-- Rename categories to full names
UPDATE public.schedule_week_locks SET doctor = 'Categoria A - Hygor' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Cat A Hygor';
UPDATE public.schedule_week_locks SET doctor = 'Categoria A - Patrick' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Cat A Patrick';
UPDATE public.schedule_week_locks SET doctor = 'Categoria B' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Cat B';
UPDATE public.schedule_week_locks SET doctor = 'Categoria C' WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Cat C';

-- Create Categoria D entries
INSERT INTO public.schedule_week_locks (week_number, week_start, week_end, month, branch, doctor, permitido, agenda)
SELECT DISTINCT week_number, week_start, week_end, month, branch, 'Categoria D', false, 'Agenda Cirúrgica'
FROM public.schedule_week_locks
WHERE agenda = 'Agenda Cirúrgica' AND doctor = 'Categoria A - Hygor'
ON CONFLICT (week_number, branch, doctor, agenda) DO NOTHING;
