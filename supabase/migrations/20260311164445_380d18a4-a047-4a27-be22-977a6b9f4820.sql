ALTER TABLE public.call_analysis
  ADD COLUMN IF NOT EXISTS closer_primeiro_impacto integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_exploracao_spin integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_conexao_emocional integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_clareza_pitch integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_gatilhos_mentais integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_gestao_fala integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_fechamento integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS closer_score_total integer DEFAULT NULL;