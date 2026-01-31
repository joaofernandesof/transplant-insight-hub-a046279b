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
    const { nicho, subnicho, companyName, services } = await req.json();

    console.log('Generating FAQ for:', { nicho, subnicho, companyName, servicesCount: services?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const nichoName = NICHO_NAMES[nicho] || nicho;
    const subnichoName = SUBNICHO_NAMES[subnicho] || subnicho;
    const servicesText = services?.length > 0 
      ? `Os serviços oferecidos são: ${services.join(', ')}.`
      : '';

    const systemPrompt = `Você é um especialista em atendimento ao cliente e criação de FAQs para empresas brasileiras.
Sua tarefa é gerar perguntas e respostas frequentes (FAQ) realistas e úteis para um negócio.
As respostas devem ser naturais, informativas e adequadas para um chatbot de WhatsApp responder.
Responda SEMPRE em português brasileiro.`;

    const userPrompt = `Gere exatamente 12 perguntas e respostas frequentes para um(a) ${subnichoName} no setor de ${nichoName}.
${companyName ? `O nome da empresa é: ${companyName}.` : ''}
${servicesText}

As perguntas devem cobrir os temas mais comuns que clientes perguntam, como:
- Horário de funcionamento
- Formas de agendamento
- Preços e formas de pagamento
- Localização e estacionamento
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
