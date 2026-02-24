-- Allow surgery_date to be NULL for "Sem data definida" cases
ALTER TABLE surgery_schedule ALTER COLUMN surgery_date DROP NOT NULL;