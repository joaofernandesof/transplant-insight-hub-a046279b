import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RawClinicPatient {
  id: string;
  full_name: string;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  notes: string | null;
  trichotomy_datetime: string | null;
  grade: number | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

/**
 * Single source of truth for clinic_patients data.
 * Both /neoteam/tecnico/pacientes and /neoteam/tecnico/agenda-cirurgica
 * should use this hook to avoid cache collisions from different queryFns.
 */
export function useClinicPatientsRaw() {
  return useQuery<RawClinicPatient[]>({
    queryKey: ['clinic-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_patients')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1000);

      if (error) throw error;
      return (data || []) as RawClinicPatient[];
    },
  });
}
