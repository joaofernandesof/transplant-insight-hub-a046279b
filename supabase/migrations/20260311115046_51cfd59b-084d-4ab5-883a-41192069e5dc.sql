INSERT INTO public.neoteam_sectors (code, name, is_active, order_index)
VALUES ('comercial', 'Setor Comercial', true, 7)
ON CONFLICT (code) DO UPDATE SET is_active = true, name = 'Setor Comercial';