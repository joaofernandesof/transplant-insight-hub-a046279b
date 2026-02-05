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

    // Send webhook to n8n
    const webhookUrl = Deno.env.get('N8N_HOTLEADS_WEBHOOK_URL')
    if (webhookUrl) {
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

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        console.log(`[hotleads-acquire] Webhook response status: ${webhookResponse.status}`)
      } catch (webhookError) {
        // Don't fail the claim if webhook fails
        console.error(`[hotleads-acquire] Webhook error (non-blocking):`, webhookError)
      }
    } else {
      console.warn(`[hotleads-acquire] N8N_HOTLEADS_WEBHOOK_URL not configured, skipping webhook`)
    }

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
