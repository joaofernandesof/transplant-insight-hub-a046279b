ALTER TABLE avivar_followup_rules 
ADD COLUMN IF NOT EXISTS applicable_kanban_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applicable_column_ids UUID[] DEFAULT NULL;