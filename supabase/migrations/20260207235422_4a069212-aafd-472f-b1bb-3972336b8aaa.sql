
CREATE OR REPLACE FUNCTION public.delete_avivar_kanban_lead_cascade(p_lead_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
  v_deleted_conversations INTEGER := 0;
  v_deleted_messages INTEGER := 0;
  v_deleted_journeys INTEGER := 0;
  v_phone TEXT;
BEGIN
  -- Get lead info
  SELECT * INTO v_lead FROM public.avivar_kanban_leads WHERE id = p_lead_id;
  
  IF v_lead IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lead não encontrado'
    );
  END IF;

  v_phone := v_lead.phone;

  -- 1. Delete CRM messages (through conversations linked to phone/lead)
  DELETE FROM public.crm_messages
  WHERE conversation_id IN (
    SELECT c.id FROM public.crm_conversations c
    JOIN public.leads l ON l.id = c.lead_id
    WHERE l.phone = v_phone
  );
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

  -- 2. Delete followup executions linked to leads with this phone
  DELETE FROM public.avivar_followup_executions
  WHERE lead_id IN (
    SELECT id FROM public.leads WHERE phone = v_phone
  );

  -- 3. Delete CRM conversations
  DELETE FROM public.crm_conversations 
  WHERE lead_id IN (
    SELECT id FROM public.leads WHERE phone = v_phone
  );
  GET DIAGNOSTICS v_deleted_conversations = ROW_COUNT;

  -- 4. Delete from leads table (if linked by phone)
  DELETE FROM public.leads WHERE phone = v_phone;

  -- 5. Delete patient journeys (by matching phone)
  DELETE FROM public.avivar_patient_journeys
  WHERE patient_phone = v_phone;
  GET DIAGNOSTICS v_deleted_journeys = ROW_COUNT;

  -- 6. Finally delete the kanban lead itself
  DELETE FROM public.avivar_kanban_leads WHERE id = p_lead_id;

  -- Contato (avivar_contacts) é PRESERVADO!

  RETURN jsonb_build_object(
    'success', true,
    'lead_name', v_lead.name,
    'phone', v_phone,
    'deleted', jsonb_build_object(
      'messages', v_deleted_messages,
      'conversations', v_deleted_conversations,
      'journeys', v_deleted_journeys
    )
  );
END;
$$;
