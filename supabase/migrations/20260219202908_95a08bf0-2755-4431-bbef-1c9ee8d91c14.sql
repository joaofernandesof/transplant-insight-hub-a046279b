
-- Add webhook_slug to avivar_api_tokens for URL-based auth (like n8n)
ALTER TABLE public.avivar_api_tokens 
ADD COLUMN webhook_slug TEXT UNIQUE;

-- Generate slugs for existing tokens
UPDATE public.avivar_api_tokens 
SET webhook_slug = LOWER(SUBSTRING(MD5(id::text || created_at::text || random()::text) FROM 1 FOR 16))
WHERE webhook_slug IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.avivar_api_tokens 
ALTER COLUMN webhook_slug SET NOT NULL;

-- Create index for fast slug lookups
CREATE INDEX idx_avivar_api_tokens_webhook_slug ON public.avivar_api_tokens(webhook_slug);

-- RPC to validate by slug (no token/hash needed)
CREATE OR REPLACE FUNCTION public.validate_api_token_by_slug(p_slug text)
RETURNS TABLE(account_id uuid, permissions text[], token_id uuid, target_kanban_id uuid, target_column_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.account_id, t.permissions, t.id as token_id, t.target_kanban_id, t.target_column_id
  FROM public.avivar_api_tokens t
  WHERE t.webhook_slug = p_slug
    AND t.is_active = true
    AND (t.expires_at IS NULL OR t.expires_at > now())
  LIMIT 1;
$$;
