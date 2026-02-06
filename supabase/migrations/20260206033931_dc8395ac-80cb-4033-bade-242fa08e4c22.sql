
-- Drop the legacy text-typed overload that causes ambiguity
DROP FUNCTION IF EXISTS public.get_or_create_avivar_conversa(text, text, text, text);
