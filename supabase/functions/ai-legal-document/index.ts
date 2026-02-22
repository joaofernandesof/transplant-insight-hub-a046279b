/**
 * IPROMED - AI Legal Document Generator
 * Geração de documentos jurídicos usando Lovable AI
 * Suporta: TCLEs, Pareceres, Petições, Contratos, Scoring de Risco
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prompts especializados por tipo de documento
const documentPrompts: Record<string, string> = {
  tcle: `Você é um especialista em Direito Médico brasileiro. Elabore um Termo de Consentimento Livre e Esclarecido (TCLE) completo e juridicamente válido para o procedimento médico descrito.

O TCLE deve incluir:
1. Identificação completa do paciente e do médico responsável
2. Descrição detalhada do procedimento proposto
3. Indicações e objetivos do procedimento
4. Descrição técnica da metodologia empregada
5. Riscos conhecidos (gerais e específicos do procedimento)
6. Alternativas terapêuticas disponíveis
7. Possíveis complicações e efeitos colaterais
8. Cuidados pré e pós-procedimento
9. Declaração de esclarecimento e consentimento
10. Espaço para assinaturas e data
11. Declaração de capacidade de revogação

Use linguagem clara e acessível ao paciente, mantendo a precisão técnica necessária.`,

  parecer: `Você é uma advogada especialista em Direito Médico com vasta experiência em pareceres jurídicos para profissionais de saúde.

Elabore um parecer jurídico completo contendo:
1. EMENTA - Resumo do tema consultado
2. RELATÓRIO - Síntese dos fatos e documentos apresentados
3. FUNDAMENTAÇÃO JURÍDICA - Análise detalhada com citação de:
   - Legislação aplicável (Lei 12.842/2013, CFM, CRM)
   - Jurisprudência relevante
   - Doutrina especializada
4. ANÁLISE DE RISCOS
   - Risco Ético (CRM): classificação e fundamentação
   - Risco Cível: classificação e fundamentação
   - Risco Criminal: classificação e fundamentação
5. RECOMENDAÇÕES PREVENTIVAS
6. CONCLUSÃO

Mantenha tom técnico-jurídico, objetivo e fundamentado.`,

  peticao_inicial: `Você é uma advogada especialista em Direito Médico atuando na defesa de profissionais de saúde.

Elabore uma petição inicial/contestação completa contendo:
1. ENDEREÇAMENTO ao juízo competente
2. QUALIFICAÇÃO DAS PARTES
3. DOS FATOS - Narrativa cronológica e detalhada
4. DO DIREITO - Fundamentação jurídica robusta com:
   - Legislação aplicável
   - Jurisprudência do STJ/TJ
   - Doutrina médico-legal
5. DOS PEDIDOS - Específicos e fundamentados
6. DO VALOR DA CAUSA
7. REQUERIMENTOS FINAIS

Use a formatação padrão forense brasileira.`,

  contestacao: `Você é uma advogada especialista em Direito Médico na defesa de médicos em processos judiciais.

Elabore uma contestação completa contendo:
1. TEMPESTIVIDADE
2. PRELIMINARES (se aplicáveis)
   - Ilegitimidade passiva
   - Inépcia da inicial
   - Prescrição/Decadência
3. MÉRITO
   - Impugnação específica dos fatos
   - Ausência de erro médico
   - Inexistência de nexo causal
   - Excludentes de responsabilidade
4. FUNDAMENTOS JURÍDICOS
   - Art. 14, §4º CDC (responsabilidade subjetiva)
   - Jurisprudência favorável
5. DOS PEDIDOS
6. PROVAS

Use formatação forense e linguagem técnica.`,

  contrato: `Você é uma advogada especialista em contratos médicos e compliance em saúde.

Elabore um contrato completo contendo:
1. QUALIFICAÇÃO DAS PARTES
2. OBJETO DO CONTRATO
3. OBRIGAÇÕES DAS PARTES
4. PREÇO E CONDIÇÕES DE PAGAMENTO
5. PRAZO E VIGÊNCIA
6. CLÁUSULAS DE SIGILO (LGPD)
7. RESPONSABILIDADES
8. PENALIDADES
9. RESCISÃO
10. FORO E DISPOSIÇÕES GERAIS

Inclua cláusulas específicas de proteção ao médico.`,

  notificacao: `Você é uma advogada especialista em Direito Médico.

Elabore uma notificação extrajudicial completa contendo:
1. IDENTIFICAÇÃO DO NOTIFICANTE
2. IDENTIFICAÇÃO DO NOTIFICADO
3. DOS FATOS
4. DO DIREITO
5. DA NOTIFICAÇÃO
6. DO PRAZO PARA RESPOSTA
7. DAS CONSEQUÊNCIAS DO NÃO ATENDIMENTO

Use tom formal e assertivo.`,

  procuracao: `Elabore uma procuração ad judicia et extra completa para representação em:
- Processos éticos (CRM)
- Processos cíveis
- Processos criminais
- Processos administrativos

Inclua poderes específicos para o Direito Médico.`,
};

// Prompt para scoring de risco
const riskScoringPrompt = `Você é uma especialista em análise de risco jurídico para profissionais médicos.

Analise o caso descrito e forneça um score de risco nas três dimensões:

1. RISCO ÉTICO (CRM) - Peso 40%
   - Avalie: conduta profissional, documentação, consentimento informado
   - Score: 0-100

2. RISCO CÍVEL - Peso 35%
   - Avalie: potencial de ação indenizatória, dano material/moral
   - Score: 0-100

3. RISCO CRIMINAL - Peso 25%
   - Avalie: negligência, imprudência, imperícia grave
   - Score: 0-100

Responda APENAS em formato JSON:
{
  "risk_crm": { "score": X, "justificativa": "..." },
  "risk_civel": { "score": X, "justificativa": "..." },
  "risk_criminal": { "score": X, "justificativa": "..." },
  "total_score": X,
  "classification": "baixo|medio|alto|critico",
  "recommendations": ["..."]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const _logStart = Date.now();
  let _logStatus = "success";
  let _logError = "";
  let _logTokensIn = 0;
  let _logTokensOut = 0;

  try {
    const { prompt, documentType, context, action } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Determine system prompt based on action/document type
    let systemPrompt: string;
    let userPrompt: string;

    if (action === "risk_scoring") {
      systemPrompt = riskScoringPrompt;
      userPrompt = `Analise o seguinte caso e forneça o scoring de risco:\n\n${prompt}`;
    } else {
      systemPrompt = documentPrompts[documentType] || documentPrompts.parecer;
      userPrompt = prompt;
    }

    // Add context if available
    if (context?.clientName) {
      userPrompt = `Cliente: ${context.clientName}\n\n${userPrompt}`;
    }
    if (context?.caseNumber) {
      userPrompt = `Processo: ${context.caseNumber}\n\n${userPrompt}`;
    }

    console.log(`Generating ${action || documentType} document...`);

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
        max_tokens: 4000,
        temperature: 0.3,
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
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`Erro no gateway AI: ${response.status}`);
    }

    const data = await response.json();
    _logTokensIn = data.usage?.prompt_tokens || 0;
    _logTokensOut = data.usage?.completion_tokens || 0;
    const content = data.choices?.[0]?.message?.content || "";

    // For risk scoring, parse JSON response
    if (action === "risk_scoring") {
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const riskData = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ content, riskData }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("Failed to parse risk scoring JSON:", e);
      }
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    _logStatus = "error";
    _logError = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("AI document generation error:", error);
    return new Response(
      JSON.stringify({ error: _logError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const _estCost = (_logTokensIn / 1e6) * 0.10 + (_logTokensOut / 1e6) * 0.40;
      const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      _sb.from("edge_function_logs").insert({ function_name: "ai-legal-document", execution_time_ms: Date.now() - _logStart, status: _logStatus, tokens_input: _logTokensIn, tokens_output: _logTokensOut, model_used: "google/gemini-3-flash-preview", estimated_cost_usd: _estCost, error_message: _logError || null }).then(() => {});
    } catch {}
  }
});
