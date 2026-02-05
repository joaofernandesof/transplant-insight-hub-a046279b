-- Add video_gallery column to avivar_agents for AI video sending
ALTER TABLE public.avivar_agents 
ADD COLUMN IF NOT EXISTS video_gallery JSONB DEFAULT NULL;