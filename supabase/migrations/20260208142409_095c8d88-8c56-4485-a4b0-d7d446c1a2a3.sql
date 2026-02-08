
CREATE OR REPLACE FUNCTION public.delete_lead_cascade(p_lead_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_conversations INTEGER := 0;
  v_deleted_messages INTEGER := 0;
  v_deleted_journeys INTEGER := 0;
  v_deleted_followups INTEGER := 0;
  v_deleted_appointments INTEGER := 0;
  v_lead_name TEXT;
BEGIN
  SELECT name INTO v_lead_name FROM public.leads WHERE id = p_lead_id;
  
  IF v_lead_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead não encontrado');
  END IF;

  -- 1. Delete followup executions
  DELETE FROM public.avivar_followup_executions WHERE lead_id = p_lead_id;
  GET DIAGNOSTICS v_deleted_followups = ROW_COUNT;

  -- 2. Delete appointments
  DELETE FROM public.avivar_appointments WHERE lead_id = p_lead_id;
  GET DIAGNOSTICS v_deleted_appointments = ROW_COUNT;

  -- 3. Delete CRM messages
  DELETE FROM public.crm_messages
  WHERE conversation_id IN (
    SELECT id FROM public.crm_conversations WHERE lead_id = p_lead_id
  );
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

  -- 4. Delete CRM conversations
  DELETE FROM public.crm_conversations WHERE lead_id = p_lead_id;
  GET DIAGNOSTICS v_deleted_conversations = ROW_COUNT;

  -- 5. Delete patient journeys
  DELETE FROM public.avivar_patient_journeys
  WHERE id IN (
    SELECT apj.id FROM public.avivar_patient_journeys apj
    JOIN public.leads l ON l.id = p_lead_id
    WHERE apj.patient_phone = l.phone OR apj.patient_name = l.name
  );
  GET DIAGNOSTICS v_deleted_journeys = ROW_COUNT;

  -- 6. Delete the lead
  DELETE FROM public.leads WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_name', v_lead_name,
    'deleted', jsonb_build_object(
      'messages', v_deleted_messages,
      'conversations', v_deleted_conversations,
      'journeys', v_deleted_journeys
    )
  );
END;
$$;
