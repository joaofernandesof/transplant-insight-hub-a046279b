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
  const cleaned = val.replace(/[R$\s.]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
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

// Header keyword patterns for smart column detection
const HEADER_PATTERNS: Record<string, RegExp> = {
  date: /^data$/i,
  time: /hor[áa]rio\s*(da\s*)?cirurgia/i,
  patient: /paciente/i,
  category: /categoria/i,
  procedure: /procedimento/i,
  grade: /grau/i,
  vgv: /vgv\s*(final|inicial)?/i,
  vgv_final: /vgv\s*final/i,
  companion: /acompanhante/i,
  companion_phone: /celular\s*acomp/i,
  confirmed: /contrato\s*assinado|confirmou/i,
  notes: /observa[çc][õo]es$/i,
  doctor: /terceiriza[çc][ãa]o|m[ée]dico|plantonista/i,
  medical_record: /pront/i,
  tricotomia: /tricotomia/i,
  exams: /exames\s*(recebidos|no\s*feegow)/i,
  guides: /guias\s*enviados/i,
  sale_year: /ano\s*(da\s*)?venda/i,
  is_juazeiro: /cirurgia\s*juazeiro/i,
  d20: /d[\-\s]*20/i,
  d15: /d[\-\s]*15/i,
  d10: /d[\-\s]*10/i,
  d7: /d[\-\s]*7/i,
  d2: /d[\-\s]*2(?!\d)/i,
  d1: /^d[\-\s]*1(?!\s*\()/i,
  lunch: /almo[çc]o/i,
  booking_term: /termo\s*marca/i,
  discharge_term: /termo\s*(de\s*)?alta/i,
  gpi: /gpi|d\+1/i,
};

interface ColumnMap { [key: string]: number }

function detectColumns(headers: string[]): ColumnMap | null {
  const normalized = headers.map(h => String(h ?? '').trim());
  
  const find = (pattern: RegExp): number => normalized.findIndex(h => pattern.test(h));

  const patient = find(HEADER_PATTERNS.patient);
  if (patient < 0) return null;

  const vgvFinal = find(HEADER_PATTERNS.vgv_final);
  const vgvAny = find(HEADER_PATTERNS.vgv);

  return {
    date: find(HEADER_PATTERNS.date),
    time: find(HEADER_PATTERNS.time),
    patient,
    category: find(HEADER_PATTERNS.category),
    procedure: find(HEADER_PATTERNS.procedure),
    grade: find(HEADER_PATTERNS.grade),
    vgv: vgvFinal >= 0 ? vgvFinal : vgvAny,
    companion: find(HEADER_PATTERNS.companion),
    companion_phone: find(HEADER_PATTERNS.companion_phone),
    confirmed: find(HEADER_PATTERNS.confirmed),
    notes: find(HEADER_PATTERNS.notes),
    doctor: find(HEADER_PATTERNS.doctor),
    medical_record: find(HEADER_PATTERNS.medical_record),
    tricotomia: find(HEADER_PATTERNS.tricotomia),
    exams: find(HEADER_PATTERNS.exams),
    guides: find(HEADER_PATTERNS.guides),
    sale_year: find(HEADER_PATTERNS.sale_year),
    is_juazeiro: find(HEADER_PATTERNS.is_juazeiro),
    d20: find(HEADER_PATTERNS.d20),
    d15: find(HEADER_PATTERNS.d15),
    d10: find(HEADER_PATTERNS.d10),
    d7: find(HEADER_PATTERNS.d7),
    d2: find(HEADER_PATTERNS.d2),
    d1: find(HEADER_PATTERNS.d1),
    lunch: find(HEADER_PATTERNS.lunch),
    booking_term: find(HEADER_PATTERNS.booking_term),
    discharge_term: find(HEADER_PATTERNS.discharge_term),
    gpi: find(HEADER_PATTERNS.gpi),
  };
}

function getVal(f: string[], idx: number): string | undefined {
  return idx >= 0 && idx < f.length ? f[idx] : undefined;
}

function parseRow(fields: string[], branch: string, m: ColumnMap) {
  const f = fields;
  const patient = textOrNull(getVal(f, m.patient));
  if (!patient) return null;
  if (patient === "PACIENTE" || patient.includes("CURSO FORMAÇÃO")) return null;

  const procedure = textOrNull(getVal(f, m.procedure)) || "CABELO";
  const doctorName = textOrNull(getVal(f, m.doctor));

  return {
    branch,
    patient_name: patient,
    medical_record: textOrNull(getVal(f, m.medical_record)),
    procedure,
    category: textOrNull(getVal(f, m.category)),
    grade: parseGrade(getVal(f, m.grade)),
    surgery_date: parseDate(getVal(f, m.date)),
    surgery_time: parseTime(getVal(f, m.time)),
    schedule_status: "agendado",
    surgery_confirmed: parseBool(getVal(f, m.confirmed)),
    exams_sent: parseBool(getVal(f, m.exams)),
    guides_sent: parseBool(getVal(f, m.guides)),
    contract_signed: parseBool(getVal(f, m.confirmed)),
    outsourcing: !!doctorName,
    doctor_on_duty: doctorName,
    is_juazeiro: parseBool(getVal(f, m.is_juazeiro)),
    trichotomy_datetime: textOrNull(getVal(f, m.tricotomia)),
    sale_year: textOrNull(getVal(f, m.sale_year)),
    companion_name: textOrNull(getVal(f, m.companion)),
    companion_phone: textOrNull(getVal(f, m.companion_phone)),
    d20_contact: parseBool(getVal(f, m.d20)),
    d15_contact: parseBool(getVal(f, m.d15)),
    d10_contact: parseBool(getVal(f, m.d10)),
    d7_contact: parseBool(getVal(f, m.d7)),
    d2_contact: parseBool(getVal(f, m.d2)),
    d1_contact: parseBool(getVal(f, m.d1)),
    lunch_choice: textOrNull(getVal(f, m.lunch)),
    booking_term_signed: parseBool(getVal(f, m.booking_term)),
    discharge_term_signed: parseBool(getVal(f, m.discharge_term)),
    gpi_d1_done: parseBool(getVal(f, m.gpi)),
    notes: textOrNull(getVal(f, m.notes)),
    vgv: parseVgv(getVal(f, m.vgv)),
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

    const { rows, branch = "Filial Fortaleza", headers } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No rows provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect column mapping from headers
    let columnMap: ColumnMap | null = null;
    
    if (headers && Array.isArray(headers)) {
      columnMap = detectColumns(headers);
    }
    
    // Fallback: try detecting from first row if it looks like a header
    if (!columnMap && rows.length > 0) {
      const firstRowFields = typeof rows[0] === 'string' 
        ? rows[0].split('|').filter((s: string) => s.trim() !== '')
        : rows[0];
      const testMap = detectColumns(firstRowFields);
      if (testMap) {
        columnMap = testMap;
        rows.shift(); // Remove header row
      }
    }

    if (!columnMap) {
      return new Response(
        JSON.stringify({ error: "Could not detect column mapping from headers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Column mapping detected:", columnMap);

    const batchId = `import_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const parsed = rows.map((r: any) => {
      const fields = typeof r === 'string' 
        ? r.split('|').filter((s: string, i: number, arr: string[]) => !(i === 0 && s.trim() === '') && !(i === arr.length - 1 && s.trim() === ''))
        : (Array.isArray(r) ? r.map(String) : []);
      return parseRow(fields, branch, columnMap!);
    }).filter(Boolean).map((record: any) => ({
      ...record,
      import_batch_id: batchId,
    }));

    console.log(`Parsed ${parsed.length} valid records from ${rows.length} rows`);

    if (parsed.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid records found", total_rows: rows.length }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        batch_id: batchId,
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
