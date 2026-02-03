/**
 * Templates de Fluxo de Atendimento baseados nos objetivos do agente
 * 
 * Este arquivo contém templates prontos que são carregados dinamicamente
 * de acordo com os objetivos selecionados pelo usuário.
 */

import { FluxoAtendimento, FluxoStep, AgentObjective } from './types';

// Template para Agendamento de Consulta (Presencial ou Online)
export const FLUXO_AGENDAMENTO_CONSULTA: FluxoAtendimento = {
  passosCronologicos: [
    { 
      id: 'saudacao', 
      ordem: 1, 
      titulo: 'Saudação e Pergunta Nome', 
      descricao: 'Cumprimente o lead de forma acolhedora, apresente-se como assistente virtual e pergunte o nome.',
      exemploMensagem: 'Olá! Seja bem-vindo(a)! Eu sou a {atendente}, assistente virtual da {empresa}. Qual é o seu nome?' 
    },
    { 
      id: 'identificacao', 
      ordem: 2, 
      titulo: 'Identificação', 
      descricao: 'Após receber o nome, agradeça e personalize a conversa usando o nome do lead.',
      exemploMensagem: 'Prazer, {nome}! Como posso te ajudar hoje?' 
    },
    { 
      id: 'interesse', 
      ordem: 3, 
      titulo: 'Interesse', 
      descricao: 'Identifique qual serviço ou procedimento o lead tem interesse. Pergunte de forma direta.',
      exemploMensagem: 'Qual procedimento você gostaria de saber mais? Temos: {lista_servicos}' 
    },
    { 
      id: 'qualificacao', 
      ordem: 4, 
      titulo: 'Qualificação', 
      descricao: 'Faça perguntas para entender melhor a situação do lead: há quanto tempo tem o problema, já fez algum tratamento, expectativas.',
      exemploMensagem: 'Para entender melhor seu caso: há quanto tempo você nota {problema}? Já fez algum tratamento antes?' 
    },
    { 
      id: 'oferecer_datas', 
      ordem: 5, 
      titulo: 'Oferecer as Datas', 
      descricao: 'Use a técnica "ou/ou" - ofereça exatamente 2 opções de data e horário para facilitar a decisão e criar senso de escassez.',
      exemploMensagem: 'Tenho disponível {dia1} às {hora1} ou {dia2} às {hora2}. Qual fica melhor para você?' 
    },
    { 
      id: 'confirmacao', 
      ordem: 6, 
      titulo: 'Confirmação do Agendamento', 
      descricao: 'Confirme os dados do agendamento: nome, data, horário e local. Peça confirmação explícita.',
      exemploMensagem: 'Perfeito! Confirmando sua avaliação:\n\n📅 {data}\n⏰ {horario}\n📍 {endereco}\n\nPosso confirmar?' 
    },
  ],
  passosExtras: [
    { 
      id: 'transferencia', 
      ordem: 1, 
      titulo: 'Transferência para Humano', 
      descricao: 'Quando o lead pedir para falar com atendente, tiver dúvidas complexas ou precisar negociar valores.',
      exemploMensagem: 'Vou te transferir para um de nossos especialistas que poderá te ajudar melhor. Aguarde um momento!' 
    },
    { 
      id: 'reagendamento', 
      ordem: 2, 
      titulo: 'Reagendamento', 
      descricao: 'Quando o lead precisar reagendar sua consulta. Verifique o agendamento atual, pergunte o motivo e ofereça novas datas disponíveis.',
      exemploMensagem: 'Sem problemas, {nome}! Vou verificar sua consulta atual. Posso te oferecer {dia1} às {hora1} ou {dia2} às {hora2}. Qual fica melhor para você?' 
    },
    { 
      id: 'cancelamento', 
      ordem: 3, 
      titulo: 'Cancelamento', 
      descricao: 'Quando o lead quiser cancelar sua consulta. Tente entender o motivo, ofereça reagendamento como alternativa e, se confirmar o cancelamento, finalize com cordialidade.',
      exemploMensagem: 'Entendo, {nome}. Posso saber o motivo do cancelamento? Se preferir, podemos reagendar para outra data que seja mais conveniente para você.' 
    },
  ]
};

// Template para Venda de Produtos
export const FLUXO_VENDA_PRODUTOS: FluxoAtendimento = {
  passosCronologicos: [
    { 
      id: 'saudacao', 
      ordem: 1, 
      titulo: 'Saudação e Pergunta Nome', 
      descricao: 'Cumprimente o cliente de forma simpática e pergunte o nome.',
      exemploMensagem: 'Olá! Bem-vindo(a) à {empresa}! Eu sou a {atendente}. Qual é o seu nome?' 
    },
    { 
      id: 'identificacao', 
      ordem: 2, 
      titulo: 'Identificação', 
      descricao: 'Personalize a conversa com o nome do cliente.',
      exemploMensagem: 'Prazer, {nome}! Em que posso te ajudar?' 
    },
    { 
      id: 'interesse', 
      ordem: 3, 
      titulo: 'Interesse', 
      descricao: 'Identifique qual produto ou categoria o cliente tem interesse.',
      exemploMensagem: 'Qual produto você está procurando? Posso te mostrar nosso catálogo.' 
    },
    { 
      id: 'apresentacao', 
      ordem: 4, 
      titulo: 'Apresentação do Produto', 
      descricao: 'Apresente o produto, destaque benefícios e diferenciais. Envie fotos.',
      exemploMensagem: 'Temos o {produto}! {descrição}. Quer ver fotos e o preço?' 
    },
    { 
      id: 'fechamento', 
      ordem: 5, 
      titulo: 'Fechamento da Venda', 
      descricao: 'Confirme o pedido, informe formas de pagamento e prazo de entrega.',
      exemploMensagem: 'Posso separar o {produto} para você? Aceitamos {formas_pagamento}. Entrega em {prazo}.' 
    },
  ],
  passosExtras: [
    { 
      id: 'transferencia', 
      ordem: 1, 
      titulo: 'Transferência para Humano', 
      descricao: 'Quando o cliente precisar negociar valores ou tiver dúvidas específicas.',
      exemploMensagem: 'Vou te transferir para nosso vendedor que pode te ajudar com isso!' 
    },
  ]
};

// Template para Delivery/Pedidos
export const FLUXO_DELIVERY: FluxoAtendimento = {
  passosCronologicos: [
    { 
      id: 'saudacao', 
      ordem: 1, 
      titulo: 'Saudação', 
      descricao: 'Cumprimente o cliente de forma descontraída.',
      exemploMensagem: 'Olá! Bem-vindo(a) à {empresa}! Vamos fazer seu pedido?' 
    },
    { 
      id: 'cardapio', 
      ordem: 2, 
      titulo: 'Apresentar Cardápio', 
      descricao: 'Apresente as opções disponíveis ou envie o cardápio.',
      exemploMensagem: 'Nosso cardápio de hoje: {produtos}. O que vai ser?' 
    },
    { 
      id: 'pedido', 
      ordem: 3, 
      titulo: 'Anotar Pedido', 
      descricao: 'Anote os itens, quantidades e observações (sem cebola, etc.).',
      exemploMensagem: 'Anotado! {itens}. Alguma observação ou personalização?' 
    },
    { 
      id: 'endereco', 
      ordem: 4, 
      titulo: 'Endereço de Entrega', 
      descricao: 'Confirme o endereço completo para entrega.',
      exemploMensagem: 'Qual o endereço completo para entrega? (Rua, número, bairro, referência)' 
    },
    { 
      id: 'confirmacao', 
      ordem: 5, 
      titulo: 'Confirmação e Pagamento', 
      descricao: 'Confirme o pedido, valor total e forma de pagamento.',
      exemploMensagem: 'Seu pedido:\n{resumo}\n\n💰 Total: R$ {valor}\n\nForma de pagamento? (Pix, cartão, dinheiro)' 
    },
  ],
  passosExtras: []
};

// Template para Captura de Lead
export const FLUXO_CAPTURA_LEAD: FluxoAtendimento = {
  passosCronologicos: [
    { 
      id: 'saudacao', 
      ordem: 1, 
      titulo: 'Saudação', 
      descricao: 'Cumprimente e pergunte o nome.',
      exemploMensagem: 'Olá! Seja bem-vindo(a)! Qual é o seu nome?' 
    },
    { 
      id: 'interesse', 
      ordem: 2, 
      titulo: 'Identificar Interesse', 
      descricao: 'Entenda o que trouxe o lead até você.',
      exemploMensagem: 'Prazer, {nome}! Como conheceu a {empresa}? O que te interessou?' 
    },
    { 
      id: 'contato', 
      ordem: 3, 
      titulo: 'Coletar Contato', 
      descricao: 'Colete e-mail e/ou telefone para contato posterior.',
      exemploMensagem: 'Para eu te manter informado(a) sobre {interesse}, qual seu melhor e-mail?' 
    },
    { 
      id: 'qualificacao', 
      ordem: 4, 
      titulo: 'Qualificação', 
      descricao: 'Faça 1-2 perguntas para qualificar o lead.',
      exemploMensagem: 'E qual seria o momento ideal para você? Está pesquisando ou já quer resolver logo?' 
    },
    { 
      id: 'proximo_passo', 
      ordem: 5, 
      titulo: 'Próximo Passo', 
      descricao: 'Informe o que acontece agora e agradeça.',
      exemploMensagem: 'Perfeito! Nossa equipe vai entrar em contato com você em breve. Obrigado pelo interesse!' 
    },
  ],
  passosExtras: []
};

// Mapeamento de objetivo para template
export function getFluxoByObjective(primaryObjective: AgentObjective | null): FluxoAtendimento {
  switch (primaryObjective) {
    case 'agendar_presencial':
    case 'agendar_online':
    case 'agendar_domicilio':
      return { ...FLUXO_AGENDAMENTO_CONSULTA };
    
    case 'vender_produto':
      return { ...FLUXO_VENDA_PRODUTOS };
    
    case 'delivery':
      return { ...FLUXO_DELIVERY };
    
    case 'capturar_lead':
      return { ...FLUXO_CAPTURA_LEAD };
    
    default:
      // Default é agendamento
      return { ...FLUXO_AGENDAMENTO_CONSULTA };
  }
}

// Labels amigáveis para os objetivos
export const OBJECTIVE_TEMPLATE_LABELS: Record<AgentObjective, string> = {
  'agendar_presencial': 'Agendamento de Consulta Presencial',
  'agendar_online': 'Agendamento de Consulta Online',
  'agendar_domicilio': 'Agendamento de Visita Domiciliar',
  'vender_produto': 'Venda de Produtos',
  'delivery': 'Delivery / Pedidos',
  'capturar_lead': 'Captura de Leads',
  'custom': 'Objetivo Personalizado',
};
