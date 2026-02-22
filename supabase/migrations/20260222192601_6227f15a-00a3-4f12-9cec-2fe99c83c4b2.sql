-- Insert new SLA entries for the redesigned distrato flow
INSERT INTO public.postvenda_distrato_sla (etapa, horas_corridas, horas_uteis, descricao) VALUES
  ('aguardando_negociacao', NULL, 24, 'Negociação da gerência - 24h úteis'),
  ('produzir_distrato', NULL, NULL, 'Produção do documento de distrato'),
  ('gerar_contas_pagar', NULL, NULL, 'Geração de contas a pagar'),
  ('realizar_pagamento', NULL, NULL, 'Pagamento na data prevista'),
  ('enviar_comprovante', NULL, NULL, 'Envio de comprovante por e-mail')
ON CONFLICT (etapa) DO NOTHING;