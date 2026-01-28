-- Adicionar coluna etapa_bpmn aos templates de checklist para mapear fase→etapa
ALTER TABLE public.postvenda_checklist_templates 
ADD COLUMN IF NOT EXISTS etapa_bpmn TEXT;

-- Adicionar coluna etapa_bpmn aos items de checklist (para busca eficiente)
ALTER TABLE public.postvenda_checklist_items 
ADD COLUMN IF NOT EXISTS etapa_bpmn TEXT;

-- Mapear as fases do distrato para as etapas BPMN correspondentes
UPDATE public.postvenda_checklist_templates 
SET etapa_bpmn = CASE 
  WHEN phase = 'Recepção' THEN 'solicitacao_recebida'
  WHEN phase = 'Documentação' THEN 'validacao_contato'
  WHEN phase = 'Análise' THEN 'checklist_preenchido'
  WHEN phase = 'Aprovação' THEN 'aguardando_parecer_gerente'
  WHEN phase = 'Negociação' THEN 'em_negociacao'
  WHEN phase = 'Execução' THEN 'aguardando_assinatura'
  WHEN phase = 'Finalização' THEN 'aguardando_pagamento'
  ELSE NULL
END
WHERE tipo_demanda = 'distrato';

-- Mapear para chamados genéricos (usando etapas do fluxo normal)
UPDATE public.postvenda_checklist_templates 
SET etapa_bpmn = CASE 
  WHEN phase = 'Triagem' OR phase = 'Registro' THEN 'triagem'
  WHEN phase = 'Atendimento' THEN 'atendimento'
  WHEN phase = 'Análise' OR phase = 'Resolução' THEN 'resolucao'
  WHEN phase = 'Solicitação' THEN 'triagem'
  ELSE 'triagem'
END
WHERE tipo_demanda != 'distrato' AND etapa_bpmn IS NULL;

-- Atualizar items existentes com base nos templates
UPDATE public.postvenda_checklist_items AS i
SET etapa_bpmn = t.etapa_bpmn
FROM public.postvenda_checklist_templates AS t
WHERE i.template_id = t.id AND i.etapa_bpmn IS NULL;

-- Índice para busca eficiente por etapa
CREATE INDEX IF NOT EXISTS idx_postvenda_checklist_items_etapa 
ON public.postvenda_checklist_items(chamado_id, etapa_bpmn);