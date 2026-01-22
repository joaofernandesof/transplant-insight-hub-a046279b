import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatientData {
  full_name: string;
  email?: string;
  cpf?: string;
  phone?: string;
  medical_record?: string;
  branch?: string;
  category?: string;
  baldness_grade?: string;
}

// Normalize CPF (remove formatting)
function normalizeCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null;
  const cleaned = cpf.replace(/[.\-\s]/g, '').trim();
  if (cleaned.toUpperCase() === 'ESTRANGEIRO') return 'ESTRANGEIRO';
  if (cleaned.length >= 9) return cleaned;
  return null;
}

// Normalize email
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const cleaned = email.replace(/[<>\\]/g, '').trim().toLowerCase();
  if (cleaned.includes('@') && cleaned.length > 5) return cleaned;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { patients } = await req.json() as { patients: PatientData[] };

    if (!patients || !Array.isArray(patients)) {
      return new Response(
        JSON.stringify({ error: 'Patients array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${patients.length} patient records...`);

    // Process and deduplicate patients by CPF
    const uniquePatients = new Map<string, PatientData>();

    for (const patient of patients) {
      const cpf = normalizeCpf(patient.cpf);
      const email = normalizeEmail(patient.email);
      
      if (cpf && cpf !== 'ESTRANGEIRO') {
        if (!uniquePatients.has(cpf)) {
          uniquePatients.set(cpf, { ...patient, cpf, email: email || undefined });
        } else {
          const existing = uniquePatients.get(cpf)!;
          uniquePatients.set(cpf, {
            ...existing,
            email: existing.email || email || undefined,
            phone: existing.phone || patient.phone,
          });
        }
      } else if (email) {
        const key = `email:${email}`;
        if (!uniquePatients.has(key)) {
          uniquePatients.set(key, { ...patient, cpf: cpf || undefined, email });
        }
      }
    }

    console.log(`Found ${uniquePatients.size} unique patients`);

    // Get existing CPFs from clinic_patients
    const cpfsToCheck = Array.from(uniquePatients.keys()).filter(k => !k.startsWith('email:'));
    
    const { data: existingPatients } = await supabase
      .from('clinic_patients')
      .select('cpf, email');

    const existingCpfs = new Set((existingPatients || []).map(p => p.cpf).filter(Boolean));
    const existingEmails = new Set((existingPatients || []).map(p => p.email?.toLowerCase()).filter(Boolean));

    console.log(`Found ${existingCpfs.size} existing patients in database`);

    // Prepare new patients for insertion into clinic_patients
    const newPatients: any[] = [];
    let skippedCount = 0;

    for (const [key, patient] of uniquePatients) {
      const cpf = key.startsWith('email:') ? patient.cpf : key;
      const email = patient.email?.toLowerCase();

      if (cpf && existingCpfs.has(cpf)) {
        skippedCount++;
        continue;
      }
      if (email && existingEmails.has(email)) {
        skippedCount++;
        continue;
      }

      // Build notes with extra info
      const notes: string[] = [];
      if (patient.medical_record) notes.push(`Prontuário: ${patient.medical_record}`);
      if (patient.branch) notes.push(`Filial: ${patient.branch}`);
      if (patient.category) notes.push(`Categoria: ${patient.category}`);
      if (patient.baldness_grade) notes.push(`Grau: ${patient.baldness_grade}`);

      newPatients.push({
        full_name: patient.full_name.trim(),
        email: email || null,
        cpf: cpf || null,
        phone: patient.phone || null,
        notes: notes.length > 0 ? notes.join(' | ') : null,
      });
    }

    console.log(`Inserting ${newPatients.length} new patients (${skippedCount} duplicates skipped)`);

    // Insert in batches of 100
    const batchSize = 100;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < newPatients.length; i += batchSize) {
      const batch = newPatients.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('clinic_patients')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error.message);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        insertedCount += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalReceived: patients.length,
          uniquePatients: uniquePatients.size,
          existingSkipped: skippedCount,
          inserted: insertedCount,
          errors: errors.length > 0 ? errors : undefined,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error importing patients:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});