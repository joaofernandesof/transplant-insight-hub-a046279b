
-- Allow NULL start_date for pending courses
ALTER TABLE course_classes ALTER COLUMN start_date DROP NOT NULL;

-- Also update the status constraint to allow more statuses
ALTER TABLE course_classes DROP CONSTRAINT IF EXISTS course_classes_status_check;
ALTER TABLE course_classes ADD CONSTRAINT course_classes_status_check 
  CHECK (status IN ('active', 'inactive', 'completed', 'pending', 'confirmed', 'in_progress'));
