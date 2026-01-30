-- Only alter column type
ALTER TABLE public.avivar_conversas ALTER COLUMN user_id TYPE text USING user_id::text;