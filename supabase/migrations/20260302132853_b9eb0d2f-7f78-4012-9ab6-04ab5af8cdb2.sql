
-- Function to check if a lead already exists in the account by phone or email
CREATE OR REPLACE FUNCTION public.check_duplicate_kanban_lead(
  p_account_id UUID,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_exclude_lead_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, phone TEXT, email TEXT, kanban_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    akl.id,
    akl.name,
    akl.phone,
    akl.email,
    akl.kanban_id
  FROM avivar_kanban_leads akl
  WHERE akl.account_id = p_account_id
    AND (p_exclude_lead_id IS NULL OR akl.id != p_exclude_lead_id)
    AND (
      (p_phone IS NOT NULL AND p_phone != '' AND akl.phone = p_phone)
      OR
      (p_email IS NOT NULL AND p_email != '' AND akl.email = p_email)
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
