-- Add CRM and RQE fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS crm text,
ADD COLUMN IF NOT EXISTS rqe text;