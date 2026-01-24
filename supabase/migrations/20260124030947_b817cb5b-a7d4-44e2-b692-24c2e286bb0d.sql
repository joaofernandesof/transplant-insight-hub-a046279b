-- Create Brows Transplant 360 course
INSERT INTO public.courses (id, title, description, difficulty, duration_hours, is_published, is_featured)
VALUES (
  'e5a7c1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  'Brows Transplant 360',
  'Curso especializado em transplante de sobrancelhas com técnicas avançadas.',
  'intermediate',
  24,
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Insert Brows Transplant 360 classes for each month according to the calendar
-- 2026-03 Brows
INSERT INTO public.course_classes (id, code, name, course_id, start_date, end_date, location, status, max_students)
VALUES (
  gen_random_uuid(),
  'BROWS-2026-03',
  'Brows Transplant 360 - Turma 03/2026',
  'e5a7c1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  '2026-03-20',
  '2026-03-22',
  'Presencial - São Paulo',
  'confirmed',
  20
) ON CONFLICT (code) DO NOTHING;

-- 2026-05 Brows
INSERT INTO public.course_classes (id, code, name, course_id, start_date, end_date, location, status, max_students)
VALUES (
  gen_random_uuid(),
  'BROWS-2026-05',
  'Brows Transplant 360 - Turma 05/2026',
  'e5a7c1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  '2026-05-22',
  '2026-05-24',
  'Presencial - São Paulo',
  'confirmed',
  20
) ON CONFLICT (code) DO NOTHING;

-- 2026-07 Brows (pending)
INSERT INTO public.course_classes (id, code, name, course_id, start_date, end_date, location, status, max_students)
VALUES (
  gen_random_uuid(),
  'BROWS-2026-07',
  'Brows Transplant 360 - Turma 07/2026',
  'e5a7c1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  NULL,
  NULL,
  'Presencial - São Paulo',
  'pending',
  20
) ON CONFLICT (code) DO NOTHING;

-- 2026-09 Brows (pending)
INSERT INTO public.course_classes (id, code, name, course_id, start_date, end_date, location, status, max_students)
VALUES (
  gen_random_uuid(),
  'BROWS-2026-09',
  'Brows Transplant 360 - Turma 09/2026',
  'e5a7c1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  NULL,
  NULL,
  'Presencial - São Paulo',
  'pending',
  20
) ON CONFLICT (code) DO NOTHING;

-- 2026-11 Brows (pending)
INSERT INTO public.course_classes (id, code, name, course_id, start_date, end_date, location, status, max_students)
VALUES (
  gen_random_uuid(),
  'BROWS-2026-11',
  'Brows Transplant 360 - Turma 11/2026',
  'e5a7c1b2-3d4e-5f6a-7b8c-9d0e1f2a3b4c',
  NULL,
  NULL,
  'Presencial - São Paulo',
  'pending',
  20
) ON CONFLICT (code) DO NOTHING;

-- Remove the Fellowship and Instrumentador from calendar (not in the provided calendar)
DELETE FROM public.class_enrollments WHERE class_id IN (
  '0be2609e-7da5-4c3a-a56e-6b442d04c37f',
  'f933cdac-70ff-4140-96cd-aa2108bc8617'
);
DELETE FROM public.course_classes WHERE id IN (
  '0be2609e-7da5-4c3a-a56e-6b442d04c37f',
  'f933cdac-70ff-4140-96cd-aa2108bc8617'
);