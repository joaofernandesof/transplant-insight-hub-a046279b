import { supabase } from '@/integrations/supabase/client';

const DUPLICATE_MSG = 'Este paciente já possui uma cirurgia agendada ou aguardando data para este procedimento.';

/**
 * Check if a patient already has an active surgery for the same procedure.
 * Returns the warning message if blocked, or null if allowed.
 *
 * Exceptions:
 * - Different procedure → allowed
 * - Category = RETOUCHING → allowed
 */
export async function checkDuplicateSurgery(opts: {
  patientId: string;
  procedure: string;
  category?: string;
  /** Exclude this surgery ID from the check (for edits) */
  excludeSurgeryId?: string;
}): Promise<string | null> {
  const { patientId, procedure, category, excludeSurgeryId } = opts;

  // Retouching is always allowed
  if (category?.toUpperCase() === 'RETOUCHING') return null;

  let query = supabase
    .from('clinic_surgeries')
    .select('id, procedure, category')
    .eq('patient_id', patientId)
    .in('schedule_status', ['agendado', 'confirmado', 'sem_data']);

  if (excludeSurgeryId) {
    query = query.neq('id', excludeSurgeryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Duplicate check error:', error);
    return null; // fail-open to not block the user
  }

  if (!data || data.length === 0) return null;

  // Check if any existing surgery matches the same procedure (case-insensitive)
  const normalizedProcedure = procedure.trim().toUpperCase();
  const hasDuplicate = data.some((s) => {
    // Skip retouching entries
    if (s.category?.toUpperCase() === 'RETOUCHING') return false;
    return s.procedure?.trim().toUpperCase() === normalizedProcedure;
  });

  return hasDuplicate ? DUPLICATE_MSG : null;
}
