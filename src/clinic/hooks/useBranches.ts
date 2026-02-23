import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';

export function useBranches() {
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

  // For non-admin users, return their allowed branches
  const userBranches = user && !isAdmin && !isGestao
    ? [user.branch, ...user.additionalBranches]
    : allBranches;

  return {
    branches: userBranches,
    allBranches,
    isLoading,
  };
}
