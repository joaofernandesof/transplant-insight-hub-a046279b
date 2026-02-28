
-- Table for form templates (system + custom)
CREATE TABLE public.ipromed_form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  icon TEXT DEFAULT 'FileText',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ipromed_form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view form templates"
  ON public.ipromed_form_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert form templates"
  ON public.ipromed_form_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update form templates"
  ON public.ipromed_form_templates FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete non-system templates"
  ON public.ipromed_form_templates FOR DELETE
  USING (auth.uid() IS NOT NULL AND is_system = false);

-- Seed law firm templates
INSERT INTO public.ipromed_form_templates (name, description, category, icon, is_system, questions) VALUES
(
  'Onboarding de Cliente',
  'Formulário padrão para coleta de dados no início do relacionamento com o cliente médico.',
  'onboarding',
  'UserPlus',
  true,
  '[
    {"id":"q1","label":"Nome completo do cliente","type":"text","required":true,"order":1},
    {"id":"q2","label":"CNPJ","type":"text","required":false,"order":2},
    {"id":"q3","label":"Endereço da clínica","type":"textarea","required":false,"order":3},
    {"id":"q4","label":"Especialidade médica","type":"text","required":true,"order":4},
    {"id":"q5","label":"Antecedência mínima para cancelamento (horas)","type":"number","required":false,"order":5},
    {"id":"q6","label":"Possui multa por cancelamento?","type":"boolean","required":false,"order":6},
    {"id":"q7","label":"Exige depósito antecipado?","type":"boolean","required":false,"order":7},
    {"id":"q8","label":"Oferece retorno ao paciente?","type":"boolean","required":false,"order":8},
    {"id":"q9","label":"Realiza teleconsulta?","type":"boolean","required":false,"order":9},
    {"id":"q10","label":"Observações adicionais","type":"textarea","required":false,"order":10}
  ]'::jsonb
),
(
  'Coleta de Documentos',
  'Checklist de documentos necessários para abertura de processo ou análise jurídica.',
  'documentos',
  'FolderOpen',
  true,
  '[
    {"id":"q1","label":"RG ou CNH do cliente","type":"boolean","required":true,"order":1},
    {"id":"q2","label":"CPF","type":"boolean","required":true,"order":2},
    {"id":"q3","label":"Comprovante de residência","type":"boolean","required":true,"order":3},
    {"id":"q4","label":"Contrato social (se PJ)","type":"boolean","required":false,"order":4},
    {"id":"q5","label":"CRM do médico","type":"boolean","required":true,"order":5},
    {"id":"q6","label":"Alvará de funcionamento","type":"boolean","required":false,"order":6},
    {"id":"q7","label":"Registro no conselho de classe","type":"boolean","required":false,"order":7},
    {"id":"q8","label":"Contratos existentes para revisão","type":"boolean","required":false,"order":8},
    {"id":"q9","label":"Documentos adicionais necessários","type":"textarea","required":false,"order":9}
  ]'::jsonb
),
(
  'Análise de Risco Médico',
  'Questionário para mapeamento de riscos jurídicos da atividade médica do cliente.',
  'risco',
  'ShieldAlert',
  true,
  '[
    {"id":"q1","label":"Especialidade principal","type":"text","required":true,"order":1},
    {"id":"q2","label":"Possui seguro de responsabilidade civil?","type":"boolean","required":true,"order":2},
    {"id":"q3","label":"Já foi alvo de processo judicial?","type":"boolean","required":true,"order":3},
    {"id":"q4","label":"Detalhes do processo (se aplicável)","type":"textarea","required":false,"order":4},
    {"id":"q5","label":"Já recebeu reclamação em órgão regulador?","type":"boolean","required":false,"order":5},
    {"id":"q6","label":"Realiza procedimentos invasivos?","type":"boolean","required":true,"order":6},
    {"id":"q7","label":"Tipo de procedimentos realizados","type":"textarea","required":false,"order":7},
    {"id":"q8","label":"Utiliza termo de consentimento?","type":"boolean","required":true,"order":8},
    {"id":"q9","label":"Nível de risco percebido","type":"select","options":["Baixo","Médio","Alto","Crítico"],"required":true,"order":9},
    {"id":"q10","label":"Observações sobre riscos","type":"textarea","required":false,"order":10}
  ]'::jsonb
),
(
  'Satisfação do Cliente',
  'Pesquisa de satisfação com os serviços jurídicos prestados pelo escritório.',
  'satisfacao',
  'Star',
  true,
  '[
    {"id":"q1","label":"Como avalia o atendimento recebido?","type":"select","options":["Excelente","Bom","Regular","Ruim"],"required":true,"order":1},
    {"id":"q2","label":"O prazo de retorno foi adequado?","type":"boolean","required":true,"order":2},
    {"id":"q3","label":"As informações foram claras e objetivas?","type":"boolean","required":true,"order":3},
    {"id":"q4","label":"Recomendaria o escritório?","type":"boolean","required":true,"order":4},
    {"id":"q5","label":"Sugestões de melhoria","type":"textarea","required":false,"order":5},
    {"id":"q6","label":"Comentário adicional","type":"textarea","required":false,"order":6}
  ]'::jsonb
),
(
  'Due Diligence - Sociedade Médica',
  'Formulário para análise de conformidade de sociedades médicas e clínicas.',
  'compliance',
  'Scale',
  true,
  '[
    {"id":"q1","label":"Razão social da sociedade","type":"text","required":true,"order":1},
    {"id":"q2","label":"CNPJ da sociedade","type":"text","required":true,"order":2},
    {"id":"q3","label":"Tipo societário","type":"select","options":["Sociedade Simples","Sociedade Limitada","EIRELI","SLU","Outro"],"required":true,"order":3},
    {"id":"q4","label":"Número de sócios","type":"number","required":true,"order":4},
    {"id":"q5","label":"Possui contrato social atualizado?","type":"boolean","required":true,"order":5},
    {"id":"q6","label":"Possui alvará sanitário vigente?","type":"boolean","required":true,"order":6},
    {"id":"q7","label":"Possui registro no CRM como PJ?","type":"boolean","required":true,"order":7},
    {"id":"q8","label":"Há pendências fiscais?","type":"boolean","required":true,"order":8},
    {"id":"q9","label":"Regime tributário atual","type":"select","options":["Simples Nacional","Lucro Presumido","Lucro Real"],"required":true,"order":9},
    {"id":"q10","label":"Observações sobre conformidade","type":"textarea","required":false,"order":10}
  ]'::jsonb
),
(
  'Revisão Contratual',
  'Checklist para revisão de contratos médicos (prestação de serviços, locação, parcerias).',
  'contratos',
  'FileCheck',
  true,
  '[
    {"id":"q1","label":"Tipo de contrato","type":"select","options":["Prestação de Serviços","Locação","Parceria","Trabalho","Outro"],"required":true,"order":1},
    {"id":"q2","label":"Partes envolvidas","type":"textarea","required":true,"order":2},
    {"id":"q3","label":"Valor envolvido (R$)","type":"text","required":false,"order":3},
    {"id":"q4","label":"Prazo de vigência","type":"text","required":false,"order":4},
    {"id":"q5","label":"Possui cláusula de rescisão?","type":"boolean","required":true,"order":5},
    {"id":"q6","label":"Possui cláusula de não-concorrência?","type":"boolean","required":false,"order":6},
    {"id":"q7","label":"Possui cláusula de confidencialidade?","type":"boolean","required":false,"order":7},
    {"id":"q8","label":"Pontos críticos identificados","type":"textarea","required":false,"order":8},
    {"id":"q9","label":"Parecer inicial","type":"textarea","required":false,"order":9}
  ]'::jsonb
);
