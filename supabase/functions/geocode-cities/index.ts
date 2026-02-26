import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function geocodeCity(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = `${city}, ${state}, Brazil`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
    const res = await fetch(url, {
      headers: { "User-Agent": "NeoFolic-HotLeads/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Rate-limit friendly delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const target = body.target || "both"; // "leads", "users", or "both"
    const limit = body.limit || 50; // Process in batches

    let geocoded = 0;
    let failed = 0;

    // Geocode leads without coordinates
    if (target === "leads" || target === "both") {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, city, state")
        .is("latitude", null)
        .not("city", "is", null)
        .not("state", "is", null)
        .in("source", ["planilha", "n8n"])
        .limit(limit);

      for (const lead of leads || []) {
        const coords = await geocodeCity(lead.city, lead.state);
        if (coords) {
          await supabase
            .from("leads")
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq("id", lead.id);
          geocoded++;
        } else {
          failed++;
        }
        await delay(1100); // Nominatim rate limit: 1 req/sec
      }
    }

    // Geocode users without coordinates
    if (target === "users" || target === "both") {
      const { data: users } = await supabase
        .from("neohub_users")
        .select("id, address_city, address_state")
        .is("latitude", null)
        .not("address_city", "is", null)
        .not("address_state", "is", null)
        .limit(limit);

      for (const user of users || []) {
        const coords = await geocodeCity(user.address_city, user.address_state);
        if (coords) {
          await supabase
            .from("neohub_users")
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq("id", user.id);
          geocoded++;
        } else {
          failed++;
        }
        await delay(1100);
      }
    }

    return new Response(
      JSON.stringify({ success: true, geocoded, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
