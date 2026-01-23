-- Add profile visibility setting to neohub_users
ALTER TABLE public.neohub_users 
ADD COLUMN IF NOT EXISTS profile_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bio text;

-- Update RLS to allow users to see other users' basic info when profile is public
-- The hook will filter by profile_public in the frontend for now

COMMENT ON COLUMN public.neohub_users.profile_public IS 'Whether this user profile is visible to other students in the community';
COMMENT ON COLUMN public.neohub_users.bio IS 'User bio/description for their public profile';