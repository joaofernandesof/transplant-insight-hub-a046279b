import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account_id, user_id } = await req.json();
    if (!account_id || !user_id) {
      return new Response(JSON.stringify({ error: 'account_id e user_id obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Fireflies API key from account settings
    const { data: settingData } = await supabase
      .from('avivar_account_settings')
      .select('setting_value')
      .eq('account_id', account_id)
      .eq('setting_key', 'fireflies_api_key')
      .maybeSingle();

    if (!settingData?.setting_value) {
      return new Response(JSON.stringify({ error: 'API Key do Fireflies não configurada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = typeof settingData.setting_value === 'string' 
      ? settingData.setting_value 
      : (settingData.setting_value as any)?.key;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch all transcripts from Fireflies
    const listQuery = `
      query {
        transcripts {
          id
          title
          date
          duration
          participants
          organizer_email
          fireflies_users {
            name
            email
          }
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
    `;

    const ffResponse = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: listQuery }),
    });

    if (!ffResponse.ok) {
      const text = await ffResponse.text();
      return new Response(JSON.stringify({ error: `Fireflies error: ${ffResponse.status} ${text}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ffData = await ffResponse.json();
    if (ffData.errors) {
      return new Response(JSON.stringify({ error: ffData.errors[0]?.message || 'Fireflies API error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allTranscripts = ffData.data?.transcripts || [];
    const filteredTranscripts = allTranscripts.filter((t: any) => t.title?.startsWith('Reunião com'));

    console.log(`[Fireflies Sync] Found ${filteredTranscripts.length} matching transcripts out of ${allTranscripts.length} total`);

    // 3. Get already imported external_ids
    const { data: existingCalls } = await supabase
      .from('sales_calls')
      .select('external_id')
      .eq('account_id', account_id)
      .not('external_id', 'is', null);

    const existingIds = new Set((existingCalls || []).map((c: any) => c.external_id));

    // 4. Import new ones
    let imported = 0;
    let skipped = 0;
    const importedCallIds: string[] = [];

    for (const transcript of filteredTranscripts) {
      const externalId = `fireflies_${transcript.id}`;
      
      if (existingIds.has(externalId)) {
        skipped++;
        continue;
      }

      // Build full transcript text from sentences
      const sentences = transcript.sentences || [];
      let fullTranscript = '';
      if (sentences.length > 0) {
        fullTranscript = sentences.map((s: any) => `${s.speaker_name}: ${s.text}`).join('\n');
      }

      // Build a rich resumo from the summary
      const summary = transcript.summary || {};
      let resumo = '';
      if (summary.overview) resumo += `## Resumo\n${summary.overview}\n\n`;
      if (summary.shorthand_bullet) resumo += `## Destaques\n${summary.shorthand_bullet}\n\n`;
      if (summary.action_items) resumo += `## Action Items\n${summary.action_items}\n\n`;
      if (summary.keywords?.length) resumo += `## Keywords\n${summary.keywords.join(', ')}\n`;

      // Extract lead name from title "Reunião com ..."
      const leadName = transcript.title.replace('Reunião com ', '').trim();
      
      // Parse date
      const callDate = transcript.date ? new Date(transcript.date).toISOString() : new Date().toISOString();

      // Determine closer name from participants/sentences
      const speakerNames = [...new Set(sentences.map((s: any) => s.speaker_name).filter(Boolean))];
      // The first non-lead speaker is likely the closer
      const closerName = speakerNames.find((name: string) => !leadName.toLowerCase().includes(name.toLowerCase().split(' ')[0])) || speakerNames[0] || 'Closer';

      const { data: insertedCall, error: insertError } = await supabase.from('sales_calls').insert({
        account_id,
        closer_id: user_id,
        closer_name: closerName,
        lead_nome: leadName,
        produto: null,
        data_call: callDate,
        status_call: 'followup',
        transcricao: fullTranscript || null,
        resumo_manual: resumo || null,
        fonte_call: 'fireflies',
        has_analysis: false,
        external_id: externalId,
      }).select('id').single();

      if (insertError) {
        console.error(`[Fireflies Sync] Error importing ${transcript.title}:`, insertError);
        continue;
      }

      imported++;
      importedCallIds.push(insertedCall.id);
      console.log(`[Fireflies Sync] Imported: ${transcript.title} -> ${insertedCall.id}`);
    }

    // 5. Auto-analyze imported calls (in background, don't block response)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (LOVABLE_API_KEY && importedCallIds.length > 0) {
      // Trigger analysis for each imported call via the existing edge function
      const analyzePromises = importedCallIds.map(async (callId) => {
        try {
          const { data: call } = await supabase
            .from('sales_calls')
            .select('*')
            .eq('id', callId)
            .single();

          if (!call) return;

          const content = call.transcricao || call.resumo_manual;
          if (!content || content.trim().length < 30) return;

          const analyzeUrl = `${supabaseUrl}/functions/v1/neoteam-analyze-call`;
          const resp = await fetch(analyzeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              transcript: content,
              closer_name: call.closer_name,
              lead_nome: call.lead_nome,
              produto: call.produto,
              data_call: call.data_call,
              status_call: call.status_call,
              call_id: callId,
              account_id,
            }),
          });

          if (resp.ok) {
            console.log(`[Fireflies Sync] Analysis completed for call ${callId}`);
          } else {
            console.error(`[Fireflies Sync] Analysis failed for call ${callId}: ${resp.status}`);
          }
        } catch (err) {
          console.error(`[Fireflies Sync] Analysis error for ${callId}:`, err);
        }
      });

      // Run analyses concurrently but limit to 3 at a time
      for (let i = 0; i < analyzePromises.length; i += 3) {
        await Promise.all(analyzePromises.slice(i, i + 3));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported,
      skipped,
      total_matching: filteredTranscripts.length,
      analyzed: importedCallIds.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Fireflies Sync] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
