/**
 * fireflies-webhook
 * Receives Fireflies.ai webhook events when transcription completes.
 * Auto-imports the call and triggers AI analysis.
 * 
 * Fireflies webhook payload:
 * { meetingId: string, eventType: "Transcription completed", ... }
 * 
 * Webhook URL format:
 * https://<project>.supabase.co/functions/v1/fireflies-webhook?account_id=<uuid>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Detect product from call title patterns
function detectProductFromTitle(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('brows') || t.includes('sobrancelha')) return 'BROWS TRANSPLANT';
  if (t.includes('instrumentador') || t.includes('instrumen')) return 'INSTRUMENTADOR DE ELITE';
  if (t.includes('formação') || t.includes('formacao') || t.includes('360')) return 'Formação 360';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const account_id = url.searchParams.get('account_id')

    if (!account_id) {
      console.error('[fireflies-webhook] Missing account_id query param')
      return new Response(JSON.stringify({ error: 'account_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { meetingId, eventType } = body

    console.log(`[fireflies-webhook] Event: ${eventType}, meetingId: ${meetingId}, account: ${account_id}`)

    // Only process transcription completed events
    if (eventType !== 'Transcription completed') {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'event type not handled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!meetingId) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no meetingId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get Fireflies API key
    const { data: settingData } = await supabase
      .from('avivar_account_settings')
      .select('setting_value')
      .eq('account_id', account_id)
      .eq('setting_key', 'fireflies_api_key')
      .maybeSingle()

    if (!settingData?.setting_value) {
      console.error('[fireflies-webhook] No API key configured for account', account_id)
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = typeof settingData.setting_value === 'string'
      ? settingData.setting_value
      : (settingData.setting_value as any)?.key

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Get filter config
    const { data: filterSetting } = await supabase
      .from('avivar_account_settings')
      .select('setting_value')
      .eq('account_id', account_id)
      .eq('setting_key', 'fireflies_filter_config')
      .maybeSingle()

    const filterConfig = filterSetting?.setting_value as any
    const filterMode = filterConfig?.mode || 'include'
    const filterKeywords: string[] = filterConfig?.keywords || ['Reunião com']

    // 3. Get account owner user_id
    const { data: accountData } = await supabase
      .from('avivar_accounts')
      .select('owner_user_id')
      .eq('id', account_id)
      .single()

    if (!accountData) {
      console.error('[fireflies-webhook] Account not found:', account_id)
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user_id = accountData.owner_user_id

    // 4. Fetch transcript details from Fireflies
    const detailQuery = `
      query($id: String!) {
        transcript(id: $id) {
          id
          title
          date
          duration
          participants
          organizer_email
          fireflies_users
          sentences {
            speaker_name
            text
          }
          summary {
            overview
            shorthand_bullet
            action_items
            keywords
          }
        }
      }
    `

    const ffResponse = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: detailQuery, variables: { id: meetingId } }),
    })

    if (!ffResponse.ok) {
      const errText = await ffResponse.text()
      console.error('[fireflies-webhook] Fireflies API error:', ffResponse.status, errText)
      return new Response(JSON.stringify({ error: `Fireflies API error: ${ffResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ffData = await ffResponse.json()
    if (ffData.errors) {
      console.error('[fireflies-webhook] Fireflies GraphQL error:', ffData.errors)
      return new Response(JSON.stringify({ error: ffData.errors[0]?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const transcript = ffData.data?.transcript
    if (!transcript) {
      console.log('[fireflies-webhook] Transcript not found for meetingId:', meetingId)
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'transcript not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Apply filter
    if (filterMode === 'include' && filterKeywords.length > 0) {
      const titleLower = (transcript.title || '').toLowerCase()
      const matches = filterKeywords.some((kw: string) => titleLower.includes(kw.toLowerCase()))
      if (!matches) {
        console.log(`[fireflies-webhook] Skipped "${transcript.title}" - no keyword match`)
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'filter mismatch' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 6. Check for duplicates
    const externalId = `fireflies_${transcript.id}`
    const { data: existingCall } = await supabase
      .from('sales_calls')
      .select('id')
      .eq('account_id', account_id)
      .eq('external_id', externalId)
      .maybeSingle()

    if (existingCall) {
      console.log(`[fireflies-webhook] Already imported: ${externalId}`)
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'already imported' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Build transcript text
    const sentences = transcript.sentences || []
    const fullTranscript = sentences.length > 0
      ? sentences.map((s: any) => `${s.speaker_name}: ${s.text}`).join('\n')
      : ''

    // 8. Extract lead name
    let leadName = transcript.title || 'Sem título'
    const prefixes = [
      'Reunião com Dr(a). ', 'Reunião com Dra. ', 'Reunião com Dr. ',
      'REUNIÃO COM ', 'Reunião com ', 'DISPARO ', 'REUNIÃO - ',
    ]
    for (const prefix of prefixes) {
      if (leadName.startsWith(prefix)) {
        leadName = leadName.slice(prefix.length).trim()
        break
      }
    }

    // Content dedup check
    const contentKey = `${leadName.toLowerCase()}::${fullTranscript.trim().slice(0, 500).toLowerCase().replace(/\s+/g, ' ')}`
    const { data: existingByContent } = await supabase
      .from('sales_calls')
      .select('id')
      .eq('account_id', account_id)
      .eq('lead_nome', leadName)
      .limit(1)

    // More precise content dedup if needed
    if (existingByContent && existingByContent.length > 0 && fullTranscript) {
      for (const existing of existingByContent) {
        const { data: existingFull } = await supabase
          .from('sales_calls')
          .select('transcricao')
          .eq('id', existing.id)
          .single()
        if (existingFull) {
          const existingKey = (existingFull.transcricao || '').trim().slice(0, 500).toLowerCase().replace(/\s+/g, ' ')
          const newKey = fullTranscript.trim().slice(0, 500).toLowerCase().replace(/\s+/g, ' ')
          if (existingKey === newKey) {
            console.log(`[fireflies-webhook] Content duplicate detected for "${leadName}"`)
            return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'content duplicate' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
      }
    }

    // 9. Build resumo
    const summary = transcript.summary || {}
    let resumo = ''
    if (summary.overview) resumo += `## Resumo\n${summary.overview}\n\n`
    if (summary.shorthand_bullet) resumo += `## Destaques\n${summary.shorthand_bullet}\n\n`
    if (summary.action_items) resumo += `## Action Items\n${summary.action_items}\n\n`
    if (summary.keywords?.length) resumo += `## Keywords\n${summary.keywords.join(', ')}\n`

    // 10. Determine closer name
    const speakerNames = [...new Set(sentences.map((s: any) => s.speaker_name).filter(Boolean))]
    const closerName = speakerNames.find((name: string) =>
      !leadName.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    ) || speakerNames[0] || 'Closer'

    const callDate = transcript.date ? new Date(transcript.date).toISOString() : new Date().toISOString()

    const detectedProduct = detectProductFromTitle(transcript.title)

    // 11. Insert call
    const { data: insertedCall, error: insertError } = await supabase.from('sales_calls').insert({
      account_id,
      closer_id: user_id,
      closer_name: closerName,
      lead_nome: leadName,
      produto: detectedProduct,
      data_call: callDate,
      status_call: 'followup',
      transcricao: fullTranscript || null,
      resumo_manual: resumo || null,
      fonte_call: 'fireflies',
      has_analysis: false,
      external_id: externalId,
      fireflies_url: `https://app.fireflies.ai/view/${transcript.id}`,
    }).select('id').single()

    if (insertError) {
      console.error('[fireflies-webhook] Insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to insert call' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[fireflies-webhook] Imported: "${transcript.title}" -> ${insertedCall.id}`)

    // 12. Auto-analyze
    const content = fullTranscript || resumo
    if (content && content.trim().length >= 30) {
      try {
        const analyzeUrl = `${supabaseUrl}/functions/v1/neoteam-analyze-call`
        const resp = await fetch(analyzeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            transcript: content,
            closer_name: closerName,
            lead_nome: leadName,
            produto: null,
            data_call: callDate,
            status_call: 'followup',
            call_id: insertedCall.id,
            account_id,
            fireflies_url: `https://app.fireflies.ai/view/${transcript.id}`,
          }),
        })

        if (resp.ok) {
          console.log(`[fireflies-webhook] Analysis completed for call ${insertedCall.id}`)
        } else {
          console.error(`[fireflies-webhook] Analysis failed: ${resp.status}`)
        }
      } catch (err) {
        console.error('[fireflies-webhook] Analysis error:', err)
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      imported: true,
      call_id: insertedCall.id,
      title: transcript.title,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[fireflies-webhook] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
