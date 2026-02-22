-- Add new enum values for the redesigned distrato flow

-- New etapa values
ALTER TYPE public.distrato_etapa_bpmn ADD VALUE IF NOT EXISTS 'aguardando_negociacao';
ALTER TYPE public.distrato_etapa_bpmn ADD VALUE IF NOT EXISTS 'retido';
ALTER TYPE public.distrato_etapa_bpmn ADD VALUE IF NOT EXISTS 'produzir_distrato';
ALTER TYPE public.distrato_etapa_bpmn ADD VALUE IF NOT EXISTS 'gerar_contas_pagar';
ALTER TYPE public.distrato_etapa_bpmn ADD VALUE IF NOT EXISTS 'realizar_pagamento';
ALTER TYPE public.distrato_etapa_bpmn ADD VALUE IF NOT EXISTS 'enviar_comprovante';

-- New decisao values
ALTER TYPE public.distrato_decisao ADD VALUE IF NOT EXISTS 'retido';
ALTER TYPE public.distrato_decisao ADD VALUE IF NOT EXISTS 'nao_retido_com_contrato';
ALTER TYPE public.distrato_decisao ADD VALUE IF NOT EXISTS 'nao_retido_sem_contrato';
ALTER TYPE public.distrato_decisao ADD VALUE IF NOT EXISTS 'sem_definicao';

-- Add columns for new flow fields
ALTER TABLE public.postvenda_chamados
  ADD COLUMN IF NOT EXISTS distrato_sem_definicao_motivo TEXT,
  ADD COLUMN IF NOT EXISTS distrato_retencao_info TEXT,
  ADD COLUMN IF NOT EXISTS distrato_sla_renovado_em TIMESTAMPTZ;