
-- Add branch_id to process templates for branch-specific flows
ALTER TABLE public.neoteam_process_templates
ADD COLUMN branch_id uuid REFERENCES public.neoteam_branches(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_process_templates_branch ON public.neoteam_process_templates(branch_id);
