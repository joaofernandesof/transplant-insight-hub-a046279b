-- Create videos library table for hybrid storage (uploads + external links)
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  
  -- Hybrid storage: either file_url (upload) or external_url (YouTube/Vimeo)
  file_url TEXT,
  external_url TEXT,
  
  -- Video metadata
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure at least one URL is provided
  CONSTRAINT video_url_required CHECK (file_url IS NOT NULL OR external_url IS NOT NULL)
);

-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 
  'videos', 
  true, 
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Public videos can be viewed by anyone
CREATE POLICY "Public videos are viewable by everyone" 
ON public.videos 
FOR SELECT 
USING (is_public = true AND is_active = true);

-- Authenticated users can view all active videos
CREATE POLICY "Authenticated users can view all videos" 
ON public.videos 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Admins can manage videos (using user_roles table)
CREATE POLICY "Admins can insert videos" 
ON public.videos 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update videos" 
ON public.videos 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete videos" 
ON public.videos 
FOR DELETE 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view public videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update videos in storage" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'videos' AND 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete videos from storage" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'videos' AND 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_videos_category ON public.videos(category);
CREATE INDEX idx_videos_tags ON public.videos USING GIN(tags);
CREATE INDEX idx_videos_is_public ON public.videos(is_public) WHERE is_active = true;