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
    const { account_id, user_id, transcript_ids } = await req.json();
    if (!account_id || !user_id || !transcript_ids?.length) {
      return new Response(JSON.stringify({ error: 'account_id, user_id e transcript_ids obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Fireflies API key
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

    // Get already imported
    const { data: existingCalls } = await supabase
      .from('sales_calls')
      .select('external_id')
      .eq('account_id', account_id)
      .not('external_id', 'is', null);

    const existingIds = new Set((existingCalls || []).map((c: any) => c.external_id));

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const importedCallIds: string[] = [];

    for (const transcriptId of transcript_ids) {
      const externalId = `fireflies_${transcriptId}`;

      if (existingIds.has(externalId)) {
        skipped++;
        continue;
      }

      try {
        // Fetch full transcript detail
        const detailQuery = `
          query {
            transcript(id: "${transcriptId}") {
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
        `;

        const ffResponse = await fetch('https://api.fireflies.ai/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ query: detailQuery }),
        });

        if (!ffResponse.ok) {
          const errBody = await ffResponse.text();
          console.error(`Fireflies API error for ${transcriptId}:`, ffResponse.status, errBody);
          errors++;
          errorDetails.push(`Transcript ${transcriptId}: Fireflies API ${ffResponse.status} - ${errBody.slice(0, 200)}`);
          continue;
        }

        const ffData = await ffResponse.json();
        if (ffData.errors) {
          errors++;
          errorDetails.push(`Transcript ${transcriptId}: ${ffData.errors[0]?.message}`);
          continue;
        }

        const transcript = ffData.data?.transcript;
        if (!transcript) {
          errors++;
          errorDetails.push(`Transcript ${transcriptId}: não encontrado`);
          continue;
        }

        // Build transcript text
        const sentences = transcript.sentences || [];
        const fullTranscript = sentences.length > 0
          ? sentences.map((s: any) => `${s.speaker_name}: ${s.text}`).join('\n')
          : '';

        // Build resumo
        const summary = transcript.summary || {};
        let resumo = '';
        if (summary.overview) resumo += `## Resumo\n${summary.overview}\n\n`;
        if (summary.shorthand_bullet) resumo += `## Destaques\n${summary.shorthand_bullet}\n\n`;
        if (summary.action_items) resumo += `## Action Items\n${summary.action_items}\n\n`;
        if (summary.keywords?.length) resumo += `## Keywords\n${summary.keywords.join(', ')}\n`;

        const leadName = (transcript.title || 'Sem título').replace('Reunião com ', '').trim();
        const callDate = transcript.date ? new Date(transcript.date).toISOString() : new Date().toISOString();

        // Determine closer
        const speakerNames = [...new Set(sentences.map((s: any) => s.speaker_name).filter(Boolean))];
        const closerName = speakerNames.find((name: string) =>
          !leadName.toLowerCase().includes(name.toLowerCase().split(' ')[0])
        ) || speakerNames[0] || 'Closer';

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
          fireflies_url: `https://app.fireflies.ai/view/${transcript.id}`,
        }).select('id').single();

        if (insertError) {
          errors++;
          errorDetails.push(`${leadName}: ${insertError.message}`);
          continue;
        }

        imported++;
        importedCallIds.push(insertedCall.id);
      } catch (err) {
        errors++;
        errorDetails.push(`Transcript ${transcriptId}: ${err.message}`);
      }
    }

    // Auto-analyze imported calls
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let analyzed = 0;

    if (LOVABLE_API_KEY && importedCallIds.length > 0) {
      for (let i = 0; i < importedCallIds.length; i += 3) {
        const batch = importedCallIds.slice(i, i + 3);
        await Promise.all(batch.map(async (callId) => {
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

            if (resp.ok) analyzed++;
          } catch (err) {
            console.error(`Analysis error for ${callId}:`, err);
          }
        }));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported,
      skipped,
      errors,
      error_details: errorDetails,
      analyzed,
      total_requested: transcript_ids.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Fireflies Import Selected] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
