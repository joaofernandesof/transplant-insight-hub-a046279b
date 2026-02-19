-- ====================================================
-- SECURITY FIX: Restringir políticas RLS permissivas
-- ====================================================

-- 1. cleaning_environment_executions
DROP POLICY IF EXISTS "cleaning_executions_insert" ON public.cleaning_environment_executions;
CREATE POLICY "cleaning_executions_insert" ON public.cleaning_environment_executions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. cleaning_execution_items
DROP POLICY IF EXISTS "cleaning_execution_items_insert" ON public.cleaning_execution_items;
CREATE POLICY "cleaning_execution_items_insert" ON public.cleaning_execution_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. contract_review_history
DROP POLICY IF EXISTS "Sistema e jurídico criam histórico" ON public.contract_review_history;
CREATE POLICY "Sistema e jurídico criam histórico" ON public.contract_review_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- 5. ipromed_client_activities
DROP POLICY IF EXISTS "Authenticated users can insert client activities" ON public.ipromed_client_activities;
CREATE POLICY "Authenticated users can insert client activities" ON public.ipromed_client_activities
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 6. ipromed_client_meetings
DROP POLICY IF EXISTS "Authenticated users can delete meetings" ON public.ipromed_client_meetings;
CREATE POLICY "Authenticated users can delete meetings" ON public.ipromed_client_meetings
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert meetings" ON public.ipromed_client_meetings;
CREATE POLICY "Authenticated users can insert meetings" ON public.ipromed_client_meetings
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update meetings" ON public.ipromed_client_meetings;
CREATE POLICY "Authenticated users can update meetings" ON public.ipromed_client_meetings
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- 7. ipromed_contract_clients
DROP POLICY IF EXISTS "Allow authenticated delete on ipromed_contract_clients" ON public.ipromed_contract_clients;
CREATE POLICY "Allow authenticated delete on ipromed_contract_clients" ON public.ipromed_contract_clients
  FOR DELETE TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Allow authenticated insert on ipromed_contract_clients" ON public.ipromed_contract_clients;
CREATE POLICY "Allow authenticated insert on ipromed_contract_clients" ON public.ipromed_contract_clients
  FOR INSERT TO authenticated
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Allow authenticated update on ipromed_contract_clients" ON public.ipromed_contract_clients;
CREATE POLICY "Allow authenticated update on ipromed_contract_clients" ON public.ipromed_contract_clients
  FOR UPDATE TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

-- 8. ipromed_contract_documents
DROP POLICY IF EXISTS "Authenticated users can delete contract documents" ON public.ipromed_contract_documents;
CREATE POLICY "Authenticated users can delete contract documents" ON public.ipromed_contract_documents
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert contract documents" ON public.ipromed_contract_documents;
CREATE POLICY "Authenticated users can insert contract documents" ON public.ipromed_contract_documents
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- 9. ipromed_contract_installments
DROP POLICY IF EXISTS "Authenticated users can delete installments" ON public.ipromed_contract_installments;
CREATE POLICY "Authenticated users can delete installments" ON public.ipromed_contract_installments
  FOR DELETE TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Authenticated users can insert installments" ON public.ipromed_contract_installments;
CREATE POLICY "Authenticated users can insert installments" ON public.ipromed_contract_installments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Authenticated users can update installments" ON public.ipromed_contract_installments;
CREATE POLICY "Authenticated users can update installments" ON public.ipromed_contract_installments
  FOR UPDATE TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

-- 10. ipromed_payment_history (usa registered_by, não created_by)
DROP POLICY IF EXISTS "Authenticated users can insert payment history" ON public.ipromed_payment_history;
CREATE POLICY "Authenticated users can insert payment history" ON public.ipromed_payment_history
  FOR INSERT TO authenticated
  WITH CHECK (registered_by = auth.uid());

-- 11. neoteam_anamnesis
DROP POLICY IF EXISTS "Authenticated users can create anamnesis" ON public.neoteam_anamnesis;
CREATE POLICY "Staff can create anamnesis" ON public.neoteam_anamnesis
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can update anamnesis" ON public.neoteam_anamnesis;
CREATE POLICY "Staff can update anamnesis" ON public.neoteam_anamnesis
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- 13. student_referrals: REMOVER acesso anônimo
DROP POLICY IF EXISTS "Allow anonymous referral submissions" ON public.student_referrals;
CREATE POLICY "Authenticated users can submit referrals" ON public.student_referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 14. survey_ai_insights
DROP POLICY IF EXISTS "Authenticated users can create survey insights" ON public.survey_ai_insights;
CREATE POLICY "Admins can create survey insights" ON public.survey_ai_insights
  FOR INSERT TO authenticated
  WITH CHECK (public.is_neohub_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update survey insights" ON public.survey_ai_insights;
CREATE POLICY "Admins can update survey insights" ON public.survey_ai_insights
  FOR UPDATE TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- 15. system_event_logs: remover anon INSERT
DROP POLICY IF EXISTS "Anonymous can insert page view logs" ON public.system_event_logs;

DROP POLICY IF EXISTS "Authenticated users can insert event logs" ON public.system_event_logs;
CREATE POLICY "Authenticated users can insert event logs" ON public.system_event_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());