-- Create clinics table (linked to profiles)
CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Create weekly_metrics table for storing weekly data
CREATE TABLE public.weekly_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
    year INTEGER NOT NULL DEFAULT 2026,
    values JSONB NOT NULL DEFAULT '{}',
    is_filled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(clinic_id, week_number, year)
);

-- Enable RLS on weekly_metrics
ALTER TABLE public.weekly_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinics table

-- Users can view their own clinic
CREATE POLICY "Users can view their own clinic"
ON public.clinics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all clinics
CREATE POLICY "Admins can view all clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can create their own clinic
CREATE POLICY "Users can create their own clinic"
ON public.clinics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own clinic
CREATE POLICY "Users can update their own clinic"
ON public.clinics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for weekly_metrics table

-- Users can view metrics for their own clinic
CREATE POLICY "Users can view their own clinic metrics"
ON public.weekly_metrics
FOR SELECT
TO authenticated
USING (
    clinic_id IN (
        SELECT id FROM public.clinics WHERE user_id = auth.uid()
    )
);

-- Admins can view all metrics (read-only for security)
CREATE POLICY "Admins can view all clinic metrics"
ON public.weekly_metrics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert metrics for their own clinic
CREATE POLICY "Users can insert their own clinic metrics"
ON public.weekly_metrics
FOR INSERT
TO authenticated
WITH CHECK (
    clinic_id IN (
        SELECT id FROM public.clinics WHERE user_id = auth.uid()
    )
);

-- Users can update metrics for their own clinic
CREATE POLICY "Users can update their own clinic metrics"
ON public.weekly_metrics
FOR UPDATE
TO authenticated
USING (
    clinic_id IN (
        SELECT id FROM public.clinics WHERE user_id = auth.uid()
    )
);

-- Users can delete metrics for their own clinic
CREATE POLICY "Users can delete their own clinic metrics"
ON public.weekly_metrics
FOR DELETE
TO authenticated
USING (
    clinic_id IN (
        SELECT id FROM public.clinics WHERE user_id = auth.uid()
    )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinics_updated_at
    BEFORE UPDATE ON public.clinics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_metrics_updated_at
    BEFORE UPDATE ON public.weekly_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for user_roles to prevent privilege escalation
-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));