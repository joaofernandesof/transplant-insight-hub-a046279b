/**
 * NeoHairScan - AI Hair Analysis Edge Function
 * Uses Lovable AI image generation for:
 * 1. Baldness progression simulation
 * 2. Scalp density scan (negative/X-ray view)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, imageBase64, yearsProgression } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    let prompt: string;
    
    if (action === "progression") {
      // Simulate baldness progression
      prompt = `Edit this photo to simulate hair loss progression after ${yearsProgression} years. 
Show realistic male/female pattern baldness advancement:
- Receding hairline
- Thinning at the crown
- Wider parting
- Less overall density
Keep the face identical, only modify the hair realistically.
The progression should be proportional to ${yearsProgression} years of untreated hair loss.`;
    } else if (action === "scan") {
      // Generate density scan view
      prompt = `Transform this scalp/head photo into a medical scan visualization:
- Apply a cyan/teal color filter like medical imaging
- Highlight hair density zones with heat-map style coloring
- Areas with less hair density should appear darker/warmer (red/orange tones)
- Areas with good hair density should appear lighter/cooler (green/blue tones)
- Add subtle grid lines for medical reference
- Make it look like a professional trichoscopy or scalp scan
- Keep facial features visible but muted
The result should help doctors identify areas of alopecia and density variations.`;
    } else {
      throw new Error("Invalid action. Use 'progression' or 'scan'");
    }

    console.log(`Processing ${action} analysis...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`Erro no gateway AI: ${response.status}`);
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!generatedImage) {
      throw new Error("Não foi possível gerar a imagem");
    }

    return new Response(
      JSON.stringify({ 
        image: generatedImage,
        message: textResponse,
        action 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Hair scan analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
