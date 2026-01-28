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
      
      prompt = `🎯 CRITICAL: Generate an ULTRA-REALISTIC post-transplant hair simulation. This is for men recovering their confidence after hair restoration.

STYLE TO APPLY: "${selectedStyle}"

📋 STRICT REQUIREMENTS:
1. FACE PRESERVATION: Keep face, skin texture, eyes, nose, mouth, ears, beard, clothing, and background EXACTLY identical - zero facial morphing or smoothing
2. REALISTIC HAIRLINE: Create a natural hairline appropriate for the person's age and face shape - NO artificial plastic look, NO perfect symmetry
3. HAIR DENSITY: Match density to realistic post-transplant results - full but natural, not unnaturally thick
4. TEXTURE & DIRECTION: Respect natural hair growth direction, use subtle texture (2A/2B wave pattern as default if unclear) - NO glossy/shiny artificial look
5. COLOR MATCHING: Match hair color exactly to any existing hair - NO color changes
6. LIGHTING: Use cinematic soft-light style, maintain exact same lighting and shadows as original photo
7. SCALP BLENDING: Blend naturally with scalp and forehead - use subtle shadows and depth to anchor the hairstyle naturally
8. NO CARTOON TEXTURES: Avoid overly defined strands, plastic shine, or artificial highlights

🧠 EMOTIONAL DIRECTION:
- This person is recovering confidence after hair loss
- Style should look NATURAL as if they always had this hair
- Professional styles = calm, confident, reliable appearance
- Casual styles = balanced, thoughtful, subtly stylish

🎨 OUTPUT QUALITY: 
- Photorealistic quality with preserved skin texture
- Clean facial capture without beautification filters
- The result must be indistinguishable from a real photo`;
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
    
    // Debug: log the full structure of images array
    const images = data.choices?.[0]?.message?.images;
    console.log("AI response structure:", JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasImages: !!images,
      imagesLength: images?.length,
      firstImageKeys: images?.[0] ? Object.keys(images[0]) : null,
      firstImageType: images?.[0]?.type,
      hasImageUrl: !!images?.[0]?.image_url,
      hasUrl: !!images?.[0]?.image_url?.url,
      urlPrefix: images?.[0]?.image_url?.url?.substring(0, 50),
      content: data.choices?.[0]?.message?.content?.substring(0, 200)
    }));

    // Try multiple extraction paths for the image
    let generatedImage = images?.[0]?.image_url?.url;
    
    // Fallback: check if image_url is directly the URL string
    if (!generatedImage && typeof images?.[0]?.image_url === 'string') {
      generatedImage = images[0].image_url;
    }
    
    // Fallback: check if there's a url property directly on the image object
    if (!generatedImage && images?.[0]?.url) {
      generatedImage = images[0].url;
    }
    
    // Fallback: check for data property
    if (!generatedImage && images?.[0]?.data) {
      generatedImage = `data:image/png;base64,${images[0].data}`;
    }
    
    const textResponse = data.choices?.[0]?.message?.content || "";

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
    console.error("Hair scan analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
