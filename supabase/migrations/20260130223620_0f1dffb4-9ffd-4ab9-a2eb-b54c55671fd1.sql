-- Drop ALL versions of the function
DROP FUNCTION IF EXISTS public.get_or_create_avivar_conversa(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.get_or_create_avivar_conversa(text, text, text, text);

-- Drop foreign key constraint
ALTER TABLE public.avivar_conversas DROP CONSTRAINT IF EXISTS avivar_conversas_user_id_fkey;