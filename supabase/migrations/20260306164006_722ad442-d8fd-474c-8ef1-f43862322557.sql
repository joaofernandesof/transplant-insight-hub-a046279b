
INSERT INTO public.neoacademy_student_profiles (account_id, name, slug, description, color, order_index) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Lead', 'lead', 'Leads e prospects ainda não convertidos', '#6b7280', 0),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Aluno Pré Formação 360', 'pre_formacao_360', 'Alunos matriculados no curso preparatório Formação 360', '#3b82f6', 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Aluno Pré Brows 360', 'pre_brows_360', 'Alunos matriculados no curso preparatório Brows 360', '#a855f7', 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Aluno Conecta Capilar', 'conecta_capilar', 'Alunos do programa Conecta Capilar', '#f59e0b', 3),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Licenciado', 'licenciado', 'Profissionais licenciados com acesso completo', '#10b981', 4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Aluno Fellow', 'fellow', 'Alunos do programa Fellow', '#ef4444', 5)
ON CONFLICT (account_id, slug) DO NOTHING;
