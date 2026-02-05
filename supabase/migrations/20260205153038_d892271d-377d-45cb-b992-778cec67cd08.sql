-- Drop cadence tables (isolated, no FKs to other tables)
-- These tables are no longer used since Follow-up covers this functionality

-- First drop the tables that depend on others (due to FKs)
DROP TABLE IF EXISTS public.avivar_cadence_messages CASCADE;
DROP TABLE IF EXISTS public.avivar_cadence_executions CASCADE;
DROP TABLE IF EXISTS public.avivar_cadence_steps CASCADE;
DROP TABLE IF EXISTS public.avivar_cadence_sequences CASCADE;