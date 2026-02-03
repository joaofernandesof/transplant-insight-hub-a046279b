import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mapeamento de nichos para nomes amigáveis
const NICHO_NAMES: Record<string, string> = {
  saude: 'saúde',
  estetica: 'estética',
  vendas: 'vendas',
  imobiliario: 'imobiliário',
  alimentacao: 'alimentação',
  servicos: 'serviços',
  outros: 'geral',
};

const SUBNICHO_NAMES: Record<string, string> = {
  clinica_medica: 'clínica médica',
  hospital: 'hospital',
  dentista: 'consultório odontológico',
  fisioterapia: 'clínica de fisioterapia',
  psicologia: 'consultório de psicologia',
  nutricao: 'consultório de nutrição',
  laboratorio: 'laboratório de análises',
  farmacia: 'farmácia',
  transplante_capilar: 'clínica de transplante capilar',
  clinica_estetica: 'clínica de estética',
  salao_beleza: 'salão de beleza',
  barbearia: 'barbearia',
  spa: 'spa',
  micropigmentacao: 'estúdio de micropigmentação',
  depilacao: 'clínica de depilação',
  produtos_hospitalares: 'loja de produtos hospitalares',
  celulares_eletronicos: 'loja de eletrônicos',
  roupas_moda: 'loja de roupas',
  joias_acessorios: 'joalheria',
  cosmeticos: 'loja de cosméticos',
  suplementos: 'loja de suplementos',
  moveis_decoracao: 'loja de móveis e decoração',
  agente_imobiliario: 'corretor de imóveis',
  imobiliaria: 'imobiliária',
  construtora: 'construtora',
  administradora: 'administradora de condomínios',
  restaurante: 'restaurante',
  delivery: 'serviço de delivery',
  lanchonete: 'lanchonete',
  pizzaria: 'pizzaria',
  cafeteria: 'cafeteria',
  confeitaria: 'confeitaria',
  food_truck: 'food truck',
  advocacia: 'escritório de advocacia',
  contabilidade: 'escritório de contabilidade',
  consultoria: 'consultoria',
  academia_personal: 'academia/personal trainer',
  oficina_mecanica: 'oficina mecânica',
  pet_shop_veterinario: 'pet shop/veterinário',
  limpeza_manutencao: 'empresa de limpeza e manutenção',
  marketing_agencia: 'agência de marketing',
  cursos_educacao: 'escola/cursos',
  eventos: 'empresa de eventos',
  fotografia: 'estúdio de fotografia',
  tecnologia_ti: 'empresa de tecnologia',
  personalizado: 'empresa',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      nicho, 
      subnicho, 
      companyName, 
      companyPhone,
      address,
      city,
      state,
      professionalName,
      crm,
      businessUnits,
      services, 
      paymentMethods,
      objectives 
    } = await req.json();

    console.log('Generating FAQ for:', { 
      nicho, 
      subnicho, 
      companyName,
      city,
      state,
      servicesCount: services?.length,
      paymentsCount: paymentMethods?.length,
      hasObjectives: !!objectives,
      hasUnits: businessUnits?.length > 0
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const nichoName = NICHO_NAMES[nicho] || nicho;
    const subnichoName = SUBNICHO_NAMES[subnicho] || subnicho;

    // Construir texto de serviços com preços (separando visíveis e ocultos)
    let servicesText = '';
    let servicesWithPrice: string[] = [];
    let servicesWithHiddenPrice: string[] = [];
    
    if (services?.length > 0) {
      services.forEach((s: { name: string; price?: number | null; showPrice?: boolean }) => {
        if (s.showPrice && s.price) {
          // Formatar preço no padrão brasileiro (sem centavos se for inteiro)
          const priceValue = s.price / 100; // convertendo de centavos
          const hasDecimals = priceValue % 1 !== 0;
          const formattedPrice = priceValue.toLocaleString('pt-BR', {
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: hasDecimals ? 2 : 0
          });
          servicesWithPrice.push(`${s.name} (R$ ${formattedPrice})`);
        } else {
          servicesWithHiddenPrice.push(s.name);
        }
      });
      
      if (servicesWithPrice.length > 0) {
        servicesText += `SERVIÇOS COM PREÇO DEFINIDO: ${servicesWithPrice.join(', ')}.\n`;
        servicesText += `Para estes serviços, informe o valor exato quando perguntarem.\n\n`;
      }
      
      if (servicesWithHiddenPrice.length > 0) {
        servicesText += `SERVIÇOS COM VALOR SOB AVALIAÇÃO (não informar preço): ${servicesWithHiddenPrice.join(', ')}.\n`;
        servicesText += `IMPORTANTE: Para estes serviços, NUNCA cite valores. Gere respostas persuasivas que destaquem a necessidade de avaliação personalizada.\n`;
      }
    }

    // Construir texto de formas de pagamento com instruções detalhadas para FAQ
    let paymentsText = '';
    let paymentsFAQInstructions = '';
    if (paymentMethods?.length > 0) {
      const paymentNames = paymentMethods.map((p: { id: string; name: string }) => p.name);
      paymentsText = `\nFORMAS DE PAGAMENTO ACEITAS: ${paymentNames.join(', ')}`;
      
      // Gerar instruções específicas para FAQ baseadas nas formas de pagamento
      paymentsFAQInstructions = '\n\n=== INSTRUÇÕES ESPECÍFICAS PARA PERGUNTAS SOBRE PAGAMENTO ===\n';
      
      paymentMethods.forEach((method: { id: string; name: string }) => {
        switch (method.id) {
          case 'pix':
            paymentsFAQInstructions += `\n- PIX: Gere uma pergunta como "Qual o PIX de vocês?" e responda com algo como "Sim, aceitamos PIX! Após confirmar seu agendamento, enviaremos nossa chave PIX para pagamento." (não invente chave PIX)`;
            break;
          case 'cartao_credito':
            paymentsFAQInstructions += `\n- CARTÃO DE CRÉDITO: Gere pergunta sobre parcelamento no cartão e responda detalhando as condições de parcelamento disponíveis.`;
            break;
          case 'boleto':
            paymentsFAQInstructions += `\n- BOLETO: Gere pergunta como "Como funciona o pagamento no boleto?" e explique o processo (prazo, vencimento, etc).`;
            break;
          case 'recorrente':
            paymentsFAQInstructions += `\n- PAGAMENTO RECORRENTE: Gere pergunta sobre mensalidades/planos e explique como funciona o sistema de pagamento recorrente.`;
            break;
          case 'plano_saude':
            paymentsFAQInstructions += `\n- PLANO DE SAÚDE: Gere pergunta como "Vocês aceitam planos de saúde?" e responda positivamente, orientando que o cliente informe qual o plano para verificar cobertura.`;
            break;
          case 'financiamento':
            paymentsFAQInstructions += `\n- FINANCIAMENTO BANCÁRIO: Gere pergunta sobre financiamento e explique as parcerias com instituições financeiras disponíveis.`;
            break;
        }
      });
    }

    // Construir informações da empresa
    let companyInfoText = '';
    if (companyName) {
      companyInfoText += `\nNOME DA EMPRESA: ${companyName}`;
    }
    if (city && state) {
      companyInfoText += `\nLOCALIZAÇÃO: ${city}/${state}`;
    }
    if (address) {
      companyInfoText += `\nENDEREÇO COMPLETO: ${address}`;
    }
    if (companyPhone) {
      companyInfoText += `\nTELEFONE PARA LIGAÇÃO: ${companyPhone}`;
    }
    if (professionalName) {
      companyInfoText += `\nPROFISSIONAL RESPONSÁVEL: ${professionalName}`;
      if (crm) {
        companyInfoText += ` (Registro: ${crm})`;
      }
    }
    if (paymentsText) {
      companyInfoText += paymentsText;
    }

    // Adicionar unidades/filiais se existirem
    if (businessUnits && businessUnits.length > 0) {
      companyInfoText += `\n\nUNIDADES/FILIAIS (${businessUnits.length}):`;
      businessUnits.forEach((unit: { name: string; city: string; state: string; address?: string; phone?: string; professionalName?: string }, idx: number) => {
        companyInfoText += `\n- ${unit.name}: ${unit.city}/${unit.state}`;
        if (unit.address) companyInfoText += ` - ${unit.address}`;
        if (unit.phone) companyInfoText += ` | Tel: ${unit.phone}`;
        if (unit.professionalName) companyInfoText += ` | Profissional: ${unit.professionalName}`;
      });
    }

    // Formatar objetivos para o prompt
    let objectivesText = '';
    if (objectives) {
      const { primary, secondary, customObjectives } = objectives;
      
      // Objetivo principal
      if (primary) {
        if (primary === 'custom' && objectives.primaryCustomId) {
          const customPrimary = customObjectives?.find((c: any) => c.id === objectives.primaryCustomId);
          if (customPrimary) {
            objectivesText += `\nOBJETIVO PRINCIPAL DO NEGÓCIO: ${customPrimary.name}\nContexto: ${customPrimary.context || customPrimary.description}\n`;
          }
        } else {
          const objectiveNames: Record<string, string> = {
            'agendar_presencial': 'Agendar consultas/atendimentos presenciais',
            'agendar_online': 'Agendar reuniões ou consultas online',
            'agendar_domicilio': 'Agendar visitas no domicílio do cliente',
            'vender_produto': 'Vender produtos do catálogo',
            'delivery': 'Receber e processar pedidos para entrega',
            'capturar_lead': 'Capturar leads e informações de contato',
          };
          objectivesText += `\nOBJETIVO PRINCIPAL DO NEGÓCIO: ${objectiveNames[primary] || primary}\n`;
        }
      }
      
      // Objetivos secundários
      const allSecondary: string[] = [];
      if (secondary?.length > 0) {
        const secondaryNames: Record<string, string> = {
          'agendar_presencial': 'Agendamento presencial',
          'agendar_online': 'Agendamento online',
          'agendar_domicilio': 'Atendimento domiciliar',
          'vender_produto': 'Venda de produtos',
          'delivery': 'Delivery',
          'capturar_lead': 'Captação de leads',
        };
        secondary.forEach((s: string) => allSecondary.push(secondaryNames[s] || s));
      }
      if (objectives.secondaryCustomIds?.length > 0) {
        objectives.secondaryCustomIds.forEach((id: string) => {
          const custom = customObjectives?.find((c: any) => c.id === id);
          if (custom) allSecondary.push(custom.name);
        });
      }
      if (allSecondary.length > 0) {
        objectivesText += `OBJETIVOS SECUNDÁRIOS: ${allSecondary.join(', ')}\n`;
      }
    }

    const systemPrompt = `Você é um especialista em atendimento ao cliente e criação de FAQs para empresas brasileiras.
Sua tarefa é gerar perguntas e respostas frequentes (FAQ) realistas e úteis para um negócio.
As respostas devem ser naturais, informativas e adequadas para um chatbot de WhatsApp responder.

IMPORTANTE: 
- As perguntas devem estar alinhadas com os OBJETIVOS do negócio - ajudando a guiar o cliente em direção a esses objetivos.
- Use os DADOS REAIS da empresa (nome, endereço, telefone, cidade, profissional) nas respostas quando apropriado.
- NÃO invente dados. Se um dado não foi fornecido, não inclua na resposta.

REGRAS CRÍTICAS SOBRE PREÇOS:
1. SERVIÇOS COM PREÇO DEFINIDO: Quando o serviço tiver preço informado, cite o valor exato na resposta.
   Exemplo: "O procedimento de Transplante Capilar tem investimento a partir de R$ 15.000"

2. SERVIÇOS SEM PREÇO (Valor Oculto): NUNCA cite valores. Seja PERSUASIVO e destaque:
   - A importância da avaliação personalizada
   - Que cada caso é único e merece atenção especial
   - Os benefícios de uma consulta presencial
   - Crie urgência sutil para agendar a avaliação
   
   Exemplo de resposta persuasiva para valor oculto:
   "Entendo sua curiosidade sobre os valores! 😊 Como cada caso é único, o investimento varia de acordo com diversos fatores como área a ser tratada, técnica mais indicada e quantidade de sessões. Para te dar um orçamento preciso e personalizado, o ideal é agendar uma avaliação gratuita com nosso especialista. Assim você conhece nossa estrutura e recebe um plano sob medida para suas necessidades. Posso agendar pra você?"

Responda SEMPRE em português brasileiro.`;

    // Calcular número dinâmico de perguntas baseado no conteúdo
    let questionCount = 10; // Base mínima
    
    // Adicionar perguntas para cada serviço (2 por serviço com preço, 3 por serviço sem preço)
    if (servicesWithPrice.length > 0) {
      questionCount += servicesWithPrice.length * 2;
    }
    if (servicesWithHiddenPrice.length > 0) {
      questionCount += servicesWithHiddenPrice.length * 3; // Mais perguntas persuasivas para valores ocultos
    }
    
    // Adicionar pergunta para cada forma de pagamento
    const enabledPayments = paymentMethods?.filter((p: { id: string; name: string; enabled?: boolean }) => p.enabled !== false) || [];
    questionCount += enabledPayments.length * 2;
    
    // Adicionar perguntas para unidades/filiais
    if (businessUnits && businessUnits.length > 0) {
      questionCount += businessUnits.length * 2;
    }
    
    // Adicionar perguntas para objetivos
    if (objectives) {
      if (objectives.primary) questionCount += 3;
      if (objectives.secondary?.length > 0) questionCount += objectives.secondary.length * 2;
      if (objectives.customObjectives?.length > 0) questionCount += objectives.customObjectives.length * 2;
    }
    
    // Limite máximo e mínimo
    questionCount = Math.max(15, Math.min(questionCount, 40));
    
    console.log(`Calculated question count: ${questionCount}`);

    const userPrompt = `Gere exatamente ${questionCount} perguntas e respostas frequentes para um(a) ${subnichoName} no setor de ${nichoName}.

=== DADOS DA EMPRESA ===
${companyInfoText || 'Dados não fornecidos.'}

=== SERVIÇOS E PREÇOS ===
${servicesText || 'Serviços não especificados.'}

=== OBJETIVOS ===
${objectivesText || 'Objetivos não definidos.'}
${paymentsFAQInstructions}

INSTRUÇÕES ESPECÍFICAS DE DISTRIBUIÇÃO:
Você DEVE gerar perguntas nas seguintes categorias proporcionalmente:

📍 LOCALIZAÇÃO E CONTATO (mínimo 3 perguntas):
- "Qual o endereço de vocês?"
- "Como faço para chegar aí?"
- "Qual o telefone/WhatsApp para contato?"
- "Vocês tem estacionamento?"
${businessUnits && businessUnits.length > 0 ? `- IMPORTANTE: Gere perguntas sobre CADA UNIDADE/FILIAL (${businessUnits.length} unidades)` : ''}

💰 FORMAS DE PAGAMENTO (${enabledPayments.length > 0 ? `gere 2 perguntas para CADA forma de pagamento habilitada` : 'sem pagamentos definidos'}):
${paymentsFAQInstructions}

💼 SERVIÇOS E VALORES (MUITO IMPORTANTE):
${servicesWithPrice.length > 0 ? `
- Para serviços COM PREÇO (${servicesWithPrice.length}): Gere 2 perguntas sobre CADA serviço citando o valor exato.
  Serviços com preço: ${servicesWithPrice.join(', ')}
` : ''}
${servicesWithHiddenPrice.length > 0 ? `
- Para serviços SEM PREÇO VISÍVEL (${servicesWithHiddenPrice.length}): Gere 3 perguntas persuasivas sobre CADA serviço SEM citar valores.
  Serviços sem preço: ${servicesWithHiddenPrice.join(', ')}
  Respostas devem ser persuasivas como: "Entendo sua curiosidade! 😊 Como cada caso é único, o investimento varia de acordo com a avaliação. Posso agendar uma consulta gratuita para você conhecer nossa estrutura e receber um orçamento personalizado?"
` : ''}

🕐 HORÁRIOS E AGENDAMENTO (mínimo 3 perguntas):
- "Qual o horário de funcionamento?"
- "Como faço para agendar?"
- "Vocês atendem aos sábados/domingos?"
- "Consigo agendar online?"

🎯 OBJETIVOS DO NEGÓCIO:
${objectivesText ? `
Gere perguntas que guiem o cliente para o objetivo: ${objectivesText}
` : 'Sem objetivos definidos'}

📋 PROCEDIMENTOS E PROCESSOS (mínimo 4 perguntas):
- "Quanto tempo dura o procedimento?"
- "Preciso de alguma preparação?"
- "Posso remarcar/cancelar?"
- "O que acontece no dia do atendimento?"
- "Tem garantia?"
- "Qual o pós-procedimento?"

❓ DÚVIDAS ESPECÍFICAS DO NICHO ${nichoName.toUpperCase()} (mínimo 4 perguntas):
Gere perguntas específicas que clientes de ${subnichoName} costumam fazer.

REGRAS FINAIS:
1. Use DADOS REAIS da empresa (nome, endereço, telefone) nas respostas
2. NÃO invente informações não fornecidas
3. Respostas devem ser naturais para WhatsApp (com emojis moderados)
4. Total de perguntas DEVE ser exatamente ${questionCount}

Retorne APENAS um JSON válido no seguinte formato, sem texto adicional:
{
  "faq": [
    { "pergunta": "Pergunta aqui?", "resposta": "Resposta aqui." },
    ...
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log('AI response received, parsing...');

    // Parse the JSON from the response
    let faqData;
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        faqData = JSON.parse(jsonMatch[0]);
      } else {
        faqData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse FAQ response');
    }

    console.log(`Generated ${faqData.faq?.length || 0} FAQ items`);

    return new Response(JSON.stringify(faqData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating FAQ:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
