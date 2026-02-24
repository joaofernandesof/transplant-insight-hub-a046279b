-- Notifications table for CPG portal
CREATE TABLE IF NOT EXISTS public.ipromed_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ipromed_notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.ipromed_notifications FOR SELECT
USING (
  user_id IN (
    SELECT nu.id FROM neohub_users nu WHERE nu.user_id = auth.uid()
  )
);

-- Users can update their own (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.ipromed_notifications FOR UPDATE
USING (
  user_id IN (
    SELECT nu.id FROM neohub_users nu WHERE nu.user_id = auth.uid()
  )
);

-- Service role can insert
CREATE POLICY "Service role can insert notifications"
ON public.ipromed_notifications FOR INSERT
WITH CHECK (true);

-- Index for quick lookups
CREATE INDEX idx_ipromed_notifications_user_type ON public.ipromed_notifications (user_id, type, is_read);
CREATE INDEX idx_ipromed_notifications_created ON public.ipromed_notifications (created_at DESC);