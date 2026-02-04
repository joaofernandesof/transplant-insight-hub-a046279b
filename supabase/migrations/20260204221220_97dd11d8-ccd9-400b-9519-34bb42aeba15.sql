-- Drop and recreate the function to validate required fields before moving leads
CREATE OR REPLACE FUNCTION public.can_move_lead_to_column(_lead_id UUID, _target_column_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead_record RECORD;
  _custom_fields JSONB;
  _missing_fields TEXT[] := '{}';
  _field RECORD;
  _field_value TEXT;
BEGIN
  -- Buscar o lead
  SELECT id, custom_fields, column_id
  INTO _lead_record
  FROM avivar_kanban_leads
  WHERE id = _lead_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_move', true, 'missing_fields', '[]'::jsonb);
  END IF;
  
  _custom_fields := COALESCE(_lead_record.custom_fields, '{}'::jsonb);
  
  -- Buscar todos os campos obrigatórios que incluem a coluna de destino em required_for_columns
  FOR _field IN 
    SELECT field_key, field_label
    FROM avivar_column_checklists
    WHERE 
      column_id = _lead_record.column_id
      AND is_required = true
      AND required_for_columns IS NOT NULL
      AND _target_column_id::text = ANY(required_for_columns)
  LOOP
    -- Verificar se o campo está preenchido
    _field_value := _custom_fields ->> _field.field_key;
    
    IF _field_value IS NULL OR _field_value = '' THEN
      _missing_fields := array_append(_missing_fields, _field.field_label);
    END IF;
  END LOOP;
  
  -- Retornar resultado
  IF array_length(_missing_fields, 1) > 0 THEN
    RETURN jsonb_build_object(
      'can_move', false,
      'missing_fields', to_jsonb(_missing_fields)
    );
  ELSE
    RETURN jsonb_build_object(
      'can_move', true,
      'missing_fields', '[]'::jsonb
    );
  END IF;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.can_move_lead_to_column IS 'Verifica se um lead pode ser movido para uma coluna baseado nos campos obrigatórios configurados';