ALTER TABLE clinic_surgeries
  ADD COLUMN upgrade_value numeric DEFAULT 0,
  ADD COLUMN upsell_value numeric DEFAULT 0,
  ADD COLUMN deposit_paid numeric DEFAULT 0,
  ADD COLUMN remaining_paid numeric DEFAULT 0,
  ADD COLUMN balance_due numeric DEFAULT 0;