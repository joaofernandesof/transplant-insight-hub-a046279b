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

    // Construir texto de serviços com preços
    let servicesText = '';
    if (services?.length > 0) {
      const servicesList = services.map((s: { name: string; price?: number | null; showPrice?: boolean }) => {
        if (s.showPrice && s.price) {
          return `${s.name} (R$ ${s.price.toFixed(2).replace('.', ',')})`;
        } else {
          return `${s.name} (valor sob consulta)`;
        }
      });
      servicesText = `Os serviços oferecidos são: ${servicesList.join(', ')}.`;
    }

    // Construir texto de formas de pagamento
    let paymentsText = '';
    if (paymentMethods?.length > 0) {
      paymentsText = `\nFORMAS DE PAGAMENTO ACEITAS: ${paymentMethods.join(', ')}`;
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
Responda SEMPRE em português brasileiro.`;

    const userPrompt = `Gere exatamente 12 perguntas e respostas frequentes para um(a) ${subnichoName} no setor de ${nichoName}.

=== DADOS DA EMPRESA ===
${companyInfoText || 'Dados não fornecidos.'}

=== SERVIÇOS ===
${servicesText || 'Serviços não especificados.'}

=== OBJETIVOS ===
${objectivesText || 'Objetivos não definidos.'}

IMPORTANTE: 
- Priorize perguntas que ajudem o cliente a avançar em direção aos objetivos do negócio.
- Use os DADOS REAIS da empresa nas respostas (nome, endereço, telefone, cidade, etc.).
- NÃO invente dados que não foram fornecidos.

As perguntas devem cobrir temas como:
- Dúvidas relacionadas ao objetivo principal (como agendar, como comprar, como funciona)
- Horário de funcionamento
- Formas de agendamento/pedido
- Localização e como chegar (use o endereço real se fornecido)
- Telefone para contato (use o telefone real se fornecido)
- Preços e formas de pagamento
- Cancelamento e reagendamento
- Dúvidas específicas sobre os serviços
- Tempo de espera/duração
- Preparações necessárias
- Garantias e políticas

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
