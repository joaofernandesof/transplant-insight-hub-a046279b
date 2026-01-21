import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetricData {
  id: string;
  nome: string;
  values: number[];
  weekLabels: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics, clinicName } = await req.json() as { 
      metrics: MetricData[]; 
      clinicName?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a summary of the metrics for the AI
    const metricsSummary = metrics.map(m => {
      const lastValue = m.values[m.values.length - 1] ?? 0;
      const prevValue = m.values[m.values.length - 2] ?? 0;
      const trend = lastValue > prevValue ? "↑ subindo" : lastValue < prevValue ? "↓ descendo" : "→ estável";
      const weeklyTotal = m.values.reduce((sum, v) => sum + (v ?? 0), 0);
      const weeklyAvg = m.values.length > 0 ? weeklyTotal / m.values.filter(v => v !== null).length : 0;
      
      return `- ${m.nome}: Último valor: ${lastValue}, Média semanal: ${weeklyAvg.toFixed(1)}, Tendência: ${trend}, Valores da semana: [${m.values.join(', ')}]`;
    }).join('\n');

    const systemPrompt = `Você é um analista especialista em operações de clínicas de transplante capilar. 
Analise os indicadores operacionais diários e forneça insights acionáveis para os médicos.

Seja direto, objetivo e use linguagem profissional mas acessível.
Destaque pontos positivos e pontos de atenção.
Sugira ações concretas baseadas nos dados.

Formato da resposta:
1. Resumo Executivo (2-3 linhas)
2. Destaques Positivos (bullets)
3. Pontos de Atenção (bullets)
4. Recomendações de Ação (bullets numerados)

Use emojis estrategicamente para facilitar leitura rápida (✅ para positivo, ⚠️ para atenção, 📈 para crescimento, 📉 para queda).`;

    const userPrompt = `Analise os seguintes indicadores operacionais da semana${clinicName ? ` da ${clinicName}` : ''}:

${metricsSummary}

Contexto dos indicadores:
- Leads Novos: quantidade de novos leads captados
- Tempo de Uso (Atendente): minutos de uso do sistema pela atendente
- Atividades (Atendente/Robô): tarefas executadas manualmente vs automatizadas
- Mensagens Enviadas/Recebidas: volume de comunicação com leads
- Tarefas Realizadas/Atrasadas: gestão de follow-ups
- Agendamentos: consultas marcadas
- Vendas Realizadas: conversões fechadas
- Leads Descartados: leads perdidos ou desqualificados

Forneça uma análise concisa e acionável.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar análise. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Análise não disponível.";

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-daily-metrics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
