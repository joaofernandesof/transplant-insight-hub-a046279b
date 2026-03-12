
-- Rename "Pós-vendas" back to "Sucesso do Paciente"
UPDATE public.neoteam_sectors SET name = 'Sucesso do Paciente' WHERE code = 'sucesso_paciente';

-- Insert new sector "Sucesso do Aluno"
INSERT INTO public.neoteam_sectors (code, name, is_active, order_index)
VALUES ('sucesso_aluno', 'Sucesso do Aluno', true, (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.neoteam_sectors))
ON CONFLICT (code) DO UPDATE SET name = 'Sucesso do Aluno', is_active = true;
