
-- Tabela process_cases com todos os 44 campos
CREATE TABLE public.process_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- SEÇÃO 1: Identificação do Processo
  numero_processo TEXT,
  natureza_acao TEXT,
  tipo_acao TEXT,
  polo_processo TEXT,

  -- SEÇÃO 2: Partes Envolvidas
  cliente_representado TEXT,
  cpf_cnpj_cliente TEXT,
  parte_contraria TEXT,
  cpf_cnpj_parte_contraria TEXT,

  -- SEÇÃO 3: Responsáveis
  advogado_responsavel TEXT,
  escritorio_responsavel TEXT,
  area_juridica TEXT,

  -- SEÇÃO 4: Localização Processual
  orgao_vara TEXT,
  tribunal TEXT,
  estado_uf TEXT,
  cidade TEXT,
  sistema_plataforma TEXT,

  -- SEÇÃO 5: Status Processual
  fase_processual TEXT,
  situacao_atual TEXT,
  data_distribuicao DATE,
  data_citacao DATE,
  data_ultima_movimentacao DATE,
  proximo_prazo DATE,
  tipo_prazo TEXT,
  responsavel_prazo TEXT,

  -- SEÇÃO 6: Dados Financeiros
  valor_causa NUMERIC(15,2),
  valor_risco NUMERIC(15,2),
  probabilidade_exito TEXT,
  impacto_financeiro TEXT,
  status_financeiro TEXT,
  tipo_honorario TEXT,
  valor_honorarios NUMERIC(15,2),

  -- SEÇÃO 7: Descrição e Estratégia
  objeto_processo TEXT,
  resumo_caso TEXT,
  estrategia_juridica TEXT,
  observacoes_gerais TEXT,

  -- SEÇÃO 8: Audiências e Acordos
  possui_audiencia TEXT DEFAULT 'Não',
  data_audiencia DATE,
  tipo_audiencia TEXT,
  possui_acordo TEXT DEFAULT 'Não',
  valor_acordo NUMERIC(15,2),

  -- SEÇÃO 9: Documentos e Encerramento
  documentos_anexados TEXT DEFAULT 'Não',
  link_documentos TEXT,
  data_encerramento DATE,
  motivo_encerramento TEXT
);

-- Enable RLS
ALTER TABLE public.process_cases ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated ipromed/admin users
CREATE POLICY "process_cases_select" ON public.process_cases
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "process_cases_insert" ON public.process_cases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "process_cases_update" ON public.process_cases
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "process_cases_delete" ON public.process_cases
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_process_cases_updated_at
  BEFORE UPDATE ON public.process_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
