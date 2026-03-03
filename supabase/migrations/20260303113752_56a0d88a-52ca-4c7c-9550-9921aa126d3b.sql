
CREATE TABLE public.user_module_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  can_approve BOOLEAN,
  can_export BOOLEAN,
  can_configure BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_module_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user permission overrides"
ON public.user_module_permission_overrides
FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));
