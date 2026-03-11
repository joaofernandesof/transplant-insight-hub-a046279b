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
    const { api_key, title_filter } = await req.json();
    if (!api_key) {
      return new Response(JSON.stringify({ success: false, error: 'API Key não fornecida' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First get list of transcripts
    const listQuery = `
      query {
        transcripts {
          id
          title
          date
          duration
          transcript_url
          participants
          organizer_email
        }
      }
    `;

    const listResponse = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      },
      body: JSON.stringify({ query: listQuery }),
    });

    if (!listResponse.ok) {
      const text = await listResponse.text();
      return new Response(JSON.stringify({ success: false, error: `Fireflies retornou ${listResponse.status}: ${text}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const listData = await listResponse.json();
    if (listData.errors) {
      return new Response(JSON.stringify({ success: false, error: listData.errors[0]?.message || 'Erro na API' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcripts = listData.data?.transcripts || [];
    
    // Find the specific transcript by title
    const target = transcripts.find((t: any) => 
      title_filter ? t.title?.includes(title_filter) : false
    );

    if (!target) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Transcrição não encontrada com título contendo: "${title_filter}"`,
        available_titles: transcripts.slice(0, 10).map((t: any) => t.title),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Now fetch full transcript details
    const detailQuery = `
      query Transcript($id: String!) {
        transcript(id: $id) {
          id
          title
          date
          duration
          transcript_url
          participants
          organizer_email
          sentences {
            speaker_name
            text
            start_time
            end_time
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

    const detailResponse = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      },
      body: JSON.stringify({ query: detailQuery, variables: { id: target.id } }),
    });

    if (!detailResponse.ok) {
      const text = await detailResponse.text();
      return new Response(JSON.stringify({ success: false, error: `Erro ao buscar detalhes: ${detailResponse.status}: ${text}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const detailData = await detailResponse.json();
    if (detailData.errors) {
      return new Response(JSON.stringify({ success: false, error: detailData.errors[0]?.message || 'Erro ao buscar detalhes' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcript = detailData.data?.transcript;

    return new Response(JSON.stringify({
      success: true,
      transcript,
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
