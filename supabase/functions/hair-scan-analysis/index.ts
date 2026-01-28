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
    } else if (action === "newversion") {
      // Generate 12 VARIED post-transplant hairstyle variations
      // Each call should produce a UNIQUE look
      
      // Array of distinctly different hairstyles to ensure variety
      const hairstyleVariations = [
        "short buzz cut with clean edges, military style, very short on sides",
        "medium length textured crop with volume on top, natural messy look",
        "classic side part with slicked back sides, elegant businessman style",
        "longer wavy hair with natural flow and movement, surfer style",
        "modern pompadour with volume, styled upward and back",
        "caesar cut with straight bangs, short and neat all around",
        "layered medium length with swept fringe, youthful style",
        "curly/wavy texture with defined curls, full volume",
        "undercut with longer top, trendy asymmetric look",
        "classic taper fade with textured top, clean and professional",
        "longer slicked back hair, wet look style, reaching neck",
        "short spiky textured style with volume, edgy modern look",
        "quiff hairstyle with height at front, rockabilly inspired",
        "french crop with textured fringe, contemporary European style",
        "medium length with curtain bangs, parted in middle, K-pop inspired",
        "tight fade with dense curly top, afro-textured style"
      ];
      
      // Pick a random hairstyle to ensure each generation is different
      const randomIndex = Math.floor(Math.random() * hairstyleVariations.length);
      const selectedStyle = hairstyleVariations[randomIndex];
      
      prompt = `CRITICAL INSTRUCTION: Edit ONLY the hair in this photo. The face, skin, eyes, nose, mouth, ears, beard, facial hair, clothing, and background MUST remain EXACTLY identical - do not alter them at all.

Transform this person's hair to show a successful hair transplant result with THIS SPECIFIC HAIRSTYLE:
**${selectedStyle}**

Requirements:
- Add full, dense hair coverage where there is currently thinning or baldness
- The new hair must be styled EXACTLY as described: ${selectedStyle}
- Match the hair color exactly to any existing hair (do not change hair color)
- Create a natural-looking hairline appropriate for the person's age and face shape
- Show realistic hair density and texture for this specific style
- The hair should look ultra photorealistic and professionally styled
- Maintain exact same lighting, shadows, and image quality as original
- This specific style should be clearly distinguishable from other hairstyles

This is a medical simulation of post-transplant results. The person should look like themselves but with a full head of hair in the ${selectedStyle} style.`;
    } else {
      throw new Error("Invalid action. Use 'progression', 'scan' or 'newversion'");
    }

    console.log(`Processing ${action} analysis...`);
    console.log("Image base64 length:", imageBase64?.length || 0);

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
    console.log("AI response structure:", JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasImages: !!data.choices?.[0]?.message?.images,
      imagesLength: data.choices?.[0]?.message?.images?.length,
      content: data.choices?.[0]?.message?.content?.substring(0, 200)
    }));

    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!generatedImage) {
      console.error("No image generated. Full response:", JSON.stringify(data).substring(0, 1000));
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
    console.error("Hair scan analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
