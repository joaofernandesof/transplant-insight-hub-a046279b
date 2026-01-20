import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';

export function useBranches() {
  const { user, isAdmin, isGestao } = useClinicAuth();

  const { data: allBranches = [], isLoading } = useQuery({
    queryKey: ['clinic-branches'],
    queryFn: async () => {
      // Get unique branches from staff_profiles
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('branch')
        .eq('is_active', true);

      if (error) throw error;

      const uniqueBranches = [...new Set(data?.map(d => d.branch) || [])].sort();
      return uniqueBranches;
    },
    enabled: !!user && (isAdmin || isGestao),
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
