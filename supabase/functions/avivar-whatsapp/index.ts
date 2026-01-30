import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Evolution API ou similar para gerenciar instâncias WhatsApp
const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL") || "";
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY") || "";

interface CreateSessionRequest {
  sessionName?: string;
}

interface SendMessageRequest {
  sessionId: string;
  phone: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
}

// Generate unique instance ID
function generateInstanceId(userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `avivar_${userId.substring(0, 8)}_${timestamp}_${random}`;
}

// Create WhatsApp instance and get QR code
async function createWhatsAppInstance(instanceId: string): Promise<{
  success: boolean;
  qrCode?: string;
  error?: string;
}> {
  // Se não tiver API configurada, simula para demonstração
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    console.log("WhatsApp API not configured, returning demo QR code");
    // Retorna um QR code de demonstração (base64)
    const demoQR = generateDemoQRCode(instanceId);
    return { success: true, qrCode: demoQR };
  }

  try {
    // Criar instância na API do WhatsApp (Evolution API, Baileys, etc)
    const response = await fetch(`${WHATSAPP_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        instanceName: instanceId,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create WhatsApp instance:", error);
      return { success: false, error: "Falha ao criar instância" };
    }

    const data = await response.json();
    return { success: true, qrCode: data.qrcode?.base64 || data.base64 };
  } catch (error) {
    console.error("Error creating WhatsApp instance:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Get QR code for existing instance
async function getQRCode(instanceId: string): Promise<{
  success: boolean;
  qrCode?: string;
  status?: string;
  error?: string;
}> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    const demoQR = generateDemoQRCode(instanceId);
    return { success: true, qrCode: demoQR, status: 'qr_code' };
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/instance/connect/${instanceId}`, {
      method: 'GET',
      headers: {
        'apikey': WHATSAPP_API_KEY,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Falha ao obter QR code" };
    }

    const data = await response.json();
    return { 
      success: true, 
      qrCode: data.qrcode?.base64 || data.base64,
      status: data.state || 'qr_code'
    };
  } catch (error) {
    console.error("Error getting QR code:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Check instance connection status
async function checkConnectionStatus(instanceId: string): Promise<{
  connected: boolean;
  phoneNumber?: string;
  phoneName?: string;
  error?: string;
}> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    // Demo mode - simulate checking status
    return { connected: false };
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/instance/connectionState/${instanceId}`, {
      method: 'GET',
      headers: {
        'apikey': WHATSAPP_API_KEY,
      },
    });

    if (!response.ok) {
      return { connected: false, error: "Falha ao verificar status" };
    }

    const data = await response.json();
    const isConnected = data.state === 'open' || data.instance?.state === 'open';
    
    return { 
      connected: isConnected,
      phoneNumber: data.instance?.owner || undefined,
      phoneName: data.instance?.profileName || undefined
    };
  } catch (error) {
    console.error("Error checking connection:", error);
    return { connected: false, error: (error as Error).message };
  }
}

// Disconnect and delete instance
async function disconnectInstance(instanceId: string): Promise<boolean> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    return true;
  }

  try {
    // Logout first
    await fetch(`${WHATSAPP_API_URL}/instance/logout/${instanceId}`, {
      method: 'DELETE',
      headers: {
        'apikey': WHATSAPP_API_KEY,
      },
    });

    // Then delete instance
    await fetch(`${WHATSAPP_API_URL}/instance/delete/${instanceId}`, {
      method: 'DELETE',
      headers: {
        'apikey': WHATSAPP_API_KEY,
      },
    });

    return true;
  } catch (error) {
    console.error("Error disconnecting instance:", error);
    return false;
  }
}

// Send message via WhatsApp
async function sendWhatsAppMessage(
  instanceId: string, 
  phone: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    return { success: false, error: "WhatsApp API não configurada" };
  }

  try {
    // Format phone number (remove non-digits and add country code if needed)
    const formattedPhone = phone.replace(/\D/g, '');
    
    const response = await fetch(`${WHATSAPP_API_URL}/message/sendText/${instanceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, messageId: data.key?.id };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Generate demo QR code (simple SVG-based for demonstration)
function generateDemoQRCode(instanceId: string): string {
  // This is a placeholder - in production, the actual API would return the QR code
  // Using a simple pattern that looks like a QR code for demo purposes
  const seed = instanceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate a pseudo-random QR-like pattern
  const size = 21;
  const moduleSize = 10;
  const margin = 40;
  const totalSize = size * moduleSize + margin * 2;
  
  let modules = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Create finder patterns (corners)
      const isFinderPattern = 
        (row < 7 && col < 7) || 
        (row < 7 && col >= size - 7) || 
        (row >= size - 7 && col < 7);
      
      // Pseudo-random data modules
      const randomVal = ((seed * (row + 1) * (col + 1)) % 100);
      const isDark = isFinderPattern 
        ? ((row === 0 || row === 6 || col === 0 || col === 6 || 
            (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
            (row === 0 || row === 6 || col === size - 7 || col === size - 1) ||
            (row >= size - 7 && (col === 0 || col === 6))) && 
           !((row >= 1 && row <= 5 && col >= 1 && col <= 5 && !(row >= 2 && row <= 4 && col >= 2 && col <= 4))))
        : randomVal > 50;
      
      if (isDark) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        modules += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
    <rect width="100%" height="100%" fill="white"/>
    ${modules}
  </svg>`;
  
  // Convert to base64
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create client with auth header to validate JWT using getClaims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Validate JWT using getClaims (required for Lovable Cloud ES256 tokens)
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const user = { id: userId, email: claimsData.claims.email as string };
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    console.log(`WhatsApp API - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create-session': {
        // Check if user already has a session
        const { data: existingSession } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingSession && existingSession.status === 'connected') {
          return new Response(
            JSON.stringify({ 
              success: true, 
              session: existingSession,
              message: 'Sessão já conectada' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate new instance ID
        const instanceId = generateInstanceId(user.id);
        
        // Create WhatsApp instance and get QR code
        const result = await createWhatsAppInstance(instanceId);
        
        if (!result.success) {
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create or update session in database
        const sessionData = {
          user_id: user.id,
          instance_id: instanceId,
          session_name: 'default',
          status: 'qr_code',
          qr_code: result.qrCode,
          qr_code_expires_at: new Date(Date.now() + 60000).toISOString(), // 60 seconds
          webhook_url: `${supabaseUrl}/functions/v1/avivar-whatsapp/webhook`,
        };

        let session;
        if (existingSession) {
          // Update existing session
          const { data, error } = await supabase
            .from('avivar_whatsapp_sessions')
            .update(sessionData)
            .eq('id', existingSession.id)
            .select()
            .single();
          
          if (error) throw error;
          session = data;
        } else {
          // Create new session
          const { data, error } = await supabase
            .from('avivar_whatsapp_sessions')
            .insert(sessionData)
            .select()
            .single();
          
          if (error) throw error;
          session = data;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            session,
            qrCode: result.qrCode 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh-qr': {
        // Get user's session
        const { data: session, error: sessionError } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ success: false, error: 'Sessão não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get new QR code
        const result = await getQRCode(session.instance_id);
        
        if (!result.success) {
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update session with new QR code
        await supabase
          .from('avivar_whatsapp_sessions')
          .update({
            qr_code: result.qrCode,
            qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
            status: result.status || 'qr_code',
          })
          .eq('id', session.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            qrCode: result.qrCode,
            status: result.status 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-status': {
        // Get user's session
        const { data: session, error: sessionError } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ success: true, connected: false, hasSession: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check connection status with WhatsApp API
        const status = await checkConnectionStatus(session.instance_id);

        // Update session if connected
        if (status.connected && session.status !== 'connected') {
          await supabase
            .from('avivar_whatsapp_sessions')
            .update({
              status: 'connected',
              phone_number: status.phoneNumber,
              phone_name: status.phoneName,
              connected_at: new Date().toISOString(),
              qr_code: null,
            })
            .eq('id', session.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            connected: status.connected,
            hasSession: true,
            session: {
              ...session,
              status: status.connected ? 'connected' : session.status,
              phone_number: status.phoneNumber || session.phone_number,
              phone_name: status.phoneName || session.phone_name,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        // Get user's session
        const { data: session, error: sessionError } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ success: false, error: 'Sessão não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Disconnect from WhatsApp API
        await disconnectInstance(session.instance_id);

        // Update session status
        await supabase
          .from('avivar_whatsapp_sessions')
          .update({
            status: 'disconnected',
            qr_code: null,
            connected_at: null,
          })
          .eq('id', session.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Desconectado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send-message': {
        const body = await req.json() as SendMessageRequest;
        
        // Get user's session
        const { data: session, error: sessionError } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'connected')
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ success: false, error: 'WhatsApp não conectado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send message
        const result = await sendWhatsAppMessage(
          session.instance_id,
          body.phone,
          body.message
        );

        if (!result.success) {
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Save message to database
        await supabase
          .from('avivar_whatsapp_messages')
          .insert({
            session_id: session.id,
            user_id: user.id,
            message_id: result.messageId || `msg_${Date.now()}`,
            remote_jid: `${body.phone.replace(/\D/g, '')}@s.whatsapp.net`,
            from_me: true,
            contact_phone: body.phone,
            content: body.message,
            media_type: 'text',
            timestamp: new Date().toISOString(),
            status: 'sent',
          });

        return new Response(
          JSON.stringify({ success: true, messageId: result.messageId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'webhook': {
        // Handle incoming webhooks from WhatsApp API
        const body = await req.json();
        console.log('WhatsApp webhook received:', JSON.stringify(body));

        // Extract message data (format depends on API used)
        const instanceId = body.instance || body.instanceName;
        const messageData = body.data || body;
        
        if (instanceId && messageData.message) {
          // Find session by instance_id
          const { data: session } = await supabase
            .from('avivar_whatsapp_sessions')
            .select('*')
            .eq('instance_id', instanceId)
            .single();

          if (session) {
            // Save incoming message
            const msg = messageData.message;
            await supabase
              .from('avivar_whatsapp_messages')
              .insert({
                session_id: session.id,
                user_id: session.user_id,
                message_id: msg.key?.id || `msg_${Date.now()}`,
                remote_jid: msg.key?.remoteJid,
                from_me: msg.key?.fromMe || false,
                contact_name: msg.pushName || messageData.pushName,
                contact_phone: msg.key?.remoteJid?.split('@')[0],
                content: msg.message?.conversation || msg.message?.extendedTextMessage?.text,
                media_type: msg.message?.imageMessage ? 'image' : 
                           msg.message?.videoMessage ? 'video' :
                           msg.message?.audioMessage ? 'audio' :
                           msg.message?.documentMessage ? 'document' : 'text',
                timestamp: new Date(msg.messageTimestamp * 1000 || Date.now()).toISOString(),
                status: 'received',
                metadata: msg,
              });

            // Update or create contact
            const phone = msg.key?.remoteJid?.split('@')[0];
            if (phone && !msg.key?.fromMe) {
              await supabase
                .from('avivar_whatsapp_contacts')
                .upsert({
                  session_id: session.id,
                  user_id: session.user_id,
                  jid: msg.key?.remoteJid,
                  phone: phone,
                  name: msg.pushName || messageData.pushName,
                  push_name: msg.pushName || messageData.pushName,
                  last_message_at: new Date().toISOString(),
                }, {
                  onConflict: 'session_id,jid',
                });
            }
          }
        }

        // Handle connection status updates
        if (body.event === 'connection.update' || body.status) {
          const status = body.status || body.state;
          if (instanceId) {
            await supabase
              .from('avivar_whatsapp_sessions')
              .update({
                status: status === 'open' ? 'connected' : 
                       status === 'close' ? 'disconnected' : 'connecting',
              })
              .eq('instance_id', instanceId);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-messages': {
        const { data: session } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!session) {
          return new Response(
            JSON.stringify({ success: true, messages: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: messages } = await supabase
          .from('avivar_whatsapp_messages')
          .select('*')
          .eq('session_id', session.id)
          .order('timestamp', { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({ success: true, messages: messages || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-contacts': {
        const { data: session } = await supabase
          .from('avivar_whatsapp_sessions')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!session) {
          return new Response(
            JSON.stringify({ success: true, contacts: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: contacts } = await supabase
          .from('avivar_whatsapp_contacts')
          .select('*')
          .eq('session_id', session.id)
          .order('last_message_at', { ascending: false });

        return new Response(
          JSON.stringify({ success: true, contacts: contacts || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Avivar WhatsApp Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
