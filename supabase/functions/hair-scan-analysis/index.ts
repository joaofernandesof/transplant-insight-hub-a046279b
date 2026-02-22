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

type GatewayResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      images?: any[];
    };
  }>;
};

function extractFirstImageUrl(data: any): string | undefined {
  const images = data?.choices?.[0]?.message?.images;
  let generatedImage = images?.[0]?.image_url?.url;

  if (!generatedImage && typeof images?.[0]?.image_url === "string") {
    generatedImage = images[0].image_url;
  }

  if (!generatedImage && images?.[0]?.url) {
    generatedImage = images[0].url;
  }

  if (!generatedImage && images?.[0]?.data) {
    generatedImage = `data:image/png;base64,${images[0].data}`;
  }

  // Last resort: sometimes models embed a data URL in text
  const text = data?.choices?.[0]?.message?.content;
  if (!generatedImage && typeof text === "string") {
    const match = text.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/);
    if (match?.[0]) generatedImage = match[0];
  }

  return generatedImage;
}

async function callImageModel({
  lovableApiKey,
  prompt,
  imageBase64,
  model,
  forceImageOnly,
}: {
  lovableApiKey: string;
  prompt: string;
  imageBase64: string;
  model: string;
  forceImageOnly: boolean;
}) {
  const body: any = {
    model,
    messages: [
      ...(forceImageOnly
        ? [{ role: "system", content: "Return exactly ONE edited image. Do not output any text." }]
        : []),
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ],
    // For newversion we prefer to force image output.
    modalities: forceImageOnly ? ["image"] : ["image", "text"],
    temperature: forceImageOnly ? 0.2 : 0.7,
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const _logStart = Date.now();
  let _logStatus = "success";
  let _logError = "";
  let _logModel = "";

  try {
    const { action, imageBase64, yearsProgression } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    let prompt: string;
    let selectedStyleForNewversion: string | undefined;
    
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
    } else if (action === "newversion") {
      // 🎯 Generate ultra-realistic post-transplant hairstyle variations
      // Emotional context: Help men post-transplant visualize cuts that respect their current aesthetics,
      // hair density and maturity. Avoid plastic exaggeration. Realistic, confident, natural aesthetics.
      
      const hairstyleVariations = [
        "short buzz cut with clean edges, military style, very short on sides, mature professional look",
        "medium length textured crop with natural volume on top, slightly messy everyday look",
        "classic side part with neatly combed sides, elegant businessman style, clean and refined",
        "longer wavy hair with natural flow and soft movement, relaxed casual style",
        "modern pompadour with subtle volume, styled gently upward and back, not exaggerated",
        "caesar cut with straight natural bangs, short and neat all around, timeless style",
        "layered medium length with soft swept fringe, balanced and thoughtful look",
        "natural wavy texture with soft defined waves, medium volume, effortless style",
        "undercut with longer textured top, contemporary asymmetric look, subtle contrast",
        "classic taper fade with lightly textured top, clean and professional finish",
        "longer slicked back hair with natural shine (not wet look), reaching collar, distinguished",
        "short textured style with soft volume, modern everyday look, low maintenance",
        "quiff hairstyle with gentle height at front, subtle lift, not rockabilly extreme",
        "french crop with soft textured fringe, contemporary European style, refined edges",
        "medium length with natural center part, soft layers framing face, balanced style",
        "tight fade with natural dense top, respecting natural curl pattern if present"
      ];
      
      const randomIndex = Math.floor(Math.random() * hairstyleVariations.length);
      const selectedStyle = hairstyleVariations[randomIndex];
      selectedStyleForNewversion = selectedStyle;
      
      prompt = `🎯 CRITICAL: Generate an ULTRA-REALISTIC post-transplant hair simulation showing FULL HAIR COVERAGE. This is for men recovering their confidence after hair restoration.

⚠️ ABSOLUTE REQUIREMENT - NO BALDNESS:
- The result MUST show a FULL HEAD OF HAIR with COMPLETE COVERAGE
- NO visible scalp, NO thinning, NO receding hairline, NO bald spots
- The person must look like they have NEVER experienced hair loss
- Hair must be DENSE and THICK across the entire head
- Hairline must be FULL and NATURAL (no recession at temples)

STYLE TO APPLY: "${selectedStyle}"

📋 STRICT REQUIREMENTS:
1. FULL HAIR COVERAGE: Dense, thick hair covering entire scalp - absolutely NO visible baldness or thinning
2. FACE PRESERVATION: Keep face, skin texture, eyes, nose, mouth, ears, beard, clothing, and background EXACTLY identical - zero facial morphing or smoothing
3. NATURAL HAIRLINE: Create a full, natural hairline with NO recession - appropriate for a person with healthy hair
4. HAIR DENSITY: Show full, dense hair coverage - this is a POST-TRANSPLANT result showing the BEST possible outcome
5. TEXTURE & DIRECTION: Natural hair texture (2A/2B wave pattern as default), realistic growth direction
6. COLOR MATCHING: Match hair color exactly to any existing hair on the person
7. LIGHTING: Maintain exact same lighting and shadows as original photo
8. NO ARTIFICIAL LOOK: No plastic shine, no cartoon textures, no overly perfect styling

🧠 EMOTIONAL DIRECTION:
- Show what the person would look like with a FULL head of hair
- The result should boost confidence and show realistic best-case results
- Hair should look NATURAL as if they always had full coverage

🎨 OUTPUT QUALITY: 
- Photorealistic quality with preserved skin texture
- Clean facial capture without beautification filters
- The result must be indistinguishable from a real photo`;
    } else {
      throw new Error("Invalid action. Use 'progression', 'scan' or 'newversion'");
    }

    console.log(`Processing ${action} analysis...`);
    console.log("Image base64 length:", imageBase64?.length || 0);

    // Some model runs return only text (no images). For newversion we force image-only output and do 1 retry.
    const forceImageOnly = action === "newversion";
    const model = action === "newversion" ? "google/gemini-3-pro-image-preview" : "google/gemini-2.5-flash-image";
    _logModel = model;

    let response = await callImageModel({
      lovableApiKey: LOVABLE_API_KEY,
      prompt,
      imageBase64,
      model,
      forceImageOnly,
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
    
    // Debug: log minimal structure for troubleshooting
    const images = data.choices?.[0]?.message?.images;
    console.log(
      "AI response structure:",
      JSON.stringify({
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        hasImages: !!images,
        imagesLength: images?.length,
        firstImageType: images?.[0]?.type,
        hasImageUrl: !!images?.[0]?.image_url,
        hasUrl: !!images?.[0]?.image_url?.url,
        content: data.choices?.[0]?.message?.content?.substring(0, 200),
      })
    );

    let generatedImage = extractFirstImageUrl(data);
    let textResponse = data.choices?.[0]?.message?.content || "";

    // If the model returned text-only, retry once with a shorter, stricter prompt.
    if (!generatedImage && action === "newversion") {
      console.warn("No image generated (text-only). Retrying once with stricter prompt...");
      const compactPrompt = `Edit ONLY the hair in this photo. CRITICAL: Show FULL HEAD OF HAIR with COMPLETE COVERAGE - NO baldness, NO thinning, NO visible scalp. Apply hairstyle: ${selectedStyleForNewversion || "natural dense masculine style"}. The person must look like they have NEVER had hair loss. Keep face and background IDENTICAL. Ultra-realistic, natural dense hair. Return ONE edited image only.`;

      const retryResp = await callImageModel({
        lovableApiKey: LOVABLE_API_KEY,
        prompt: compactPrompt,
        imageBase64,
        model,
        forceImageOnly: true,
      });

      if (!retryResp.ok) {
        const retryText = await retryResp.text();
        console.error("AI gateway retry error:", retryResp.status, retryText);
        // Fall through to standard error handling below
      } else {
        const retryData: GatewayResponse = await retryResp.json();
        generatedImage = extractFirstImageUrl(retryData);
        textResponse = retryData.choices?.[0]?.message?.content || textResponse;
      }
    }

    if (!generatedImage) {
      console.error("No image generated. Full response structure:", JSON.stringify({
        choices: data.choices?.map((c: any) => ({
          message: {
            role: c.message?.role,
            contentLength: c.message?.content?.length,
            images: c.message?.images?.map((img: any) => ({
              type: img?.type,
              keys: Object.keys(img || {}),
              imageUrlType: typeof img?.image_url,
              imageUrlKeys: img?.image_url ? Object.keys(img.image_url) : null
            }))
          }
        }))
      }));
      throw new Error("A IA não conseguiu gerar a imagem. Tente com outra foto ou área diferente.");
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
    _logStatus = "error";
    _logError = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Hair scan analysis error:", error);
    return new Response(
      JSON.stringify({ error: _logError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      _sb.from("edge_function_logs").insert({ function_name: "hair-scan-analysis", execution_time_ms: Date.now() - _logStart, status: _logStatus, model_used: _logModel || null, estimated_cost_usd: 0, error_message: _logError || null }).then(() => {});
    } catch {}
  }
});
