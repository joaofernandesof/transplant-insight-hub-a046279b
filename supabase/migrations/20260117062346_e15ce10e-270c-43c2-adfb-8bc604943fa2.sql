-- Create user_goals table for personalized monthly goals
CREATE TABLE public.user_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    leads_goal INTEGER NOT NULL DEFAULT 10,
    courses_goal INTEGER NOT NULL DEFAULT 2,
    points_goal INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own goals
CREATE POLICY "Users can view their own goals"
ON public.user_goals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own goals
CREATE POLICY "Users can insert their own goals"
ON public.user_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update their own goals"
ON public.user_goals
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete their own goals"
ON public.user_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();