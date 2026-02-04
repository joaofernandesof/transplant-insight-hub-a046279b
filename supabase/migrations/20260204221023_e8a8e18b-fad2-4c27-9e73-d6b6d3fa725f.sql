-- Add column to store which columns require this field to be filled before moving leads
ALTER TABLE public.avivar_column_checklists 
ADD COLUMN IF NOT EXISTS required_for_columns text[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.avivar_column_checklists.required_for_columns IS 'Array of column IDs where this field must be filled before a lead can be moved to that column';