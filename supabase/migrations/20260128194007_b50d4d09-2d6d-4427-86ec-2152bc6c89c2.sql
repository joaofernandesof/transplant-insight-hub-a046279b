-- Add distrato-specific columns to postvenda_chamados table
ALTER TABLE public.postvenda_chamados 
ADD COLUMN IF NOT EXISTS distrato_valor_pago NUMERIC,
ADD COLUMN IF NOT EXISTS distrato_data_pagamento_sinal DATE,
ADD COLUMN IF NOT EXISTS distrato_forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS distrato_termo_sinal_assinado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS distrato_termo_sinal_anexo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS distrato_contrato_assinado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS distrato_contrato_anexo BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.postvenda_chamados.distrato_valor_pago IS 'Valor pago pelo paciente (para casos de distrato)';
COMMENT ON COLUMN public.postvenda_chamados.distrato_data_pagamento_sinal IS 'Data do pagamento do sinal (para casos de distrato)';
COMMENT ON COLUMN public.postvenda_chamados.distrato_forma_pagamento IS 'Forma de pagamento: online ou presencial (para casos de distrato)';
COMMENT ON COLUMN public.postvenda_chamados.distrato_termo_sinal_assinado IS 'Se o termo de sinal foi assinado (para casos de distrato)';
COMMENT ON COLUMN public.postvenda_chamados.distrato_termo_sinal_anexo IS 'Se o termo de sinal está em anexo (para casos de distrato)';
COMMENT ON COLUMN public.postvenda_chamados.distrato_contrato_assinado IS 'Se o contrato foi assinado (para casos de distrato)';
COMMENT ON COLUMN public.postvenda_chamados.distrato_contrato_anexo IS 'Se o contrato está em anexo (para casos de distrato)';