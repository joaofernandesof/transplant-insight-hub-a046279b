
-- =====================================================
-- NEOTEAM SECURITY HARDENING MIGRATION
-- =====================================================
-- Corrige 28+ policies permissivas, restringe acesso
-- ao role authenticated com verificação de membership
-- =====================================================

-- 1. ENHANCE AUDIT LOG TABLE
ALTER TABLE public.neoteam_audit_log 
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS branch_id uuid,
  ADD COLUMN IF NOT EXISTS ip_address text;

-- 2. CREATE HELPER: check neoteam membership with role
CREATE OR REPLACE FUNCTION public.is_neoteam_member_safe(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neoteam_team_members
    WHERE user_id = p_user_id AND is_active = true
  );
$$;

-- 3. CREATE HELPER: audit trigger function
CREATE OR REPLACE FUNCTION public.neoteam_audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_role text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old := NULL;
    v_new := to_jsonb(NEW);
  END IF;

  -- Get actor role
  SELECT role::text INTO v_role FROM public.neoteam_team_members 
  WHERE user_id = auth.uid() AND is_active = true LIMIT 1;

  INSERT INTO public.neoteam_audit_log (
    actor_user_id, action, resource_type, resource_id, 
    old_values, new_values, actor_role
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    v_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (v_old->>'id')::uuid
      ELSE (v_new->>'id')::uuid
    END,
    v_old,
    v_new,
    COALESCE(v_role, 'SYSTEM')
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- 4. ATTACH AUDIT TRIGGERS to critical tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'neoteam_team_members', 
    'neoteam_module_permissions',
    'neoteam_sector_roles',
    'neoteam_appointments',
    'neoteam_patient_documents',
    'neoteam_doctors',
    'neoteam_branches',
    'neoteam_settings'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS neoteam_audit_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER neoteam_audit_%I 
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn()', t, t
    );
  END LOOP;
END;
$$;

-- =====================================================
-- 5. FIX PERMISSIVE POLICIES
-- =====================================================

-- === neoteam_appointments ===
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.neoteam_appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON public.neoteam_appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.neoteam_appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON public.neoteam_appointments;

CREATE POLICY "Members can view appointments"
  ON public.neoteam_appointments FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can insert appointments"
  ON public.neoteam_appointments FOR INSERT TO authenticated
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can update appointments"
  ON public.neoteam_appointments FOR UPDATE TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete appointments"
  ON public.neoteam_appointments FOR DELETE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === neoteam_branches ===
DROP POLICY IF EXISTS "Authenticated users can manage branches" ON public.neoteam_branches;
DROP POLICY IF EXISTS "Authenticated users can view branches" ON public.neoteam_branches;

CREATE POLICY "Members can view branches"
  ON public.neoteam_branches FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can manage branches"
  ON public.neoteam_branches FOR ALL TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === neoteam_patient_documents ===
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.neoteam_patient_documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.neoteam_patient_documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.neoteam_patient_documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.neoteam_patient_documents;

CREATE POLICY "Members can view documents"
  ON public.neoteam_patient_documents FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can upload documents"
  ON public.neoteam_patient_documents FOR INSERT TO authenticated
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can update documents"
  ON public.neoteam_patient_documents FOR UPDATE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete documents"
  ON public.neoteam_patient_documents FOR DELETE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === neoteam_tasks ===
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON public.neoteam_tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.neoteam_tasks;

CREATE POLICY "Members can view tasks"
  ON public.neoteam_tasks FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can insert tasks"
  ON public.neoteam_tasks FOR INSERT TO authenticated
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can update tasks"
  ON public.neoteam_tasks FOR UPDATE TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete tasks"
  ON public.neoteam_tasks FOR DELETE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === neoteam_waiting_room ===
DROP POLICY IF EXISTS "Authenticated users can view waiting room" ON public.neoteam_waiting_room;
DROP POLICY IF EXISTS "Authenticated users can insert to waiting room" ON public.neoteam_waiting_room;
DROP POLICY IF EXISTS "Authenticated users can update waiting room" ON public.neoteam_waiting_room;
DROP POLICY IF EXISTS "Authenticated users can delete from waiting room" ON public.neoteam_waiting_room;

CREATE POLICY "Members can view waiting room"
  ON public.neoteam_waiting_room FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can insert to waiting room"
  ON public.neoteam_waiting_room FOR INSERT TO authenticated
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can update waiting room"
  ON public.neoteam_waiting_room FOR UPDATE TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete from waiting room"
  ON public.neoteam_waiting_room FOR DELETE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === neoteam_settings ===
DROP POLICY IF EXISTS "Admins can manage neoteam settings" ON public.neoteam_settings;

CREATE POLICY "Admins can manage neoteam settings"
  ON public.neoteam_settings FOR ALL TO authenticated
  USING (is_neohub_admin(auth.uid()))
  WITH CHECK (is_neohub_admin(auth.uid()));

CREATE POLICY "Members can view neoteam settings"
  ON public.neoteam_settings FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()));

-- === neoteam_whatsapp_logs ===
DROP POLICY IF EXISTS "Admins can view whatsapp logs" ON public.neoteam_whatsapp_logs;

CREATE POLICY "Admins can view whatsapp logs"
  ON public.neoteam_whatsapp_logs FOR SELECT TO authenticated
  USING (is_neohub_admin(auth.uid()));

-- === neoteam_process_instance_steps (fix UPDATE true) ===
DROP POLICY IF EXISTS "Authenticated users can update instance steps" ON public.neoteam_process_instance_steps;

CREATE POLICY "Members can update instance steps"
  ON public.neoteam_process_instance_steps FOR UPDATE TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === Fix SELECT true on process tables to require membership ===
DROP POLICY IF EXISTS "Authenticated users can read instance steps" ON public.neoteam_process_instance_steps;
DROP POLICY IF EXISTS "Authenticated users can read process instances" ON public.neoteam_process_instances;
DROP POLICY IF EXISTS "Authenticated users can read step deps" ON public.neoteam_process_step_deps;
DROP POLICY IF EXISTS "Authenticated users can read process steps" ON public.neoteam_process_steps;
DROP POLICY IF EXISTS "Authenticated users can read process templates" ON public.neoteam_process_templates;
DROP POLICY IF EXISTS "Blocks visible to authenticated users" ON public.neoteam_schedule_blocks;

CREATE POLICY "Members can read instance steps"
  ON public.neoteam_process_instance_steps FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can read process instances"
  ON public.neoteam_process_instances FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can read step deps"
  ON public.neoteam_process_step_deps FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can read process steps"
  ON public.neoteam_process_steps FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can read process templates"
  ON public.neoteam_process_templates FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can view schedule blocks"
  ON public.neoteam_schedule_blocks FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- === Fix SELECT true on reference tables ===
DROP POLICY IF EXISTS "Authenticated users can view sectors" ON public.neoteam_sectors;
DROP POLICY IF EXISTS "Authenticated users can view sector modules" ON public.neoteam_sector_modules;
DROP POLICY IF EXISTS "Authenticated users can view anamnesis" ON public.neoteam_anamnesis;

CREATE POLICY "Members can view sectors"
  ON public.neoteam_sectors FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can view sector modules"
  ON public.neoteam_sector_modules FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Members can view anamnesis"
  ON public.neoteam_anamnesis FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- 6. PREVENT SELF-ROLE ESCALATION
-- Create a trigger that prevents users from changing their own role
CREATE OR REPLACE FUNCTION public.neoteam_prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role text;
BEGIN
  -- Prevent changing own role
  IF OLD.user_id = auth.uid() AND OLD.role::text IS DISTINCT FROM NEW.role::text THEN
    RAISE EXCEPTION 'Users cannot change their own role';
  END IF;

  -- Prevent non-MASTER from changing MASTER roles
  IF OLD.role::text = 'MASTER' OR NEW.role::text = 'MASTER' THEN
    IF NOT is_neoteam_master(auth.uid()) AND NOT is_neohub_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only MASTER or global admin can assign/remove MASTER role';
    END IF;
  END IF;

  -- Ensure only higher roles can change lower roles
  SELECT tm.role::text INTO actor_role FROM public.neoteam_team_members tm 
  WHERE tm.user_id = auth.uid() AND tm.is_active = true LIMIT 1;

  IF actor_role IS NULL AND NOT is_neohub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Actor has no active role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_change ON public.neoteam_team_members;
CREATE TRIGGER prevent_self_role_change
  BEFORE UPDATE ON public.neoteam_team_members
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.neoteam_prevent_self_role_change();
