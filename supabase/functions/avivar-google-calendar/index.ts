import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function getGoogleCredentials() {
  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar credentials not configured");
  }
  return { clientId, clientSecret };
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Exchange authorization code for tokens
async function exchangeCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getGoogleCredentials();
  
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token exchange failed:", error);
    throw new Error("Failed to exchange authorization code");
  }

  return await response.json();
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret } = getGoogleCredentials();
  
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token refresh failed:", error);
    throw new Error("Failed to refresh token");
  }

  return await response.json();
}

// Get valid access token (refreshing if needed)
async function getValidAccessToken(supabase: ReturnType<typeof createClient>, agendaId: string): Promise<string> {
  const { data: agenda } = await supabase
    .from("avivar_agendas")
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", agendaId)
    .single();

  if (!agenda?.google_refresh_token) {
    throw new Error("Google Calendar not connected for this agenda");
  }

  const expiresAt = agenda.google_token_expires_at ? new Date(agenda.google_token_expires_at) : null;
  const now = new Date();

  // If token is still valid (with 5-minute buffer), return it
  if (agenda.google_access_token && expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return agenda.google_access_token;
  }

  // Refresh the token
  const tokens = await refreshAccessToken(agenda.google_refresh_token);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from("avivar_agendas")
    .update({
      google_access_token: tokens.access_token,
      google_token_expires_at: newExpiresAt,
    })
    .eq("id", agendaId);

  return tokens.access_token;
}

// List user's calendars
async function listCalendars(accessToken: string) {
  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to list calendars");
  }

  const data = await response.json();
  return (data.items || []).map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    description: cal.description,
    primary: cal.primary || false,
    backgroundColor: cal.backgroundColor,
    accessRole: cal.accessRole,
  }));
}

// Get events from Google Calendar for a date range
async function getEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get events:", error);
    throw new Error("Failed to get Google Calendar events");
  }

  const data = await response.json();
  return (data.items || []).map((event: any) => ({
    id: event.id,
    summary: event.summary,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    status: event.status,
  }));
}

// Create event in Google Calendar
async function createEvent(
  accessToken: string,
  calendarId: string,
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description?: string,
  location?: string
) {
  const event = {
    summary,
    description,
    location,
    start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
    end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
  };

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create event:", error);
    throw new Error("Failed to create Google Calendar event");
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || body.action;
    
    const supabaseAdmin = getSupabaseAdmin();

    switch (action) {
      // Step 1: Get OAuth URL for user to authorize
      case "get_auth_url": {
        const { clientId } = getGoogleCredentials();
        const redirectUri = body.redirect_uri;
        const agendaId = body.agenda_id;
        
        if (!redirectUri || !agendaId) {
          throw new Error("redirect_uri and agenda_id are required");
        }

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
          state: agendaId, // Pass agenda ID in state
        });

        return new Response(
          JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 2: Handle OAuth callback - exchange code for tokens
      case "exchange_code": {
        const { code, redirect_uri, agenda_id } = body;
        if (!code || !redirect_uri || !agenda_id) {
          throw new Error("code, redirect_uri, and agenda_id are required");
        }

        const tokens = await exchangeCode(code, redirect_uri);
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Save tokens to agenda
        await supabaseAdmin
          .from("avivar_agendas")
          .update({
            google_refresh_token: tokens.refresh_token,
            google_access_token: tokens.access_token,
            google_token_expires_at: expiresAt,
            google_connected: true,
            google_connected_at: new Date().toISOString(),
          })
          .eq("id", agenda_id);

        // List calendars for user to pick
        const calendars = await listCalendars(tokens.access_token);

        return new Response(
          JSON.stringify({ success: true, calendars }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 3: User picks which Google calendar to use
      case "select_calendar": {
        const { agenda_id, calendar_id, calendar_name } = body;
        if (!agenda_id || !calendar_id) {
          throw new Error("agenda_id and calendar_id are required");
        }

        await supabaseAdmin
          .from("avivar_agendas")
          .update({
            google_calendar_id: calendar_id,
            google_calendar_name: calendar_name || null,
          })
          .eq("id", agenda_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Disconnect Google Calendar
      case "disconnect": {
        const { agenda_id } = body;
        if (!agenda_id) throw new Error("agenda_id is required");

        await supabaseAdmin
          .from("avivar_agendas")
          .update({
            google_calendar_id: null,
            google_refresh_token: null,
            google_access_token: null,
            google_token_expires_at: null,
            google_connected: false,
            google_connected_at: null,
            google_calendar_name: null,
          })
          .eq("id", agenda_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // List calendars (for already connected accounts)
      case "list_calendars": {
        const { agenda_id } = body;
        if (!agenda_id) throw new Error("agenda_id is required");

        const accessToken = await getValidAccessToken(supabaseAdmin, agenda_id);
        const calendars = await listCalendars(accessToken);

        return new Response(
          JSON.stringify({ calendars }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get busy times from Google Calendar (used by AI agent for availability)
      case "get_busy_times": {
        const { agenda_id, date } = body;
        if (!agenda_id || !date) throw new Error("agenda_id and date are required");

        const { data: agenda } = await supabaseAdmin
          .from("avivar_agendas")
          .select("google_calendar_id, google_connected")
          .eq("id", agenda_id)
          .single();

        if (!agenda?.google_connected || !agenda?.google_calendar_id) {
          return new Response(
            JSON.stringify({ busy_times: [], connected: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const accessToken = await getValidAccessToken(supabaseAdmin, agenda_id);
        const timeMin = `${date}T00:00:00-03:00`;
        const timeMax = `${date}T23:59:59-03:00`;
        const events = await getEvents(accessToken, agenda.google_calendar_id, timeMin, timeMax);

        // Extract busy periods
        const busyTimes = events
          .filter((e: any) => e.status !== "cancelled")
          .map((e: any) => ({
            start: e.start,
            end: e.end,
            summary: e.summary,
          }));

        return new Response(
          JSON.stringify({ busy_times: busyTimes, connected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create event in Google Calendar (called after appointment is created)
      case "create_event": {
        const { agenda_id, summary, start, end, description, location } = body;
        if (!agenda_id || !summary || !start || !end) {
          throw new Error("agenda_id, summary, start, and end are required");
        }

        const { data: agenda } = await supabaseAdmin
          .from("avivar_agendas")
          .select("google_calendar_id, google_connected")
          .eq("id", agenda_id)
          .single();

        if (!agenda?.google_connected || !agenda?.google_calendar_id) {
          return new Response(
            JSON.stringify({ success: false, reason: "not_connected" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const accessToken = await getValidAccessToken(supabaseAdmin, agenda_id);
        const event = await createEvent(
          accessToken,
          agenda.google_calendar_id,
          summary,
          start,
          end,
          description,
          location
        );

        return new Response(
          JSON.stringify({ success: true, event_id: event.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("avivar-google-calendar error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
