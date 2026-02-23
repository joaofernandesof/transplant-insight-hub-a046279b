import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseBool(val: string | undefined): boolean {
  return val?.trim()?.toUpperCase() === "SIM";
}

function parseGrade(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-" || val.includes("NÃO INFORMADO")) return null;
  const n = parseInt(val.trim());
  return isNaN(n) ? null : n;
}

function parseVgv(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  // Parse "R$ 2.040,00" → 2040
  const cleaned = val.replace(/[R$\s.]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  // DD/MM/YYYY → YYYY-MM-DD
  const match = val.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseTime(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const t = val.trim();
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;
  return null;
}

function textOrNull(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  return val.trim();
}

function parseRow(row: string, branch: string) {
  const fields = row.split("|");
  // Remove leading/trailing empty from pipe format
  const f = fields.length > 2 ? fields.slice(1, -1) : fields;

  const patient = textOrNull(f[14]);
  if (!patient) return null;

  // Skip CURSO rows
  if (patient.includes("CURSO FORMAÇÃO")) return null;

  const procedure = textOrNull(f[19]) || "CABELO";
  const doctorName = textOrNull(f[1]);

  return {
    branch,
    patient_name: patient,
    medical_record: textOrNull(f[13]),
    procedure,
    category: textOrNull(f[18]),
    grade: parseGrade(f[20]),
    surgery_date: parseDate(f[5]),
    surgery_time: parseTime(f[8]),
    schedule_status: "agendado",
    surgery_confirmed: parseBool(f[9]),
    exams_sent: parseBool(f[10]),
    guides_sent: parseBool(f[11]),
    contract_signed: parseBool(f[24]),
    outsourcing: !!doctorName,
    doctor_on_duty: doctorName,
    is_juazeiro: parseBool(f[2]),
    trichotomy_datetime: textOrNull(f[7]),
    sale_year: textOrNull(f[12]),
    companion_name: textOrNull(f[22]),
    companion_phone: textOrNull(f[23]),
    d20_contact: parseBool(f[25]),
    d15_contact: parseBool(f[26]),
    d10_contact: parseBool(f[27]),
    d7_contact: parseBool(f[28]),
    d2_contact: parseBool(f[29]),
    d1_contact: parseBool(f[31]),
    lunch_choice: textOrNull(f[30]),
    booking_term_signed: parseBool(f[32]),
    discharge_term_signed: parseBool(f[33]),
    gpi_d1_done: parseBool(f[34]),
    notes: textOrNull(f[0]),
    vgv: parseVgv(f[21]),
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { rows, branch = "Filial Fortaleza" } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No rows provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = rows.map((r: string) => parseRow(r, branch)).filter(Boolean);
    console.log(`Parsed ${parsed.length} valid records from ${rows.length} rows`);

    if (parsed.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid records found", total_rows: rows.length }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert in batches of 50
    let inserted = 0;
    let errors: string[] = [];
    
    for (let i = 0; i < parsed.length; i += 50) {
      const batch = parsed.slice(i, i + 50);
      const { data, error } = await supabase
        .from("clinic_surgeries")
        .insert(batch)
        .select("id");

      if (error) {
        console.error(`Batch ${i} error:`, error);
        errors.push(`Batch ${Math.floor(i/50)}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_rows: rows.length,
        parsed: parsed.length,
        inserted,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
