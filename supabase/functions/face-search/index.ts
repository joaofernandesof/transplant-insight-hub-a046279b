import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selfieBase64, photoUrls } = await req.json();

    if (!selfieBase64 || !photoUrls || !Array.isArray(photoUrls)) {
      return new Response(
        JSON.stringify({ error: "selfieBase64 and photoUrls array are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Process photos in batches to avoid timeout
    const BATCH_SIZE = 10;
    const matchingPhotoIds: string[] = [];
    
    for (let i = 0; i < photoUrls.length; i += BATCH_SIZE) {
      const batch = photoUrls.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (photo: { id: string; url: string }) => {
        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `You are a face matching assistant. Compare the face in the SELFIE image with all visible faces in the GALLERY image.

IMPORTANT: Return ONLY a valid JSON object, no additional text.

If the same person from the selfie appears in the gallery photo (same face/person), respond with:
{"match": true, "confidence": "high"|"medium"|"low"}

If the person from the selfie does NOT appear in the gallery photo, respond with:
{"match": false}

Consider variations in lighting, angle, expression, but focus on facial features. Be generous with matches if there's reasonable similarity.`
                    },
                    {
                      type: "image_url",
                      image_url: { url: selfieBase64 }
                    },
                    {
                      type: "image_url",
                      image_url: { url: photo.url }
                    }
                  ]
                }
              ],
              max_tokens: 100
            }),
          });

          if (!response.ok) {
            console.error(`AI error for photo ${photo.id}:`, response.status);
            return null;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const result = JSON.parse(jsonMatch[0]);
              if (result.match === true) {
                return { id: photo.id, confidence: result.confidence || "medium" };
              }
            } catch (e) {
              console.error("Failed to parse AI response:", content);
            }
          }
          return null;
        } catch (error) {
          console.error(`Error processing photo ${photo.id}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result) {
          matchingPhotoIds.push(result.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        matchingPhotoIds,
        totalProcessed: photoUrls.length,
        matchCount: matchingPhotoIds.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("face-search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
