
-- ============================================
-- FIX 1: Restrict event_checklists and event_checklist_items to staff/admin only
-- ============================================

-- Drop existing overly permissive policies on event_checklists
DROP POLICY IF EXISTS "Authenticated users can view checklists" ON public.event_checklists;
DROP POLICY IF EXISTS "Authenticated users can insert checklists" ON public.event_checklists;
DROP POLICY IF EXISTS "Authenticated users can update checklists" ON public.event_checklists;

-- Create staff/admin-restricted policies for event_checklists
CREATE POLICY "Staff and admins can view checklists"
ON public.event_checklists FOR SELECT TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

CREATE POLICY "Staff and admins can insert checklists"
ON public.event_checklists FOR INSERT TO authenticated
WITH CHECK (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

CREATE POLICY "Staff and admins can update checklists"
ON public.event_checklists FOR UPDATE TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

-- Drop existing overly permissive policies on event_checklist_items
DROP POLICY IF EXISTS "Authenticated users can view checklist items" ON public.event_checklist_items;
DROP POLICY IF EXISTS "Authenticated users can insert checklist items" ON public.event_checklist_items;
DROP POLICY IF EXISTS "Authenticated users can update checklist items" ON public.event_checklist_items;
DROP POLICY IF EXISTS "Authenticated users can delete checklist items" ON public.event_checklist_items;

-- Create staff/admin-restricted policies for event_checklist_items
CREATE POLICY "Staff and admins can view checklist items"
ON public.event_checklist_items FOR SELECT TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

CREATE POLICY "Staff and admins can insert checklist items"
ON public.event_checklist_items FOR INSERT TO authenticated
WITH CHECK (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

CREATE POLICY "Staff and admins can update checklist items"
ON public.event_checklist_items FOR UPDATE TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

CREATE POLICY "Staff and admins can delete checklist items"
ON public.event_checklist_items FOR DELETE TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'event_checklists')
);

-- ============================================
-- FIX 2: Make neohairscan bucket private
-- ============================================

UPDATE storage.buckets SET public = false WHERE id = 'neohairscan';

DROP POLICY IF EXISTS "Public can view neohairscan images" ON storage.objects;

-- Keep authenticated owner-based access
CREATE POLICY "Authenticated users can view own neohairscan images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'neohairscan' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_neohub_admin(auth.uid())
  )
);
