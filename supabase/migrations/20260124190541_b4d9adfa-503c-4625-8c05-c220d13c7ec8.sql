-- Add fields to course_galleries to link to exam or survey requirements
ALTER TABLE public.course_galleries 
ADD COLUMN required_exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
ADD COLUMN required_survey_type VARCHAR(50),
ADD COLUMN unlock_requirement VARCHAR(20) DEFAULT 'none' 
  CHECK (unlock_requirement IN ('none', 'exam', 'survey'));

-- Add index for faster lookups
CREATE INDEX idx_course_galleries_unlock ON public.course_galleries(unlock_requirement) 
  WHERE unlock_requirement != 'none';

COMMENT ON COLUMN public.course_galleries.required_exam_id IS 'Exam that must be completed to unlock this gallery';
COMMENT ON COLUMN public.course_galleries.required_survey_type IS 'Survey type that must be completed to unlock (e.g., day1_satisfaction)';
COMMENT ON COLUMN public.course_galleries.unlock_requirement IS 'Type of requirement to unlock gallery: none, exam, or survey';