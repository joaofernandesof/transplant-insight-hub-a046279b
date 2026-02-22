import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Avivar Audio Transcription
 * Transcreve áudios de mensagens de voz usando OpenAI Whisper API
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscribeRequest {
  audioUrl: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[Transcribe] Request received at ${new Date().toISOString()}`);

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      console.error("[Transcribe] OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: TranscribeRequest = await req.json();
    const { audioUrl, language = "pt" } = body;

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "audioUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Transcribe] Downloading audio from: ${audioUrl.substring(0, 80)}...`);

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    
    if (!audioResponse.ok) {
      console.error(`[Transcribe] Failed to download audio: ${audioResponse.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to download audio: ${audioResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    
    console.log(`[Transcribe] Audio downloaded: ${audioBytes.length} bytes`);

    // Determine content type and file extension
    const contentType = audioResponse.headers.get("content-type") || "audio/ogg";
    let extension = "ogg";
    
    if (contentType.includes("mp3") || contentType.includes("mpeg")) {
      extension = "mp3";
    } else if (contentType.includes("mp4") || contentType.includes("m4a")) {
      extension = "m4a";
    } else if (contentType.includes("wav")) {
      extension = "wav";
    } else if (contentType.includes("webm")) {
      extension = "webm";
    }

    console.log(`[Transcribe] Content-Type: ${contentType}, Extension: ${extension}`);

    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBytes], { type: contentType });
    formData.append("file", audioBlob, `audio.${extension}`);
    formData.append("model", "whisper-1");
    formData.append("language", language);
    formData.append("response_format", "json");

    console.log(`[Transcribe] Calling OpenAI Whisper API...`);

    // Call OpenAI Whisper API
    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error(`[Transcribe] Whisper API error: ${whisperResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Whisper API error: ${whisperResponse.status}`,
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await whisperResponse.json();
    const transcription = result.text?.trim() || "";
    
    const duration = Date.now() - startTime;
    console.log(`[Transcribe] ✅ Transcription complete in ${duration}ms: "${transcription.substring(0, 100)}..."`);

    // Fire-and-forget: log execution
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const logClient = (await import("https://esm.sh/@supabase/supabase-js@2")).createClient(supabaseUrl, supabaseServiceKey);
    logClient.from("edge_function_logs").insert({
      function_name: "avivar-transcribe-audio",
      execution_time_ms: duration,
      status: "success",
      model_used: "openai/whisper-1",
      estimated_cost_usd: (audioBytes.length / 1024 / 1024) * 0.006, // rough estimate
      metadata: { audioSize: audioBytes.length, language },
    }).then(() => {}).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        transcription,
        language,
        duration,
        audioSize: audioBytes.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Transcribe] Error:", error);

    // Fire-and-forget: log error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const logClient = (await import("https://esm.sh/@supabase/supabase-js@2")).createClient(supabaseUrl, supabaseServiceKey);
      logClient.from("edge_function_logs").insert({
        function_name: "avivar-transcribe-audio",
        execution_time_ms: duration,
        status: "error",
        model_used: "openai/whisper-1",
        error_message: (error as Error).message?.substring(0, 500),
      }).then(() => {}).catch(() => {});
    } catch {}

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
