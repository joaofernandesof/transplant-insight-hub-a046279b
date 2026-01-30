import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  userId?: string;
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
    const { message, history, userId, config, prompt }: ChatRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client for RAG
    let ragContext = '';
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      ragContext = await searchKnowledgeBase(supabase, message, userId);
    }

    // Build system prompt with agent configuration and RAG context
    const systemPrompt = buildSystemPrompt(config, prompt, ragContext);

    // Prepare messages for the API
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI Gateway for chat test...');
    console.log('RAG context found:', ragContext ? 'Yes' : 'No');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' }),
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

async function searchKnowledgeBase(supabase: any, query: string, userId?: string): Promise<string> {
  try {
    // Get relevant chunks using text search (simple approach without embeddings)
    // First, get documents for the user
    let documentsQuery = supabase
      .from('avivar_knowledge_documents')
      .select('id, name')
      .limit(10);
    
    if (userId) {
      documentsQuery = documentsQuery.eq('user_id', userId);
    }

    const { data: documents, error: docError } = await documentsQuery;

    if (docError || !documents?.length) {
      console.log('No documents found for RAG');
      return '';
    }

    const documentIds = documents.map((d: any) => d.id);

    // Get chunks from those documents
    const { data: chunks, error: chunkError } = await supabase
      .from('avivar_knowledge_chunks')
      .select('content')
      .in('document_id', documentIds)
      .limit(5);

    if (chunkError || !chunks?.length) {
      console.log('No chunks found for RAG');
      return '';
    }

    // Simple keyword matching for relevance
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const scoredChunks = chunks.map((chunk: any) => {
      const content = chunk.content.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (content.includes(word)) {
          score += 1;
        }
      }
      return { content: chunk.content, score };
    });

    // Sort by relevance and take top 3
    const relevantChunks = scoredChunks
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((c: any) => c.content);

    if (relevantChunks.length === 0) {
      // If no relevant matches, return first 2 chunks as general context
      return chunks.slice(0, 2).map((c: any) => c.content).join('\n\n');
    }

    console.log(`Found ${relevantChunks.length} relevant chunks`);
    return relevantChunks.join('\n\n');

  } catch (error) {
    console.error('RAG search error:', error);
    return '';
  }
}

function buildSystemPrompt(config: ChatRequest['config'], customPrompt?: string, ragContext?: string): string {
  const enabledServices = config.services?.filter(s => s.enabled).map(s => s.name).join(', ') || 'diversos procedimentos';
  const enabledPayments = config.paymentMethods?.filter(m => m.enabled).map(m => m.name).join(', ') || 'várias formas de pagamento';
  
  const consultationTypes: string[] = [];
  if (config.consultationType?.presencial) consultationTypes.push('presencial');
  if (config.consultationType?.online) consultationTypes.push('online');

  let prompt = customPrompt || `Você é ${config.attendantName || 'um(a) assistente virtual'}, assistente virtual da ${config.companyName || 'clínica'}.

SOBRE A CLÍNICA:
- Nome: ${config.companyName || 'Clínica'}
- Médico responsável: ${config.professionalName || 'Dr. Especialista'}
- Localização: ${config.city || 'cidade'}, ${config.state || 'estado'}

SERVIÇOS OFERECIDOS:
${enabledServices}

FORMAS DE PAGAMENTO:
${enabledPayments}

TIPOS DE CONSULTA:
${consultationTypes.join(' e ') || 'presencial'}`;

  // Add RAG context if available
  if (ragContext) {
    prompt += `

═══════════════════════════════════════════════════════════════
BASE DE CONHECIMENTO (use estas informações para responder):
═══════════════════════════════════════════════════════════════
${ragContext}
═══════════════════════════════════════════════════════════════`;
  }

  prompt += `

INSTRUÇÕES DE COMPORTAMENTO:
1. Seja sempre cordial, empático e profissional
2. Responda de forma objetiva mas acolhedora
3. USE AS INFORMAÇÕES DA BASE DE CONHECIMENTO quando disponíveis
4. Quando perguntarem sobre preços, use a base de conhecimento se disponível, senão sugira uma avaliação
5. Para agendamentos, pergunte qual o melhor dia e horário para o paciente
6. Sempre que possível, direcione para uma consulta de avaliação
7. Use emojis com moderação para deixar a conversa mais amigável
8. Se não souber responder algo, diga que vai verificar e retornar

IMPORTANTE:
- Priorize informações da base de conhecimento sobre suposições
- Sempre ofereça ajuda adicional ao final das respostas
- Mantenha as respostas concisas (máximo 3 parágrafos)`;

  return prompt;
}
