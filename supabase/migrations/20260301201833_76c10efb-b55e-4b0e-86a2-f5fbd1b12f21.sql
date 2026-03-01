
-- Tabela de entradas do diário de bordo
CREATE TABLE public.neoteam_diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.neoteam_diary_entries ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas próprias entradas
CREATE POLICY "Users can view own diary entries"
ON public.neoteam_diary_entries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Usuários criam apenas suas próprias entradas
CREATE POLICY "Users can insert own diary entries"
ON public.neoteam_diary_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Usuários editam apenas suas próprias entradas
CREATE POLICY "Users can update own diary entries"
ON public.neoteam_diary_entries FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Usuários deletam apenas suas próprias entradas
CREATE POLICY "Users can delete own diary entries"
ON public.neoteam_diary_entries FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins veem todas as entradas
CREATE POLICY "Admins can view all diary entries"
ON public.neoteam_diary_entries FOR SELECT TO authenticated
USING (public.is_neohub_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_neoteam_diary_entries_updated_at
BEFORE UPDATE ON public.neoteam_diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
