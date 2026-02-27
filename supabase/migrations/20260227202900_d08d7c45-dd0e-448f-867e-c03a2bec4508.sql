
-- Community posts table
CREATE TABLE public.neoacademy_community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Community post likes
CREATE TABLE public.neoacademy_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.neoacademy_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Community post comments
CREATE TABLE public.neoacademy_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.neoacademy_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Gamification: user points
CREATE TABLE public.neoacademy_user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id),
  user_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  lessons_completed INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- Achievements/badges
CREATE TABLE public.neoacademy_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id),
  code VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR DEFAULT '🏆',
  points INTEGER DEFAULT 0,
  requirement_type VARCHAR DEFAULT 'manual',
  requirement_value INTEGER DEFAULT 1,
  category VARCHAR DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements (unlocked badges)
CREATE TABLE public.neoacademy_user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.neoacademy_achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.neoacademy_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies: community posts (readable by all authenticated, writable by author)
CREATE POLICY "Authenticated users can view posts" ON public.neoacademy_community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create posts" ON public.neoacademy_community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.neoacademy_community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.neoacademy_community_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS: likes
CREATE POLICY "Authenticated users can view likes" ON public.neoacademy_post_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can like posts" ON public.neoacademy_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.neoacademy_post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS: comments
CREATE POLICY "Authenticated users can view comments" ON public.neoacademy_post_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create comments" ON public.neoacademy_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.neoacademy_post_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS: user points (readable by all, writable by system/self)
CREATE POLICY "Authenticated users can view points" ON public.neoacademy_user_points FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own points" ON public.neoacademy_user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON public.neoacademy_user_points FOR UPDATE USING (auth.uid() = user_id);

-- RLS: achievements (readable by all)
CREATE POLICY "Authenticated users can view achievements" ON public.neoacademy_achievements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage achievements" ON public.neoacademy_achievements FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- RLS: user achievements
CREATE POLICY "Authenticated users can view user achievements" ON public.neoacademy_user_achievements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own achievements" ON public.neoacademy_user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
