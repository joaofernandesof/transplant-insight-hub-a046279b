import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CONTA_AZUL_BASE = 'https://api-v2.contaazul.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const CONTA_AZUL_ACCESS_TOKEN = Deno.env.get('CONTA_AZUL_ACCESS_TOKEN');
  if (!CONTA_AZUL_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: 'CONTA_AZUL_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { endpoint, params } = await req.json();

    const allowedEndpoints: Record<string, string> = {
      'categorias': '/categorias',
      'centro-de-custo': '/centro-de-custo',
      'conta-financeira': '/conta-financeira',
    };

    const path = allowedEndpoints[endpoint];
    if (!path) {
      return new Response(JSON.stringify({ error: `Endpoint '${endpoint}' not allowed` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queryParams = new URLSearchParams({
      tamanho_pagina: '500',
      ...(endpoint === 'categorias' ? { permite_apenas_filhos: 'true', tipo: 'DESPESA' } : {}),
      ...(endpoint === 'centro-de-custo' ? { filtro_rapido: 'ATIVO' } : {}),
      ...(endpoint === 'conta-financeira' ? { mostrar_caixinha: 'false' } : {}),
      ...params,
    });

    const url = `${CONTA_AZUL_BASE}${path}?${queryParams.toString()}`;
    console.log(`Fetching Conta Azul: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONTA_AZUL_ACCESS_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Conta Azul error [${response.status}]:`, JSON.stringify(data));
      return new Response(JSON.stringify({ error: `Conta Azul API error`, status: response.status, details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in conta-azul-proxy:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
