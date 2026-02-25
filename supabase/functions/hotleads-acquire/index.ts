import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub

    // Parse body
    const { lead_id, user_email } = await req.json()

    if (!lead_id || !user_email) {
      return new Response(JSON.stringify({ error: 'lead_id and user_email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[hotleads-acquire] User ${userId} acquiring lead ${lead_id} with email ${user_email}`)

    // Use service role to do atomic claim
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check user's state from neohub_users
    const { data: userProfile } = await supabaseAdmin
      .from('neohub_users')
      .select('address_state, user_id, full_name')
      .eq('user_id', userId)
      .single()

    // Check if user is admin (admins bypass state restriction)
    const isAdmin = await supabaseAdmin.rpc('is_neohub_admin', { _user_id: userId })
    const userIsAdmin = isAdmin?.data === true

    // If not admin, validate state match
    if (!userIsAdmin && userProfile?.address_state) {
      // Get lead's state first
      const { data: leadData } = await supabaseAdmin
        .from('leads')
        .select('state')
        .eq('id', lead_id)
        .single()

      if (leadData?.state && leadData.state !== userProfile.address_state) {
        console.log(`[hotleads-acquire] State mismatch: user=${userProfile.address_state}, lead=${leadData.state}`)
        return new Response(
          JSON.stringify({ error: 'Você só pode capturar leads do seu estado.' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Atomic claim: only succeeds if claimed_by IS NULL
    const { data: claimedLead, error: claimError } = await supabaseAdmin
      .from('leads')
      .update({
        claimed_by: userId,
        claimed_at: new Date().toISOString(),
        status: 'contacted',
      })
      .eq('id', lead_id)
      .is('claimed_by', null)
      .select('id, name, phone, email, city, state')
      .single()

    if (claimError || !claimedLead) {
      console.log(`[hotleads-acquire] Lead ${lead_id} already claimed or not found`, claimError)
      return new Response(
        JSON.stringify({ error: 'Este lead já foi adquirido por outro usuário.' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[hotleads-acquire] Lead ${lead_id} claimed successfully by ${userId}`)

    // Skip webhooks for test leads (created via admin test button)
    const isTestLead = claimedLead.name?.startsWith('[TESTE]')
    if (isTestLead) {
      console.log(`[hotleads-acquire] Skipping webhooks for test lead ${lead_id}`)
    }

    // Send webhooks to n8n in parallel (skip for test leads)
    const webhookPromises: Promise<void>[] = []

    // Webhook 1: existing lead data webhook
    const webhookUrl = !isTestLead ? Deno.env.get('N8N_HOTLEADS_WEBHOOK_URL') : null
    if (webhookUrl) {
      webhookPromises.push((async () => {
        try {
          const payload = {
            user_email,
            lead: {
              nome: claimedLead.name,
              telefone: claimedLead.phone,
              email: claimedLead.email,
              cidade: claimedLead.city,
              estado: claimedLead.state,
            },
          }
          console.log(`[hotleads-acquire] Sending webhook to n8n`, JSON.stringify(payload))
          const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          console.log(`[hotleads-acquire] Webhook response status: ${resp.status}`)
        } catch (e) {
          console.error(`[hotleads-acquire] Webhook error (non-blocking):`, e)
        }
      })())
    } else {
      console.warn(`[hotleads-acquire] N8N_HOTLEADS_WEBHOOK_URL not configured, skipping webhook`)
    }

    // Webhook 2: group notification webhook
    const groupWebhookUrl = !isTestLead ? Deno.env.get('N8N_HOTLEADS_GROUP_WEBHOOK_URL') : null
    if (groupWebhookUrl) {
      webhookPromises.push((async () => {
        try {
          const groupPayload = {
            usuario_nome: userProfile?.full_name || user_email,
            lead_nome: claimedLead.name,
            lead_cidade: claimedLead.city,
            lead_estado: claimedLead.state,
          }
          console.log(`[hotleads-acquire] Sending group notification webhook`, JSON.stringify(groupPayload))
          const resp = await fetch(groupWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupPayload),
          })
          console.log(`[hotleads-acquire] Group webhook response status: ${resp.status}`)
        } catch (e) {
          console.error(`[hotleads-acquire] Group webhook error (non-blocking):`, e)
        }
      })())
    }

    // Wait for all webhooks (non-blocking for the response)
    await Promise.allSettled(webhookPromises)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead adquirido com sucesso! Os dados serão enviados para seu e-mail.',
        lead_id: claimedLead.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error(`[hotleads-acquire] Unexpected error:`, error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
