
-- 1. Add is_system column
ALTER TABLE public.avivar_column_checklists 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- 2. Mark existing matrix fields across ALL accounts
UPDATE public.avivar_column_checklists 
SET is_system = true 
WHERE field_key IN ('nome_do_lead', 'email', 'data_e_hora', 'tipo_de_consulta', 'link_da_meet');

-- 3. RLS: Prevent DELETE on system fields
CREATE POLICY "prevent_delete_system_checklist_fields"
ON public.avivar_column_checklists
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (is_system = false);

-- 4. RLS: Prevent UPDATE on system fields
CREATE POLICY "prevent_update_system_checklist_fields"
ON public.avivar_column_checklists
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (is_system = false);

-- 5. Update create_default_avivar_kanbans to seed matrix checklist fields
CREATE OR REPLACE FUNCTION public.create_default_avivar_kanbans(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_comercial_id UUID; v_pos_venda_id UUID; v_account_id UUID; v_first_column_id UUID;
BEGIN
  v_account_id := public.get_user_avivar_account_id(p_user_id);
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'Usuário sem conta Avivar'; END IF;
  IF EXISTS (SELECT 1 FROM avivar_kanbans WHERE account_id = v_account_id) THEN RETURN; END IF;
  
  INSERT INTO avivar_kanbans (user_id, account_id, name, description, icon, color, order_index) 
  VALUES (p_user_id, v_account_id, 'Comercial', 'Funil de vendas', 'briefcase', 'from-blue-500 to-indigo-600', 0) 
  RETURNING id INTO v_comercial_id;
  
  INSERT INTO avivar_kanban_columns (kanban_id, account_id, name, color, order_index) 
  VALUES
    (v_comercial_id, v_account_id, 'Lead de Entrada', 'from-gray-500 to-gray-600', 0),
    (v_comercial_id, v_account_id, 'Triagem', 'from-yellow-500 to-amber-600', 1),
    (v_comercial_id, v_account_id, 'Tentando Agendar', 'from-orange-500 to-orange-600', 2),
    (v_comercial_id, v_account_id, 'Reagendamento', 'from-pink-500 to-rose-600', 3),
    (v_comercial_id, v_account_id, 'Agendado', 'from-blue-500 to-blue-600', 4),
    (v_comercial_id, v_account_id, 'Follow Up', 'from-purple-500 to-purple-600', 5),
    (v_comercial_id, v_account_id, 'Cliente', 'from-emerald-500 to-green-600', 6),
    (v_comercial_id, v_account_id, 'Desqualificados', 'from-red-500 to-red-600', 7);

  -- Get first column ID for checklist fields
  SELECT id INTO v_first_column_id FROM avivar_kanban_columns 
  WHERE kanban_id = v_comercial_id AND order_index = 0;

  -- Seed matrix checklist fields (is_system = true)
  INSERT INTO avivar_column_checklists (column_id, account_id, field_key, field_label, field_type, is_required, is_system, options, order_index)
  VALUES
    (v_first_column_id, v_account_id, 'nome_do_lead', 'NOME DO LEAD', 'text', false, true, null, 0),
    (v_first_column_id, v_account_id, 'email', 'EMAIL', 'text', false, true, null, 1),
    (v_first_column_id, v_account_id, 'data_e_hora', 'DATA E HORA', 'datetime', false, true, null, 2),
    (v_first_column_id, v_account_id, 'tipo_de_consulta', 'TIPO DE CONSULTA', 'select', false, true, '["PRESENCIAL", "ONLINE"]'::jsonb, 3),
    (v_first_column_id, v_account_id, 'link_da_meet', 'LINK DA MEET', 'url', false, true, null, 4);

  INSERT INTO avivar_kanbans (user_id, account_id, name, description, icon, color, order_index) 
  VALUES (p_user_id, v_account_id, 'Pós-Venda', 'Acompanhamento pós-procedimento', 'heart-pulse', 'from-emerald-500 to-teal-600', 1) 
  RETURNING id INTO v_pos_venda_id;
  
  INSERT INTO avivar_kanban_columns (kanban_id, account_id, name, color, order_index) 
  VALUES
    (v_pos_venda_id, v_account_id, 'Onboarding', 'from-cyan-500 to-cyan-600', 0),
    (v_pos_venda_id, v_account_id, 'Cobrando Assinatura de Contrato', 'from-amber-500 to-orange-600', 1),
    (v_pos_venda_id, v_account_id, 'Contrato Assinado', 'from-emerald-500 to-green-600', 2);
END; $$;

-- 6. Backfill: insert matrix fields for accounts that don't have them yet
DO $$
DECLARE
  r RECORD;
  v_first_col_id UUID;
  v_matrix_fields TEXT[] := ARRAY['nome_do_lead', 'email', 'data_e_hora', 'tipo_de_consulta', 'link_da_meet'];
  v_field TEXT;
BEGIN
  FOR r IN 
    SELECT DISTINCT aa.id as account_id
    FROM avivar_accounts aa
    WHERE aa.is_active = true
  LOOP
    -- Get first column of first kanban for this account
    SELECT akc.id INTO v_first_col_id
    FROM avivar_kanban_columns akc
    JOIN avivar_kanbans ak ON ak.id = akc.kanban_id
    WHERE ak.account_id = r.account_id
    ORDER BY ak.order_index, akc.order_index
    LIMIT 1;

    IF v_first_col_id IS NULL THEN CONTINUE; END IF;

    -- Insert each matrix field if not exists
    FOREACH v_field IN ARRAY v_matrix_fields LOOP
      IF NOT EXISTS (
        SELECT 1 FROM avivar_column_checklists 
        WHERE account_id = r.account_id AND field_key = v_field
      ) THEN
        INSERT INTO avivar_column_checklists (column_id, account_id, field_key, field_label, field_type, is_required, is_system, options, order_index)
        VALUES (
          v_first_col_id, r.account_id, v_field,
          CASE v_field
            WHEN 'nome_do_lead' THEN 'NOME DO LEAD'
            WHEN 'email' THEN 'EMAIL'
            WHEN 'data_e_hora' THEN 'DATA E HORA'
            WHEN 'tipo_de_consulta' THEN 'TIPO DE CONSULTA'
            WHEN 'link_da_meet' THEN 'LINK DA MEET'
          END,
          CASE v_field
            WHEN 'data_e_hora' THEN 'datetime'
            WHEN 'tipo_de_consulta' THEN 'select'
            WHEN 'link_da_meet' THEN 'url'
            ELSE 'text'
          END,
          false, true,
          CASE v_field
            WHEN 'tipo_de_consulta' THEN '["PRESENCIAL", "ONLINE"]'::jsonb
            ELSE null
          END,
          CASE v_field
            WHEN 'nome_do_lead' THEN 0
            WHEN 'email' THEN 1
            WHEN 'data_e_hora' THEN 2
            WHEN 'tipo_de_consulta' THEN 3
            WHEN 'link_da_meet' THEN 4
          END
        );
      ELSE
        -- If exists but not marked as system, mark it
        UPDATE avivar_column_checklists 
        SET is_system = true 
        WHERE account_id = r.account_id AND field_key = v_field AND is_system = false;
      END IF;
    END LOOP;
  END LOOP;
END $$;
