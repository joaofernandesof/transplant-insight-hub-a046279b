import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  config: {
    attendantName: string;
    companyName: string;
    professionalName: string;
    services: Array<{ id: string; name: string; enabled: boolean }>;
    paymentMethods: Array<{ id: string; name: string; enabled: boolean }>;
    consultationType: { presencial: boolean; online: boolean };
    schedule: Record<string, { enabled: boolean; intervals: Array<{ start: string; end: string }> }>;
    city: string;
    state: string;
  };
  prompt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, config, prompt }: ChatRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt with agent configuration
    const systemPrompt = prompt || buildSystemPrompt(config);

    // Prepare messages for the API
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI Gateway for chat test...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 
      'Desculpe, não consegui processar sua mensagem. Poderia reformular?';

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat test error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(config: ChatRequest['config']): string {
  const enabledServices = config.services?.filter(s => s.enabled).map(s => s.name).join(', ') || 'diversos procedimentos';
  const enabledPayments = config.paymentMethods?.filter(m => m.enabled).map(m => m.name).join(', ') || 'várias formas de pagamento';
  
  const consultationTypes: string[] = [];
  if (config.consultationType?.presencial) consultationTypes.push('presencial');
  if (config.consultationType?.online) consultationTypes.push('online');
  
  return `Você é ${config.attendantName || 'um(a) assistente virtual'}, assistente virtual da ${config.companyName || 'clínica'}.

SOBRE A CLÍNICA:
- Nome: ${config.companyName || 'Clínica'}
- Médico responsável: ${config.professionalName || 'Dr. Especialista'}
- Localização: ${config.city || 'cidade'}, ${config.state || 'estado'}

SERVIÇOS OFERECIDOS:
${enabledServices}

FORMAS DE PAGAMENTO:
${enabledPayments}

TIPOS DE CONSULTA:
${consultationTypes.join(' e ') || 'presencial'}

INSTRUÇÕES DE COMPORTAMENTO:
1. Seja sempre cordial, empático e profissional
2. Responda de forma objetiva mas acolhedora
3. Quando perguntarem sobre preços, explique que os valores são personalizados e sugira uma avaliação
4. Para agendamentos, pergunte qual o melhor dia e horário para o paciente
5. Sempre que possível, direcione para uma consulta de avaliação
6. Use emojis com moderação para deixar a conversa mais amigável
7. Se não souber responder algo, diga que vai verificar e retornar

IMPORTANTE:
- Nunca invente informações sobre preços específicos
- Sempre ofereça ajuda adicional ao final das respostas
- Mantenha as respostas concisas (máximo 3 parágrafos)`;
}
