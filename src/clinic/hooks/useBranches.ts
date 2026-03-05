import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';

export function useBranches(options?: { showAll?: boolean }) {
  const { user, isAdmin, isGestao } = useClinicAuth();

  const { data: allBranches = [], isLoading } = useQuery({
    queryKey: ['clinic-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_branches')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data?.map(d => d.name) || [];
    },
  });

  // When showAll is true, bypass role restrictions
  const userBranches = options?.showAll || !user || isAdmin || isGestao
    ? allBranches
    : [user.branch, ...user.additionalBranches];

  return {
    branches: userBranches,
    allBranches,
    isLoading,
  };
}
