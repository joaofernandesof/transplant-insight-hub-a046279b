import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check - only admins
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token)
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const callerUserId = claims.claims.sub as string

    // Check if caller is admin
    const { data: isAdmin } = await supabaseAuth.rpc('is_neohub_admin', { _user_id: callerUserId })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden - admin only' }), { status: 403, headers: corsHeaders })
    }

    const { email, password, full_name, phone, cpf, profiles, allowed_portals } = await req.json()

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'email, password and full_name are required' }), { status: 400, headers: corsHeaders })
    }

    // Use service role to create user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      console.error('Auth create error:', authError)
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders })
    }

    const newUserId = authData.user.id
    console.log(`Auth user created: ${newUserId}`)

    // 2. Create neohub_users record
    const { data: neohubUser, error: neohubError } = await supabaseAdmin
      .from('neohub_users')
      .insert({
        user_id: newUserId,
        email,
        full_name,
        phone: phone || null,
        cpf: cpf || null,
        allowed_portals: allowed_portals || [],
        is_active: true,
      })
      .select('id')
      .single()

    if (neohubError) {
      console.error('NeoHub user create error:', neohubError)
      return new Response(JSON.stringify({ error: neohubError.message }), { status: 400, headers: corsHeaders })
    }

    console.log(`NeoHub user created: ${neohubUser.id}`)

    // 3. Create profiles
    if (profiles && profiles.length > 0) {
      const profileRecords = profiles.map((p: string) => ({
        neohub_user_id: neohubUser.id,
        profile: p,
        is_active: true,
      }))

      const { error: profileError } = await supabaseAdmin
        .from('neohub_user_profiles')
        .insert(profileRecords)

      if (profileError) {
        console.error('Profile create error:', profileError)
      } else {
        console.log(`Profiles created: ${profiles.join(', ')}`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: newUserId,
      neohub_user_id: neohubUser.id,
      email,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders })
  }
})
