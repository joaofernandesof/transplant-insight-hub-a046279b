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
    const { account_id } = await req.json();
    if (!account_id) {
      return new Response(JSON.stringify({ error: 'account_id obrigatório' }), {
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

    // Get calls with null duration
    const { data: calls, error: fetchError } = await supabase
      .from('sales_calls')
      .select('id, external_id')
      .eq('account_id', account_id)
      .eq('fonte_call', 'fireflies')
      .is('duration_minutes', null)
      .not('external_id', 'is', null);

    if (fetchError) throw fetchError;
    if (!calls || calls.length === 0) {
      return new Response(JSON.stringify({ success: true, updated: 0, message: 'Nenhuma call sem duração encontrada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updated = 0;
    let errors = 0;

    for (const call of calls) {
      const transcriptId = call.external_id!.replace('fireflies_', '');
      try {
        const query = `query { transcript(id: "${transcriptId}") { id duration } }`;
        const resp = await fetch('https://api.fireflies.ai/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ query }),
        });

        if (!resp.ok) { errors++; continue; }
        const result = await resp.json();
        const duration = result.data?.transcript?.duration;

        if (duration && duration > 0) {
          const { error: upErr } = await supabase
            .from('sales_calls')
            .update({ duration_minutes: Math.round(duration / 60) })
            .eq('id', call.id);
          if (!upErr) updated++;
          else errors++;
        }
      } catch {
        errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, total: calls.length, updated, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[fireflies-backfill-duration] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
