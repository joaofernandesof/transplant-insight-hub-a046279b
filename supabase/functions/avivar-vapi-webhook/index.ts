/**
 * avivar-vapi-webhook
 * Receives Vapi.ai call events (status updates, transcripts, end-of-call)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { message } = body

    if (!message) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    const messageType = message.type
    const call = message.call || {}
    const metadata = call.metadata || {}
    const callRecordId = metadata.call_record_id

    console.log(`[vapi-webhook] Event: ${messageType}, call_record_id: ${callRecordId}`)

    if (!callRecordId) {
      console.log('[vapi-webhook] No call_record_id in metadata, skipping')
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    switch (messageType) {
      case 'status-update': {
        const status = message.status
        const statusMap: Record<string, string> = {
          'ringing': 'ringing',
          'in-progress': 'in_progress',
          'forwarding': 'in_progress',
          'ended': 'completed',
        }
        const mappedStatus = statusMap[status] || status

        const updates: Record<string, any> = { status: mappedStatus }
        
        if (status === 'in-progress') {
          updates.started_at = new Date().toISOString()
        }

        await supabase
          .from('avivar_voice_calls')
          .update(updates)
          .eq('id', callRecordId)

        break
      }

      case 'end-of-call-report': {
        const transcript = message.transcript || ''
        const summary = message.summary || ''
        const recordingUrl = message.recordingUrl
        const durationSeconds = message.durationSeconds || call.duration || 0
        const cost = message.cost ? Math.round(message.cost * 100) : null
        const endedReason = message.endedReason || ''

        // Determine status based on ended reason
        let finalStatus = 'completed'
        if (endedReason === 'customer-did-not-answer' || endedReason === 'no-answer') {
          finalStatus = 'no_answer'
        } else if (endedReason === 'customer-busy' || endedReason === 'busy') {
          finalStatus = 'busy'
        } else if (endedReason === 'error' || endedReason === 'pipeline-error') {
          finalStatus = 'failed'
        }

        // Parse structured transcript
        const messages = message.messages || message.artifact?.messages || []
        const transcriptJson = messages.map((m: any) => ({
          role: m.role,
          content: m.content || m.message,
          time: m.time || m.secondsFromStart,
        }))

        // Analyze qualification from transcript
        const qualificationResult = analyzeQualification(transcript, summary, messages)

        const updates: Record<string, any> = {
          status: finalStatus,
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
          transcript_json: transcriptJson.length > 0 ? transcriptJson : null,
          summary: summary || null,
          qualification_answers: qualificationResult.answers,
          qualification_score: qualificationResult.score,
          qualification_result: qualificationResult.result,
          sentiment: qualificationResult.sentiment,
          cost_cents: cost,
          meeting_scheduled: qualificationResult.meetingMentioned,
        }

        await supabase
          .from('avivar_voice_calls')
          .update(updates)
          .eq('id', callRecordId)

        // If qualified, optionally move lead in kanban
        if (qualificationResult.result === 'qualified' && metadata.lead_id) {
          console.log(`[vapi-webhook] Lead ${metadata.lead_id} qualified, could trigger kanban move`)
        }

        console.log(`[vapi-webhook] Call ${callRecordId} ended: ${finalStatus}, score: ${qualificationResult.score}`)
        break
      }

      case 'transcript': {
        // Real-time transcript updates (optional)
        break
      }

      case 'hang': {
        await supabase
          .from('avivar_voice_calls')
          .update({ 
            status: 'completed', 
            ended_at: new Date().toISOString() 
          })
          .eq('id', callRecordId)
        break
      }

      default:
        console.log(`[vapi-webhook] Unhandled event type: ${messageType}`)
    }

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('[vapi-webhook] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

/**
 * Analyze qualification from call transcript/summary
 */
function analyzeQualification(transcript: string, summary: string, messages: any[]) {
  const text = (transcript + ' ' + summary).toLowerCase()
  
  // Simple heuristic analysis
  const positiveSignals = [
    'interesse', 'agendar', 'consulta', 'quero', 'gostaria', 'disponível',
    'pode agendar', 'horário', 'marca', 'procedimento', 'valor', 'quanto custa',
    'sim', 'claro', 'com certeza', 'vamos', 'pode ser'
  ]
  
  const negativeSignals = [
    'não tenho interesse', 'não quero', 'agora não', 'depois', 'não preciso',
    'cancelar', 'remover', 'parar', 'não me ligue', 'bloqueio'
  ]

  const meetingKeywords = [
    'agendar', 'agendamento', 'consulta', 'reunião', 'horário marcado',
    'dia', 'semana que vem', 'amanhã'
  ]

  let positiveCount = 0
  let negativeCount = 0
  let meetingMentioned = false

  positiveSignals.forEach(s => {
    if (text.includes(s)) positiveCount++
  })

  negativeSignals.forEach(s => {
    if (text.includes(s)) negativeCount++
  })

  meetingKeywords.forEach(s => {
    if (text.includes(s)) meetingMentioned = true
  })

  // Score calculation (0-100)
  const score = Math.min(100, Math.max(0, Math.round(
    (positiveCount / Math.max(1, positiveCount + negativeCount)) * 100
  )))

  let result: string
  if (score >= 60 || meetingMentioned) {
    result = 'qualified'
  } else if (score >= 30) {
    result = 'needs_followup'
  } else {
    result = 'not_qualified'
  }

  // Sentiment
  let sentiment: string
  if (positiveCount > negativeCount * 2) {
    sentiment = 'positive'
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative'
  } else {
    sentiment = 'neutral'
  }

  // Extract answers from messages (best effort)
  const answers: Record<string, any> = {}
  const assistantMessages = messages.filter((m: any) => m.role === 'assistant')
  const userMessages = messages.filter((m: any) => m.role === 'user')
  
  // Map user responses to Q1, Q2, Q3 (simplified)
  userMessages.slice(0, 3).forEach((msg: any, i: number) => {
    answers[`q${i + 1}`] = {
      answer: msg.content || msg.message || '',
      score: score,
    }
  })

  return { answers, score, result, sentiment, meetingMentioned }
}
