-- Create table to store NeoHairScan analysis history
CREATE TABLE public.neohairscan_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    original_image_url TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('progression', 'scan', 'newversion')),
    generated_images JSONB DEFAULT '[]'::jsonb,
    hair_style TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by user
CREATE INDEX idx_neohairscan_history_user_id ON public.neohairscan_history(user_id);
CREATE INDEX idx_neohairscan_history_created_at ON public.neohairscan_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.neohairscan_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scan history
CREATE POLICY "Users can view their own scan history"
ON public.neohairscan_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own scan history
CREATE POLICY "Users can insert their own scan history"
ON public.neohairscan_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scan history
CREATE POLICY "Users can delete their own scan history"
ON public.neohairscan_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for scan images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('neohairscan', 'neohairscan', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for neohairscan bucket
CREATE POLICY "Users can upload their own scan images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'neohairscan' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own scan images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'neohairscan' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own scan images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'neohairscan' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view neohairscan images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'neohairscan');