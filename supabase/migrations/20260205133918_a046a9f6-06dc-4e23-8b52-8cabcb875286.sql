-- Add audio support fields to avivar_followup_rules
ALTER TABLE public.avivar_followup_rules
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_type TEXT CHECK (audio_type IN ('ptt', 'audio')),
ADD COLUMN IF NOT EXISTS audio_forward BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.avivar_followup_rules.audio_url IS 'URL do arquivo de áudio a ser enviado no follow-up';
COMMENT ON COLUMN public.avivar_followup_rules.audio_type IS 'Tipo de envio: ptt = mensagem de voz gravada, audio = arquivo de áudio encaminhado';
COMMENT ON COLUMN public.avivar_followup_rules.audio_forward IS 'Se true, marca o áudio como "Encaminhada" no WhatsApp';