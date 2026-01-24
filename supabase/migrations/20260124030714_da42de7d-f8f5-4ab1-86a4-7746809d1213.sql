-- Add column to track effective time (only when page is visible)
ALTER TABLE public.satisfaction_survey_responses 
ADD COLUMN IF NOT EXISTS effective_time_seconds integer DEFAULT 0;

-- Also add to day1_satisfaction_surveys
ALTER TABLE public.day1_satisfaction_surveys 
ADD COLUMN IF NOT EXISTS effective_time_seconds integer DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.satisfaction_survey_responses.effective_time_seconds IS 'Time in seconds the user spent with the page visible (excludes minimized/hidden time)';
COMMENT ON COLUMN public.day1_satisfaction_surveys.effective_time_seconds IS 'Time in seconds the user spent with the page visible (excludes minimized/hidden time)';