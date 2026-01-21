import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MonitoredSystem {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'domain' | 'integration';
  url: string | null;
  timeout_ms: number;
  expected_status_codes: number[];
  headers: Record<string, string>;
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
}

// Check SSL certificate expiry
async function checkSSL(domain: string): Promise<{ daysUntilExpiry: number | null; error?: string }> {
  try {
    // Use a public SSL checker API
    const response = await fetch(`https://ssl-checker.io/api/v1/check/${domain}`);
    if (!response.ok) {
      return { daysUntilExpiry: null, error: 'Failed to check SSL' };
    }
    
    const data = await response.json();
    const expiryDate = new Date(data.valid_until || data.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return { daysUntilExpiry };
  } catch (error) {
    // Fallback: try to connect and check cert manually
    try {
      const conn = await Deno.connectTls({
        hostname: domain,
        port: 443,
      });
      conn.close();
      // If we can connect, assume SSL is valid but unknown expiry
      return { daysUntilExpiry: 30 }; // Assume 30 days if we can't determine
    } catch {
      return { daysUntilExpiry: null, error: 'SSL connection failed' };
    }
  }
}

// Check HTTP endpoint
async function checkHTTPEndpoint(
  url: string,
  timeoutMs: number,
  expectedCodes: number[],
  headers: Record<string, string>
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const isExpectedStatus = expectedCodes.includes(response.status);
    
    // Determine status based on response time and status code
    let status: 'healthy' | 'warning' | 'critical';
    if (!isExpectedStatus) {
      status = response.status >= 500 ? 'critical' : 'warning';
    } else if (responseTime > 2000) {
      status = 'warning';
    } else if (responseTime > 5000) {
      status = 'critical';
    } else {
      status = 'healthy';
    }

    return {
      status,
      response_time_ms: responseTime,
      status_code: response.status,
      error_message: isExpectedStatus ? null : `Unexpected status: ${response.status}`,
    };
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const errorObj = error as Error;
    
    return {
      status: 'critical',
      response_time_ms: responseTime > timeoutMs ? null : responseTime,
      status_code: null,
      error_message: errorObj.name === 'AbortError' ? 'Timeout' : errorObj.message,
    };
  }
}

// Check a single system
async function checkSystem(system: MonitoredSystem): Promise<HealthCheckResult> {
  if (!system.url) {
    return {
      status: 'unknown',
      response_time_ms: null,
      status_code: null,
      error_message: 'No URL configured',
    };
  }

  if (system.type === 'domain') {
    // SSL check
    const sslResult = await checkSSL(system.url);
    
    if (sslResult.error) {
      return {
        status: 'critical',
        response_time_ms: null,
        status_code: null,
        error_message: sslResult.error,
      };
    }

    const daysUntilExpiry = sslResult.daysUntilExpiry || 0;
    let status: 'healthy' | 'warning' | 'critical';
    let errorMessage: string | null = null;

    if (daysUntilExpiry <= 0) {
      status = 'critical';
      errorMessage = 'SSL certificate expired!';
    } else if (daysUntilExpiry <= 14) {
      status = 'warning';
      errorMessage = `SSL expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 30) {
      status = 'warning';
      errorMessage = `SSL expires in ${daysUntilExpiry} days`;
    } else {
      status = 'healthy';
    }

    return {
      status,
      response_time_ms: null,
      status_code: daysUntilExpiry,
      error_message: errorMessage,
    };
  }

  // HTTP check for api, webhook, integration
  return checkHTTPEndpoint(
    system.url,
    system.timeout_ms,
    system.expected_status_codes,
    system.headers || {}
  );
}

// Create alert if needed
async function createAlertIfNeeded(
  supabase: any,
  system: MonitoredSystem,
  result: HealthCheckResult,
  previousStatus: string | null
): Promise<void> {
  // Only create alert if status changed to warning/critical
  if (result.status === 'healthy' || result.status === previousStatus) {
    return;
  }

  const typeMap: Record<string, string> = {
    critical: 'downtime',
    warning: result.response_time_ms && result.response_time_ms > 2000 ? 'slow_response' : 'error',
  };

  const severityMap: Record<string, string> = {
    critical: 'high',
    warning: 'medium',
  };

  if (result.status === 'critical' || result.status === 'warning') {
    const alertData = {
      system_id: system.id,
      severity: severityMap[result.status],
      type: system.type === 'domain' ? 'ssl' : typeMap[result.status],
      message: result.error_message || `Sistema ${system.name} está ${result.status === 'critical' ? 'fora do ar' : 'lento'}`,
      details: {
        response_time_ms: result.response_time_ms,
        status_code: result.status_code,
      },
    };

    // Check if similar alert exists (not resolved)
    const { data: existingAlert } = await supabase
      .from('system_alerts')
      .select('id')
      .eq('system_id', system.id)
      .eq('resolved', false)
      .limit(1)
      .single();

    if (!existingAlert) {
      await supabase.from('system_alerts').insert(alertData);

      // Trigger WhatsApp notification
      try {
        await supabase.functions.invoke('sentinel-whatsapp', {
          body: {
            action: 'alert',
            alert: {
              systemName: system.name,
              severity: alertData.severity,
              type: alertData.type,
              message: alertData.message,
            },
          },
        });
      } catch (error) {
        console.error('Failed to send WhatsApp alert:', error);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { systemId } = body;

    // Get systems to check
    let query = supabase
      .from('monitored_systems')
      .select('*')
      .eq('is_active', true);

    if (systemId) {
      query = query.eq('id', systemId);
    }

    const { data: systems, error: systemsError } = await query;

    if (systemsError) {
      throw systemsError;
    }

    if (!systems || systems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No systems to check' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{ system: string; result: HealthCheckResult }> = [];

    for (const system of systems) {
      // Get previous status
      const { data: lastCheck } = await supabase
        .from('system_health_checks')
        .select('status')
        .eq('system_id', system.id)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      const previousStatus = lastCheck?.status || null;

      // Run health check
      const result = await checkSystem(system);
      results.push({ system: system.name, result });

      // Save health check
      await supabase.from('system_health_checks').insert({
        system_id: system.id,
        status: result.status,
        response_time_ms: result.response_time_ms,
        status_code: result.status_code,
        error_message: result.error_message,
      });

      // Create alert if needed
      await createAlertIfNeeded(supabase, system, result, previousStatus);

      // Auto-resolve alerts if system is healthy again
      if (result.status === 'healthy' && previousStatus && previousStatus !== 'healthy') {
        await supabase
          .from('system_alerts')
          .update({ resolved: true, resolved_at: new Date().toISOString() })
          .eq('system_id', system.id)
          .eq('resolved', false);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: systems.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Sentinel Check Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorObj.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
