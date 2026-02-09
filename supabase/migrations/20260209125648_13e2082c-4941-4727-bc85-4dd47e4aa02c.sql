
-- Update delete_lead_cascade to ALSO delete from avivar_kanban_leads
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
  v_deleted_kanban_leads INTEGER := 0;
  v_lead_name TEXT;
  v_lead_phone TEXT;
BEGIN
  SELECT name, phone INTO v_lead_name, v_lead_phone FROM public.leads WHERE id = p_lead_id;
  
  IF v_lead_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead não encontrado');
  END IF;

  -- 1. Delete followup executions
  DELETE FROM public.avivar_followup_executions WHERE lead_id = p_lead_id;
  GET DIAGNOSTICS v_deleted_followups = ROW_COUNT;

  -- 2. Delete appointment reminders first (FK to appointments)
  DELETE FROM public.avivar_appointment_reminders WHERE appointment_id IN (
    SELECT id FROM public.avivar_appointments WHERE lead_id = p_lead_id
  );

  -- 3. Delete appointments
  DELETE FROM public.avivar_appointments WHERE lead_id = p_lead_id;
  GET DIAGNOSTICS v_deleted_appointments = ROW_COUNT;

  -- 4. Delete CRM messages
  DELETE FROM public.crm_messages
  WHERE conversation_id IN (
    SELECT id FROM public.crm_conversations WHERE lead_id = p_lead_id
  );
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

  -- 5. Delete CRM conversations
  DELETE FROM public.crm_conversations WHERE lead_id = p_lead_id;
  GET DIAGNOSTICS v_deleted_conversations = ROW_COUNT;

  -- 6. Delete patient journeys
  DELETE FROM public.avivar_patient_journeys
  WHERE patient_phone = v_lead_phone;
  GET DIAGNOSTICS v_deleted_journeys = ROW_COUNT;

  -- 7. Delete from avivar_kanban_leads (by matching phone)
  IF v_lead_phone IS NOT NULL THEN
    DELETE FROM public.avivar_kanban_leads WHERE phone = v_lead_phone;
    GET DIAGNOSTICS v_deleted_kanban_leads = ROW_COUNT;
  END IF;

  -- 8. Delete the lead itself
  DELETE FROM public.leads WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_name', v_lead_name,
    'deleted', jsonb_build_object(
      'messages', v_deleted_messages,
      'conversations', v_deleted_conversations,
      'journeys', v_deleted_journeys,
      'kanban_leads', v_deleted_kanban_leads
    )
  );
END;
$$;

-- Update delete_avivar_kanban_lead_cascade to ALSO delete appointments/reminders
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
  v_deleted_leads INTEGER := 0;
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

  IF v_phone IS NOT NULL THEN
    -- 1. Delete CRM messages
    DELETE FROM public.crm_messages
    WHERE conversation_id IN (
      SELECT c.id FROM public.crm_conversations c
      JOIN public.leads l ON l.id = c.lead_id
      WHERE l.phone = v_phone
    );
    GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;

    -- 2. Delete followup executions
    DELETE FROM public.avivar_followup_executions
    WHERE lead_id IN (SELECT id FROM public.leads WHERE phone = v_phone);

    -- 3. Delete appointment reminders
    DELETE FROM public.avivar_appointment_reminders
    WHERE appointment_id IN (
      SELECT id FROM public.avivar_appointments
      WHERE lead_id IN (SELECT id FROM public.leads WHERE phone = v_phone)
    );

    -- 4. Delete appointments
    DELETE FROM public.avivar_appointments
    WHERE lead_id IN (SELECT id FROM public.leads WHERE phone = v_phone);

    -- 5. Delete CRM conversations
    DELETE FROM public.crm_conversations 
    WHERE lead_id IN (SELECT id FROM public.leads WHERE phone = v_phone);
    GET DIAGNOSTICS v_deleted_conversations = ROW_COUNT;

    -- 6. Delete patient journeys
    DELETE FROM public.avivar_patient_journeys
    WHERE patient_phone = v_phone;
    GET DIAGNOSTICS v_deleted_journeys = ROW_COUNT;

    -- 7. Delete from leads table
    DELETE FROM public.leads WHERE phone = v_phone;
    GET DIAGNOSTICS v_deleted_leads = ROW_COUNT;
  END IF;

  -- 8. Delete the kanban lead itself
  DELETE FROM public.avivar_kanban_leads WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_name', v_lead.name,
    'phone', v_phone,
    'deleted', jsonb_build_object(
      'messages', v_deleted_messages,
      'conversations', v_deleted_conversations,
      'journeys', v_deleted_journeys,
      'leads', v_deleted_leads
    )
  );
END;
$$;
