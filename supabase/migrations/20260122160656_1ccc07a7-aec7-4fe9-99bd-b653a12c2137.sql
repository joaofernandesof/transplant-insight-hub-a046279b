-- Create announcements table for banner system
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Saiba mais',
  background_color TEXT DEFAULT '#1e3a5f',
  text_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#06b6d4',
  target_profiles TEXT[] DEFAULT ARRAY['all']::TEXT[],
  target_modules TEXT[] DEFAULT ARRAY['all']::TEXT[],
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone authenticated can read active announcements
CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));

-- Authenticated users can manage announcements (admin check done in app)
CREATE POLICY "Authenticated users can insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_announcements_active ON public.announcements(is_active, starts_at, expires_at);
CREATE INDEX idx_announcements_priority ON public.announcements(priority DESC);