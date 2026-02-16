/**
 * avivar-vapi-create-call
 * Creates an outbound phone call via Vapi.ai for lead qualification
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY')
    if (!VAPI_API_KEY) throw new Error('VAPI_API_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: claims, error: authError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = claims.claims.sub as string

    const body = await req.json()
    const { lead_id, phone_number, lead_name, account_id, trigger_type = 'manual' } = body

    if (!phone_number || !account_id) {
      return new Response(JSON.stringify({ error: 'phone_number and account_id required' }), { status: 400, headers: corsHeaders })
    }

    // Get voice agent config
    const { data: config } = await supabase
      .from('avivar_voice_agent_config')
      .select('*')
      .eq('account_id', account_id)
      .single()

    if (!config) {
      return new Response(JSON.stringify({ error: 'Voice agent not configured. Go to VoIP Settings first.' }), { status: 400, headers: corsHeaders })
    }

    // Check daily limits
    if (config.last_reset_date !== new Date().toISOString().split('T')[0]) {
      await supabase
        .from('avivar_voice_agent_config')
        .update({ calls_today: 0, last_reset_date: new Date().toISOString().split('T')[0] })
        .eq('id', config.id)
      config.calls_today = 0
    }

    if (config.calls_today >= config.max_daily_calls) {
      return new Response(JSON.stringify({ error: 'Limite diário de ligações atingido' }), { status: 429, headers: corsHeaders })
    }

    // Get agent info for persona
    const { data: agents } = await supabase
      .from('avivar_agents')
      .select('name, company_name, professional_name, ai_identity, services, tone_of_voice')
      .eq('account_id', account_id)
      .eq('is_active', true)
      .limit(1)

    const agent = agents?.[0]
    const companyName = config.company_name || agent?.company_name || 'nossa empresa'
    const agentName = config.agent_name || agent?.name || 'Assistente'

    // Build qualification questions prompt
    const questions = config.qualification_questions || []
    const questionsPrompt = questions.map((q: any, i: number) => 
      `Pergunta ${i + 1}: "${q.question}"`
    ).join('\n')

    // Format phone for Vapi (E.164)
    let formattedPhone = phone_number.replace(/\D/g, '')
    if (!formattedPhone.startsWith('+')) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone
      }
      formattedPhone = '+' + formattedPhone
    }

    // Greeting
    const greeting = (config.greeting_template || 'Olá, {{lead_name}}! Aqui é {{agent_name}} da {{company_name}}. Tudo bem?')
      .replace('{{lead_name}}', lead_name || 'tudo bem')
      .replace('{{agent_name}}', agentName)
      .replace('{{company_name}}', companyName)

    // Build system prompt
    const systemPrompt = `Você é ${agentName}, representante comercial da ${companyName}. 
Você está fazendo uma ligação de qualificação para o lead ${lead_name || 'potencial cliente'}.

OBJETIVO: Fazer 3 perguntas de qualificação e, se o lead for qualificado, agendar uma reunião/consulta.

PERGUNTAS DE QUALIFICAÇÃO (faça na ordem, de forma natural e conversacional):
${questionsPrompt}

REGRAS:
- Seja natural, cordial e profissional
- Fale em português brasileiro
- Tom de voz: ${agent?.tone_of_voice || config.language === 'pt-BR' ? 'cordial' : 'professional'}
- Não seja robótico, adapte as perguntas ao fluxo da conversa
- Se o lead demonstrar interesse, sugira agendar uma consulta/reunião
- Se o lead não tiver interesse, agradeça educadamente
- Ao final, resuma as respostas e classifique o lead como: qualificado, não qualificado, ou precisa de follow-up
- Mantenha a ligação objetiva, idealmente entre 2-5 minutos

INFORMAÇÕES DISPONÍVEIS:
- Empresa: ${companyName}
- Serviços: ${agent?.services ? JSON.stringify(agent.services) : 'consulta disponível'}
`

    // Create call record
    const { data: callRecord, error: insertError } = await supabase
      .from('avivar_voice_calls')
      .insert({
        account_id,
        user_id: userId,
        lead_id: lead_id || null,
        phone_number: formattedPhone,
        lead_name: lead_name || null,
        status: 'queued',
        direction: 'outbound',
        trigger_type,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    // Webhook URL for Vapi callbacks
    const webhookUrl = `${supabaseUrl}/functions/v1/avivar-vapi-webhook`

    // Create Vapi call
    const vapiPayload: any = {
      assistant: {
        firstMessage: greeting,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.7,
        },
        voice: {
          provider: config.voice_provider || 'elevenlabs',
          voiceId: config.voice_id || 'pFZP5JQG7iQjIQuC4Bku',
        },
        transcriber: {
          provider: 'deepgram',
          language: config.language || 'pt-BR',
        },
        serverUrl: webhookUrl,
        serverUrlSecret: callRecord.id, // Use call ID as reference
      },
      customer: {
        number: formattedPhone,
        name: lead_name || undefined,
      },
      metadata: {
        call_record_id: callRecord.id,
        account_id,
        lead_id: lead_id || null,
        user_id: userId,
      },
    }

    // Use phone number ID if configured
    if (config.vapi_phone_number_id) {
      vapiPayload.phoneNumberId = config.vapi_phone_number_id
    }

    // Use existing assistant ID if configured
    if (config.vapi_assistant_id) {
      vapiPayload.assistantId = config.vapi_assistant_id
      delete vapiPayload.assistant
    }

    console.log('[vapi-create-call] Creating call for', formattedPhone, 'call_id:', callRecord.id)

    const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload),
    })

    const vapiData = await vapiResponse.json()

    if (!vapiResponse.ok) {
      console.error('[vapi-create-call] Vapi error:', vapiData)
      // Update call record with error
      await supabase
        .from('avivar_voice_calls')
        .update({ 
          status: 'failed', 
          error_message: vapiData.message || JSON.stringify(vapiData) 
        })
        .eq('id', callRecord.id)

      return new Response(JSON.stringify({ 
        error: 'Falha ao criar ligação', 
        details: vapiData.message || 'Verifique suas configurações do Vapi' 
      }), { status: 400, headers: corsHeaders })
    }

    // Update call record with Vapi call ID
    await supabase
      .from('avivar_voice_calls')
      .update({ 
        vapi_call_id: vapiData.id, 
        status: 'ringing' 
      })
      .eq('id', callRecord.id)

    // Increment daily counter
    await supabase
      .from('avivar_voice_agent_config')
      .update({ calls_today: (config.calls_today || 0) + 1 })
      .eq('id', config.id)

    console.log('[vapi-create-call] Call created successfully:', vapiData.id)

    return new Response(JSON.stringify({ 
      success: true, 
      call_id: callRecord.id,
      vapi_call_id: vapiData.id,
      status: 'ringing'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('[vapi-create-call] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
