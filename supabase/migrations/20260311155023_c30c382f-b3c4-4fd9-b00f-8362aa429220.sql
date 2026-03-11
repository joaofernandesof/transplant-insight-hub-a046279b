-- Add 'fireflies' to the sales_call_fonte enum
ALTER TYPE sales_call_fonte ADD VALUE IF NOT EXISTS 'fireflies';

-- Add external_id column to prevent duplicate imports
ALTER TABLE sales_calls ADD COLUMN IF NOT EXISTS external_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_calls_external_id ON sales_calls (external_id) WHERE external_id IS NOT NULL;