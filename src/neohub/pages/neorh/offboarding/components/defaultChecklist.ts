export interface DefaultChecklistItem {
  categoria: string;
  tarefa: string;
  setor_responsavel: string;
}

export const DEFAULT_CHECKLIST_ITEMS: DefaultChecklistItem[] = [
  // Sistemas e Acessos Digitais
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso ao Gmail corporativo', setor_responsavel: 'TI' },
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso ao Google Drive', setor_responsavel: 'TI' },
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso ao CRM (Kommo)', setor_responsavel: 'TI' },
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso ao ClickUp', setor_responsavel: 'TI' },
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso aos sistemas financeiros', setor_responsavel: 'TI' },
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso ao sistema médico (Feegow/Shosp)', setor_responsavel: 'TI' },
  { categoria: 'Sistemas e Acessos Digitais', tarefa: 'Remover acesso a plataformas SaaS da empresa', setor_responsavel: 'TI' },

  // Redes Sociais e Marketing
  { categoria: 'Redes Sociais e Marketing', tarefa: 'Remover acesso ao Instagram Neo Folic', setor_responsavel: 'Marketing' },
  { categoria: 'Redes Sociais e Marketing', tarefa: 'Remover acesso ao Instagram IBRAMEC', setor_responsavel: 'Marketing' },
  { categoria: 'Redes Sociais e Marketing', tarefa: 'Remover acesso ao TikTok', setor_responsavel: 'Marketing' },
  { categoria: 'Redes Sociais e Marketing', tarefa: 'Remover acesso ao LinkedIn corporativo', setor_responsavel: 'Marketing' },
  { categoria: 'Redes Sociais e Marketing', tarefa: 'Remover acesso ao Canva corporativo', setor_responsavel: 'Marketing' },

  // Ferramentas Operacionais
  { categoria: 'Ferramentas Operacionais', tarefa: 'Remover colaborador de grupos de WhatsApp da empresa', setor_responsavel: 'TI' },
  { categoria: 'Ferramentas Operacionais', tarefa: 'Cancelar extensões de ferramentas (Fireflies etc.)', setor_responsavel: 'TI' },
  { categoria: 'Ferramentas Operacionais', tarefa: 'Revogar acessos internos do NeoHub', setor_responsavel: 'TI' },

  // Equipamentos e Patrimônio
  { categoria: 'Equipamentos e Patrimônio', tarefa: 'Devolução de notebook', setor_responsavel: 'RH' },
  { categoria: 'Equipamentos e Patrimônio', tarefa: 'Devolução de celular corporativo', setor_responsavel: 'RH' },
  { categoria: 'Equipamentos e Patrimônio', tarefa: 'Devolução de chip corporativo', setor_responsavel: 'RH' },
  { categoria: 'Equipamentos e Patrimônio', tarefa: 'Devolução de crachá', setor_responsavel: 'RH' },
  { categoria: 'Equipamentos e Patrimônio', tarefa: 'Devolução de equipamentos diversos', setor_responsavel: 'RH' },

  // Financeiro e Benefícios
  { categoria: 'Financeiro e Benefícios', tarefa: 'Pagamento de rescisão', setor_responsavel: 'Financeiro' },
  { categoria: 'Financeiro e Benefícios', tarefa: 'Pagamento de comissões pendentes', setor_responsavel: 'Financeiro' },
  { categoria: 'Financeiro e Benefícios', tarefa: 'Encerramento de contrato PJ', setor_responsavel: 'Financeiro' },
  { categoria: 'Financeiro e Benefícios', tarefa: 'Cancelamento de benefícios', setor_responsavel: 'Financeiro' },
  { categoria: 'Financeiro e Benefícios', tarefa: 'Cancelamento de cartão corporativo', setor_responsavel: 'Financeiro' },
  { categoria: 'Financeiro e Benefícios', tarefa: 'Cancelamento de benefícios Pluxee', setor_responsavel: 'Financeiro' },
];
