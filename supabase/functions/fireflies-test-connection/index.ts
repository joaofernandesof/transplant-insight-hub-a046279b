import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_key } = await req.json();
    if (!api_key) {
      return new Response(JSON.stringify({ success: false, error: 'API Key não fornecida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query Fireflies GraphQL API to test connection and count matching transcripts
    const query = `
      query {
        transcripts {
          id
          title
          date
        }
      }
    `;

    const response = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ success: false, error: `Fireflies retornou ${response.status}: ${text}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    if (data.errors) {
      return new Response(JSON.stringify({ success: false, error: data.errors[0]?.message || 'Erro na API' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcripts = data.data?.transcripts || [];
    const filtered = transcripts.filter((t: any) => t.title?.startsWith('Reunião com'));

    return new Response(JSON.stringify({
      success: true,
      total_transcripts: transcripts.length,
      transcripts_count: filtered.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
