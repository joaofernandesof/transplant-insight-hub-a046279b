import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const _logStart = Date.now();
  let _logStatus = "success";
  let _logError = "";
  let _logTokensIn = 0;
  let _logTokensOut = 0;

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

    console.log(`Starting face search with ${photoUrls.length} photos`);

    // Process all photos in parallel batches for speed
    const BATCH_SIZE = 20; // Increased batch size
    const matchingPhotoIds: string[] = [];
    
    for (let i = 0; i < photoUrls.length; i += BATCH_SIZE) {
      const batch = photoUrls.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(photoUrls.length/BATCH_SIZE)}`);
      
      const batchPromises = batch.map(async (photo: { id: string; url: string }) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per request
          
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite", // Fastest model
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Compare faces. Return ONLY JSON: {"match":true} if SAME person appears in both images, {"match":false} otherwise. Be generous - if uncertain but similar, say true.`
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
              max_tokens: 30
            }),
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(`AI error for photo ${photo.id}:`, response.status);
            return null;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          
          // Extract JSON from response
          if (content.includes('"match":true') || content.includes('"match": true') || content.toLowerCase().includes('true')) {
            console.log(`Match found: ${photo.id}`);
            return { id: photo.id };
          }
          return null;
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.error(`Timeout for photo ${photo.id}`);
          } else {
            console.error(`Error processing photo ${photo.id}:`, error);
          }
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

    console.log(`Face search complete: ${matchingPhotoIds.length} matches out of ${photoUrls.length} photos`);

    return new Response(
      JSON.stringify({ 
        matchingPhotoIds,
        totalProcessed: photoUrls.length,
        matchCount: matchingPhotoIds.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    _logStatus = "error";
    _logError = error instanceof Error ? error.message : "Unknown error";
    console.error("face-search error:", error);
    return new Response(
      JSON.stringify({ error: _logError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const _estCost = (_logTokensIn / 1e6) * 0.02 + (_logTokensOut / 1e6) * 0.05;
      const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      _sb.from("edge_function_logs").insert({ function_name: "face-search", execution_time_ms: Date.now() - _logStart, status: _logStatus, tokens_input: _logTokensIn, tokens_output: _logTokensOut, model_used: "google/gemini-2.5-flash-lite", estimated_cost_usd: _estCost, error_message: _logError || null }).then(() => {});
    } catch {}
  }
});
