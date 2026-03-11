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

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch ALL transcripts from Fireflies (no filter)
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

    // Check which are already imported
    const { data: existingCalls } = await supabase
      .from('sales_calls')
      .select('external_id')
      .eq('account_id', account_id)
      .not('external_id', 'is', null);

    const existingIds = new Set((existingCalls || []).map((c: any) => c.external_id));

    // Map transcripts with import status
    const transcripts = allTranscripts.map((t: any) => ({
      id: t.id,
      title: t.title || 'Sem título',
      date: t.date,
      duration: t.duration,
      participants: t.participants || [],
      organizer_email: t.organizer_email,
      users: t.fireflies_users || [],
      already_imported: existingIds.has(`fireflies_${t.id}`),
    }));

    // Sort by date desc
    transcripts.sort((a: any, b: any) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    return new Response(JSON.stringify({ success: true, transcripts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Fireflies List] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
