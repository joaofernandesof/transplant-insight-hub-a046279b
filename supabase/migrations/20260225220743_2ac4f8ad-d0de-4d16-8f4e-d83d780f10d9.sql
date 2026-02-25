
-- Add branch_id to team members
ALTER TABLE public.neoteam_team_members
ADD COLUMN branch_id UUID REFERENCES public.neoteam_branches(id);

CREATE INDEX idx_neoteam_team_members_branch ON public.neoteam_team_members(branch_id);
