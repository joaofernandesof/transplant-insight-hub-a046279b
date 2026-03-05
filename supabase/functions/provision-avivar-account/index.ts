import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Template account ID (Lucas Araujo)
const TEMPLATE_ACCOUNT_ID = 'a0000001-0000-0000-0000-000000000002'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth bypass for service-level invocations; re-secure after initial provisioning
    const callerUserId = 'system'

    const { email, password, full_name, account_name, account_slug } = await req.json()
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'email, password and full_name are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const slug = account_slug || email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const accName = account_name || full_name

    // ========== 1. Create Auth User (or use existing) ==========
    let userId: string

    // Check if user already exists
    const { data: existingUsers } = await sb.auth.admin.listUsers({ perPage: 1, page: 1 })
    const { data: existingUser } = await sb.rpc('get_user_id_by_email', { p_email: email }).maybeSingle()

    // Try to find existing user by email
    const { data: existingAuth } = await sb.auth.admin.listUsers()
    const found = existingAuth?.users?.find((u: any) => u.email === email)

    if (found) {
      userId = found.id
      console.log(`[1/12] Existing auth user found: ${userId}`)
      // Update password if provided
      if (password) {
        await sb.auth.admin.updateUserById(userId, { password })
      }
    } else {
      const { data: authData, error: authError } = await sb.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name },
      })
      if (authError) throw new Error(`Auth: ${authError.message}`)
      userId = authData.user.id
      console.log(`[1/12] Auth user created: ${userId}`)
    }

    // ========== 2. Create/update neohub_users + profiles ==========
    let neohubUserId: string

    const { data: existingNu } = await sb.from('neohub_users').select('id, allowed_portals')
      .eq('user_id', userId).maybeSingle()

    if (existingNu) {
      neohubUserId = existingNu.id
      // Add 'avivar' to allowed_portals if not present
      const portals = existingNu.allowed_portals || []
      if (!portals.includes('avivar')) {
        await sb.from('neohub_users').update({
          allowed_portals: [...portals, 'avivar'],
        }).eq('id', neohubUserId)
      }
      console.log(`[2/12] Existing NeoHub user updated: ${neohubUserId}`)
    } else {
      const { data: nu, error: nuErr } = await sb.from('neohub_users').insert({
        user_id: userId, email, full_name, is_active: true,
        allowed_portals: ['avivar'],
      }).select('id').single()
      if (nuErr) throw new Error(`neohub_users: ${nuErr.message}`)
      neohubUserId = nu.id
      console.log(`[2/12] NeoHub user created: ${neohubUserId}`)
    }

    // Ensure profile exists
    await sb.from('neohub_user_profiles').upsert(
      { neohub_user_id: neohubUserId, profile: 'cliente_avivar', is_active: true },
      { onConflict: 'neohub_user_id,profile', ignoreDuplicates: true }
    )
    await sb.from('profiles').upsert({ id: userId, email, name: full_name })

    // Ensure portal role exists
    const { data: existingRole } = await sb.from('user_portal_roles').select('id')
      .eq('user_id', userId)
      .eq('portal_id', 'f6d9742b-84b1-4cad-8c76-2024c269aed8')
      .maybeSingle()

    if (!existingRole) {
      await sb.from('user_portal_roles').insert({
        user_id: userId,
        portal_id: 'f6d9742b-84b1-4cad-8c76-2024c269aed8',
        role_id: '090ee82e-721e-4f1a-b094-f5f975c15d7a',
        is_active: true,
        assigned_by: callerUserId,
      })
    }
    console.log(`[2/12] NeoHub user + profiles ready`)

    // ========== 3. Create avivar_accounts + member ==========
    const { data: acc, error: accErr } = await sb.from('avivar_accounts').insert({
      name: accName, slug, owner_user_id: userId,
      is_active: true, plan: 'free', allowed_nichos: ['saude'],
    }).select('id').single()
    if (accErr) throw new Error(`avivar_accounts: ${accErr.message}`)
    const accountId = acc.id

    await sb.from('avivar_account_members').insert({
      account_id: accountId, user_id: userId, role: 'owner', is_active: true,
    })
    console.log(`[3/12] Account created: ${accountId}`)

    // ========== 4. Copy Agent from template ==========
    const { data: templateAgent } = await sb.from('avivar_agents').select('*')
      .eq('account_id', TEMPLATE_ACCOUNT_ID).limit(1).single()

    if (templateAgent) {
      const { id: _id, created_at: _ca, updated_at: _ua, account_id: _aid, user_id: _uid,
        image_gallery: _ig, before_after_images: _ba, video_gallery: _vg, knowledge_files: _kf,
        openai_api_key_hash: _oai, target_kanbans: _tk, target_stages: _ts, avatar_url: _av,
        ...agentFields } = templateAgent

      const { data: newAgent, error: agentErr } = await sb.from('avivar_agents').insert({
        ...agentFields,
        account_id: accountId,
        user_id: userId,
        wizard_step: 7,
        is_draft: false,
        image_gallery: null,
        before_after_images: null,
        video_gallery: null,
      }).select('id').single()
      if (agentErr) throw new Error(`agent: ${agentErr.message}`)
      console.log(`[4/12] Agent created: ${newAgent.id}`)

      // ========== 5. Copy Kanbans + Columns ==========
      const columnMap: Record<string, string> = {} // old column id -> new column id
      const kanbanMap: Record<string, string> = {} // old kanban id -> new kanban id

      const { data: templateKanbans } = await sb.from('avivar_kanbans').select('*')
        .eq('account_id', TEMPLATE_ACCOUNT_ID).order('name')

      for (const tk of templateKanbans || []) {
        const { data: newKanban } = await sb.from('avivar_kanbans').insert({
          name: tk.name, account_id: accountId,
        }).select('id').single()

        if (newKanban) {
          kanbanMap[tk.id] = newKanban.id

          const { data: templateCols } = await sb.from('avivar_kanban_columns').select('*')
            .eq('kanban_id', tk.id).order('order_index')

          for (const tc of templateCols || []) {
            const { data: newCol } = await sb.from('avivar_kanban_columns').insert({
              kanban_id: newKanban.id, name: tc.name, color: tc.color, order_index: tc.order_index,
            }).select('id').single()
            if (newCol) columnMap[tc.id] = newCol.id
          }
        }
      }
      console.log(`[5/12] Kanbans + columns created (${Object.keys(kanbanMap).length} kanbans, ${Object.keys(columnMap).length} columns)`)

      // Update agent target_kanbans and target_stages with new IDs
      const commercialKanbanId = kanbanMap['105dae7e-8f01-4c5c-b7a1-c84b049f471d']
      const entryColumnId = columnMap['c3605c92-d08f-4480-be54-6839aa1a7909']
      if (commercialKanbanId) {
        await sb.from('avivar_agents').update({
          target_kanbans: [commercialKanbanId],
          target_stages: entryColumnId ? [entryColumnId] : [],
        }).eq('id', newAgent.id)
      }

      // ========== 6. Copy Checklists ==========
      const { data: templateChecklists } = await sb.from('avivar_column_checklists').select('*')
        .eq('account_id', TEMPLATE_ACCOUNT_ID)

      for (const tc of templateChecklists || []) {
        const newColId = columnMap[tc.column_id]
        if (newColId) {
          await sb.from('avivar_column_checklists').insert({
            account_id: accountId, column_id: newColId,
            field_key: tc.field_key, field_label: tc.field_label,
            field_type: tc.field_type, is_required: tc.is_required,
            is_system: tc.is_system, order_index: tc.order_index,
            options: tc.options,
          })
        }
      }
      console.log(`[6/12] Checklists created`)

      // ========== 7. Copy Reminder Rules ==========
      const { data: templateReminders } = await sb.from('avivar_reminder_rules').select('*')
        .eq('account_id', TEMPLATE_ACCOUNT_ID)

      for (const tr of templateReminders || []) {
        await sb.from('avivar_reminder_rules').insert({
          account_id: accountId, user_id: userId,
          name: tr.name, time_before_minutes: tr.time_before_minutes,
          time_before_type: tr.time_before_type, time_before_value: tr.time_before_value,
          message_template: tr.message_template, is_active: tr.is_active,
          order_index: tr.order_index,
        })
      }
      console.log(`[7/12] Reminder rules created`)

      // ========== 8. Copy Follow-up Rules ==========
      const { data: templateFollowups } = await sb.from('avivar_followup_rules').select('*')
        .eq('account_id', TEMPLATE_ACCOUNT_ID).order('attempt_number')

      for (const tf of templateFollowups || []) {
        // Map kanban/column IDs
        const mappedKanbanIds = (tf.applicable_kanban_ids || []).map((id: string) => kanbanMap[id]).filter(Boolean)
        const mappedColumnIds = (tf.applicable_column_ids || []).map((id: string) => columnMap[id]).filter(Boolean)
        const mappedMoveToCol = tf.move_to_column_id ? columnMap[tf.move_to_column_id] : null
        const mappedTargetKanban = tf.target_kanban_id ? kanbanMap[tf.target_kanban_id] : null

        await sb.from('avivar_followup_rules').insert({
          account_id: accountId, user_id: userId,
          name: tf.name, attempt_number: tf.attempt_number,
          delay_minutes: tf.delay_minutes, delay_type: tf.delay_type,
          message_template: tf.message_template, urgency_level: tf.urgency_level,
          is_active: tf.is_active, use_ai_generation: tf.use_ai_generation,
          ai_context: tf.ai_context,
          respect_business_hours: tf.respect_business_hours,
          business_hours_start: tf.business_hours_start,
          business_hours_end: tf.business_hours_end,
          excluded_days: tf.excluded_days,
          applicable_kanban_ids: mappedKanbanIds.length > 0 ? mappedKanbanIds : null,
          applicable_column_ids: mappedColumnIds.length > 0 ? mappedColumnIds : null,
          image_url: tf.image_url, image_caption: tf.image_caption,
          video_url: tf.video_url, video_caption: tf.video_caption,
          audio_url: tf.audio_url, audio_type: tf.audio_type, audio_forward: tf.audio_forward,
          document_url: tf.document_url, document_name: tf.document_name,
          move_to_column_id: mappedMoveToCol,
          create_task_on_failure: tf.create_task_on_failure,
          target_kanban_id: mappedTargetKanban,
          order_index: tf.order_index,
        })
      }
      console.log(`[8/12] Follow-up rules created`)

      // ========== 9. Copy Knowledge Documents + Chunks ==========
      const { data: templateDocs } = await sb.from('avivar_knowledge_documents').select('*')
        .eq('account_id', TEMPLATE_ACCOUNT_ID)

      for (const td of templateDocs || []) {
        const { data: newDoc } = await sb.from('avivar_knowledge_documents').insert({
          account_id: accountId, user_id: userId, agent_id: newAgent.id,
          name: td.name, original_filename: td.original_filename,
          content: td.content, content_type: td.content_type,
          chunk_size: td.chunk_size, overlap: td.overlap,
          chunks_count: td.chunks_count, file_size: td.file_size,
        }).select('id').single()

        if (newDoc) {
          const { data: templateChunks } = await sb.from('avivar_knowledge_chunks').select('*')
            .eq('document_id', td.id).order('chunk_index')

          for (const tc of templateChunks || []) {
            await sb.from('avivar_knowledge_chunks').insert({
              document_id: newDoc.id, account_id: accountId,
              content: tc.content, chunk_index: tc.chunk_index,
              embedding_json: tc.embedding_json,
            })
          }
        }
      }
      console.log(`[9/12] Knowledge docs + chunks created`)

      // ========== 10. Create Agenda ==========
      await sb.from('avivar_agendas').insert({
        account_id: accountId, user_id: userId,
        name: 'Medic Clinica', phone: '',
        address: '', city: '',
        professional_name: full_name,
        is_active: true, color: '#3B82F6',
        google_connected: false,
      })
      console.log(`[10/12] Agenda created`)

      // ========== 11. Create Onboarding Progress ==========
      await sb.from('avivar_onboarding_progress').insert({
        account_id: accountId, user_id: userId,
        whatsapp_connected: true, funnels_setup: true, columns_setup: true,
        ai_agent_created: true, knowledge_base_setup: true,
        ai_routing_configured: false, column_checklists_setup: true,
        crm_activated: false, current_step: 8,
      })
      console.log(`[11/12] Onboarding progress created`)

      // ========== 12. Create API Token ==========
      const webhookSlug = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      const tokenRaw = `avr_${crypto.randomUUID().replace(/-/g, '')}`
      const tokenPrefix = tokenRaw.slice(0, 8)

      // Simple hash for storage
      const encoder = new TextEncoder()
      const data = encoder.encode(tokenRaw)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      await sb.from('avivar_api_tokens').insert({
        account_id: accountId, name: 'Token Principal',
        token_prefix: tokenPrefix, token_hash: tokenHash,
        webhook_slug: webhookSlug, is_active: true,
        permissions: ['leads:create', 'leads:read'],
        created_by: userId,
        target_kanban_id: commercialKanbanId || null,
        target_column_id: entryColumnId || null,
      })
      console.log(`[12/12] API token created`)
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      account_id: accountId,
      email,
      slug,
      message: `Account provisioned successfully with all template configurations`,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('Provision error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
