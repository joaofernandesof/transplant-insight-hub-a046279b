/**
 * avivar-send-group-report
 * Sends a WhatsApp message to a group via UazAPI
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
    const { account_id, group_id, message } = await req.json()

    if (!account_id || !group_id || !message) {
      return new Response(JSON.stringify({ error: 'account_id, group_id e message são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get UazAPI credentials
    const uazapiUrl = Deno.env.get('UAZAPI_URL')
    let uazapiToken: string | undefined

    const { data: uazapiInstance } = await supabase
      .from('avivar_uazapi_instances')
      .select('instance_token')
      .eq('account_id', account_id)
      .eq('status', 'connected')
      .limit(1)
      .maybeSingle()

    uazapiToken = uazapiInstance?.instance_token || Deno.env.get('UAZAPI_TOKEN') || undefined

    if (!uazapiUrl || !uazapiToken) {
      return new Response(JSON.stringify({ error: 'WhatsApp não configurado para esta conta' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send text to group
    const resp = await fetch(`${uazapiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': uazapiToken },
      body: JSON.stringify({ number: group_id, text: message }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('[send-group-report] UazAPI error:', resp.status, errText)
      return new Response(JSON.stringify({ error: `Falha ao enviar: ${resp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[send-group-report] Message sent to group ${group_id}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[send-group-report] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
