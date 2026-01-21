-- Add investimento_trafego column to daily_metrics table
ALTER TABLE public.daily_metrics 
ADD COLUMN investimento_trafego numeric DEFAULT NULL;