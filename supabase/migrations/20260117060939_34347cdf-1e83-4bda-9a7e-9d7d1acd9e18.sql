-- Allow authenticated users to view basic profile info for leaderboard
CREATE POLICY "Authenticated users can view leaderboard data"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: This policy allows viewing all profiles for the leaderboard
-- The existing policies already restrict based on user_id, but we need to allow
-- reading basic data (name, avatar, total_points) for the leaderboard