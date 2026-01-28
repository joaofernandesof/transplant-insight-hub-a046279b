-- Create Post-Venda checklist templates table
CREATE TABLE public.postvenda_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_demanda TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  required_before_next BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Post-Venda checklist instances table (per chamado)
CREATE TABLE public.postvenda_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chamado_id UUID NOT NULL REFERENCES public.postvenda_chamados(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.postvenda_checklist_templates(id),
  order_index INTEGER NOT NULL,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.postvenda_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postvenda_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates (read-only for authenticated users, write for admins)
CREATE POLICY "Anyone can view checklist templates" 
ON public.postvenda_checklist_templates 
FOR SELECT 
USING (true);

-- RLS policies for checklist items
CREATE POLICY "Staff can view checklist items" 
ON public.postvenda_checklist_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create checklist items" 
ON public.postvenda_checklist_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update checklist items" 
ON public.postvenda_checklist_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_checklist_items_chamado ON public.postvenda_checklist_items(chamado_id);
CREATE INDEX idx_checklist_templates_tipo ON public.postvenda_checklist_templates(tipo_demanda);

-- Insert Distrato checklist template
INSERT INTO public.postvenda_checklist_templates (tipo_demanda, order_index, phase, title, description, guidance, required_before_next) VALUES
-- Fase 1: Recepção
('distrato', 1, 'Recepção', '📞 Receber solicitação', 'Registrar a solicitação do paciente', 'Ouça o paciente, entenda o motivo e registre todos os detalhes da solicitação de distrato.', true),
('distrato', 2, 'Recepção', '📋 Validar dados do paciente', 'Confirmar identidade e contrato', 'Confirme nome completo, CPF, número do contrato e filial. Verifique se o solicitante é o titular.', true),
('distrato', 3, 'Recepção', '💰 Registrar valores pagos', 'Levantar todos os pagamentos', 'Registre valor do sinal, parcelas pagas, forma de pagamento e datas de cada transação.', true),

-- Fase 2: Documentação
('distrato', 4, 'Documentação', '📄 Verificar contrato assinado', 'Localizar contrato original', 'Confirme se o contrato está assinado, se há alguma cláusula específica de rescisão e se todos os termos foram cumpridos.', true),
('distrato', 5, 'Documentação', '📑 Verificar termo de sinal', 'Confirmar assinatura do termo', 'Verifique se o termo de sinal foi assinado e está anexado ao sistema.', true),
('distrato', 6, 'Documentação', '📁 Anexar documentos', 'Upload de comprovantes', 'Anexe todos os documentos relevantes: contrato, termos, comprovantes de pagamento.', true),

-- Fase 3: Análise
('distrato', 7, 'Análise', '🔍 Analisar motivo do distrato', 'Entender as razões do cancelamento', 'Documente detalhadamente o motivo apresentado pelo paciente. Isso ajuda na melhoria dos processos.', true),
('distrato', 8, 'Análise', '⚖️ Verificar direito à devolução', 'Analisar conforme contrato e CDC', 'Verifique as cláusulas contratuais e o Código de Defesa do Consumidor para determinar valores a devolver.', true),
('distrato', 9, 'Análise', '📊 Calcular valores', 'Definir valor a ser devolvido', 'Calcule multas, taxas administrativas e valor líquido a devolver considerando o período de arrependimento.', true),

-- Fase 4: Aprovação
('distrato', 10, 'Aprovação', '👩‍💼 Submeter para gerência', 'Enviar para aprovação', 'Prepare o relatório completo e submeta para a gerente (Jéssica) aprovar o distrato.', true),
('distrato', 11, 'Aprovação', '✅ Aguardar parecer', 'Gerência analisa e decide', 'Acompanhe o status da aprovação e responda eventuais questionamentos da gerência.', true),
('distrato', 12, 'Aprovação', '📝 Registrar decisão', 'Documentar resultado', 'Registre a decisão (devolver/não devolver/negociar) e o valor aprovado.', true),

-- Fase 5: Negociação (se aplicável)
('distrato', 13, 'Negociação', '🤝 Contatar paciente', 'Apresentar proposta', 'Entre em contato com o paciente para apresentar a decisão e proposta de acordo.', false),
('distrato', 14, 'Negociação', '💬 Negociar termos', 'Buscar acordo', 'Negocie os termos finais: valor, prazo, forma de devolução. Documente tudo.', false),
('distrato', 15, 'Negociação', '✍️ Formalizar acordo', 'Registrar termos acordados', 'Formalize por escrito todos os termos acordados entre as partes.', false),

-- Fase 6: Execução
('distrato', 16, 'Execução', '📋 Preparar termo de distrato', 'Gerar documento oficial', 'Prepare o termo de distrato com todos os detalhes: valores, prazos, condições.', true),
('distrato', 17, 'Execução', '✍️ Colher assinatura', 'Paciente assina termo', 'Envie o termo para assinatura do paciente (digital ou presencial).', true),
('distrato', 18, 'Execução', '💳 Processar devolução', 'Financeiro efetua pagamento', 'Encaminhe para o financeiro processar a devolução conforme acordado.', true),

-- Fase 7: Finalização
('distrato', 19, 'Finalização', '📧 Confirmar recebimento', 'Paciente confirma valores', 'Confirme com o paciente o recebimento dos valores devolvidos.', true),
('distrato', 20, 'Finalização', '📁 Arquivar processo', 'Organizar documentação final', 'Arquive todos os documentos do processo de forma organizada no sistema.', true),
('distrato', 21, 'Finalização', '✅ Encerrar chamado', 'Finalizar processo', 'Encerre o chamado com o status adequado e registre o feedback final.', true);

-- Insert Reclamação checklist template
INSERT INTO public.postvenda_checklist_templates (tipo_demanda, order_index, phase, title, description, guidance, required_before_next) VALUES
('reclamacao_atendimento', 1, 'Registro', '📞 Ouvir reclamação completa', 'Escuta ativa do paciente', 'Ouça sem interromper, demonstre empatia e anote todos os pontos levantados.', true),
('reclamacao_atendimento', 2, 'Registro', '📋 Documentar detalhes', 'Registrar informações', 'Registre data, horário, local, profissionais envolvidos e descrição detalhada.', true),
('reclamacao_atendimento', 3, 'Registro', '🔍 Validar procedência', 'Verificar informações', 'Confirme os dados apresentados com os registros do sistema.', true),

('reclamacao_atendimento', 4, 'Análise', '👥 Ouvir equipe envolvida', 'Colher versão interna', 'Converse com os profissionais envolvidos para entender o ocorrido.', true),
('reclamacao_atendimento', 5, 'Análise', '📊 Avaliar gravidade', 'Classificar a situação', 'Determine o nível de gravidade e impacto para o paciente.', true),
('reclamacao_atendimento', 6, 'Análise', '💡 Definir ação corretiva', 'Planejar solução', 'Elabore um plano de ação para resolver a situação.', true),

('reclamacao_atendimento', 7, 'Resolução', '📞 Retornar ao paciente', 'Apresentar solução', 'Entre em contato com o paciente para apresentar a solução proposta.', true),
('reclamacao_atendimento', 8, 'Resolução', '✅ Executar ação', 'Implementar solução', 'Execute as ações necessárias para resolver o problema.', true),
('reclamacao_atendimento', 9, 'Resolução', '📝 Confirmar satisfação', 'Validar com paciente', 'Confirme se o paciente está satisfeito com a resolução.', true),
('reclamacao_atendimento', 10, 'Resolução', '📁 Encerrar processo', 'Finalizar chamado', 'Documente o resultado e encerre o chamado.', true);

-- Insert Reagendamento checklist template  
INSERT INTO public.postvenda_checklist_templates (tipo_demanda, order_index, phase, title, description, guidance, required_before_next) VALUES
('reagendamento', 1, 'Solicitação', '📞 Receber pedido', 'Registrar solicitação', 'Registre o motivo do reagendamento e a preferência de nova data.', true),
('reagendamento', 2, 'Solicitação', '📅 Verificar disponibilidade', 'Consultar agenda', 'Verifique as datas disponíveis na agenda médica.', true),
('reagendamento', 3, 'Solicitação', '✅ Confirmar nova data', 'Agendar procedimento', 'Confirme a nova data com o paciente e atualize o sistema.', true),
('reagendamento', 4, 'Solicitação', '📧 Enviar confirmação', 'Notificar paciente', 'Envie confirmação por WhatsApp/e-mail com todos os detalhes.', true),
('reagendamento', 5, 'Solicitação', '📁 Atualizar prontuário', 'Registrar mudança', 'Atualize o prontuário e demais sistemas com a nova data.', true);