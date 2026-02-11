ALTER TABLE avivar_appointments DROP CONSTRAINT avivar_appointments_status_check;
ALTER TABLE avivar_appointments ADD CONSTRAINT avivar_appointments_status_check
  CHECK (status = ANY (ARRAY[
    'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show', 'pending_confirmation'
  ]));