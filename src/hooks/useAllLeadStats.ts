import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopLicensee {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  total_claimed: number;
  first_claim: string;
  last_claim: string;
  total_online_seconds: number;
  city: string | null;
  state: string | null;
}

export interface AllLeadStats {
  total: number;
  queued: number;
  available: number;
  claimed: number;
  byState: { state: string; total: number; available: number; claimed: number; queued: number }[];
  byCity: { city: string; total: number; available: number; claimed: number }[];
  byDay: { date: string; total: number; claimed: number }[];
  topLicensees: TopLicensee[];
  isLoading: boolean;
  weekLeads?: number;
}

export function useAllLeadStats(): AllLeadStats {
  const [rpcData, setRpcData] = useState<any>(null);
  const [topLicensees, setTopLicensees] = useState<TopLicensee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      
      // Fetch RPC stats, licensees, and sessions in parallel
      const [rpcResult, licenseeResult, sessionsResult] = await Promise.all([
        supabase.rpc('get_hotleads_admin_stats'),
        supabase
          .from('neohub_users')
          .select(`
            user_id, full_name, email, avatar_url, address_city, address_state,
            neohub_user_profiles!inner(profile, is_active)
          `)
          .eq('neohub_user_profiles.profile', 'licenciado')
          .eq('neohub_user_profiles.is_active', true)
          .eq('is_active', true),
        supabase
          .from('user_sessions')
          .select('user_id, duration_seconds')
          .not('duration_seconds', 'is', null),
      ]);

      const data = rpcResult.data as any;
      const licensees = licenseeResult.data || [];
      const sessionsData = sessionsResult.data || [];

      // Build online time map
      const onlineMap: Record<string, number> = {};
      sessionsData.forEach((s: any) => {
        if (s.user_id && s.duration_seconds) {
          onlineMap[s.user_id] = (onlineMap[s.user_id] || 0) + s.duration_seconds;
        }
      });

      setRpcData(data);

      // Build claim stats map from RPC data
      const claimStats: Record<string, any> = {};
      if (data?.claimStats) {
        data.claimStats.forEach((cs: any) => {
          claimStats[cs.user_id] = cs;
        });
      }

      // Merge with licensee names - include all licensees even with 0 claims
      const allLicensees: TopLicensee[] = licensees.map((lic: any) => ({
        user_id: lic.user_id,
        full_name: lic.full_name || lic.email,
        email: lic.email,
        avatar_url: lic.avatar_url,
        total_claimed: claimStats[lic.user_id]?.total_claimed || 0,
        first_claim: claimStats[lic.user_id]?.first_claim || '',
        last_claim: claimStats[lic.user_id]?.last_claim || '',
        total_online_seconds: onlineMap[lic.user_id] || 0,
        city: lic.address_city || null,
        state: lic.address_state || null,
      }));

      allLicensees.sort((a, b) => b.total_claimed - a.total_claimed);
      setTopLicensees(allLicensees);
      setIsLoading(false);
    }
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    if (!rpcData) {
      return { total: 0, queued: 0, available: 0, claimed: 0, byState: [], byCity: [], byDay: [], topLicensees, isLoading };
    }

    // Format byDay dates
    const byDay = (rpcData.byDay || []).map((d: any) => ({
      date: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`,
      total: d.total,
      claimed: d.claimed,
    }));

    return {
      total: rpcData.total || 0,
      queued: rpcData.queued || 0,
      available: rpcData.available || 0,
      claimed: rpcData.claimed || 0,
      byState: rpcData.byState || [],
      byCity: rpcData.byCity || [],
      byDay,
      topLicensees,
      isLoading,
    };
  }, [rpcData, topLicensees, isLoading]);

  return stats;
}
