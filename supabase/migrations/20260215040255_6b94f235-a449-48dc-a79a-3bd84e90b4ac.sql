
-- Gamification points log
CREATE TABLE public.hotlead_gamification_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'lead_acquired', 'lead_sold', 'lead_in_service', 'fast_response', 'streak_bonus'
  points INTEGER NOT NULL DEFAULT 0,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User gamification profile (aggregated)
CREATE TABLE public.hotlead_gamification_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  achievements_unlocked TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotlead_gamification_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotlead_gamification_profiles ENABLE ROW LEVEL SECURITY;

-- Points: users can see their own, service role can insert
CREATE POLICY "Users can view their own points"
  ON public.hotlead_gamification_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.hotlead_gamification_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Profiles: users can see all (for rankings), manage their own
CREATE POLICY "Anyone can view gamification profiles"
  ON public.hotlead_gamification_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.hotlead_gamification_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.hotlead_gamification_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_gamification_points_user ON public.hotlead_gamification_points(user_id, created_at DESC);
CREATE INDEX idx_gamification_profiles_points ON public.hotlead_gamification_profiles(total_points DESC);
