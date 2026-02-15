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
}

export function useAllLeadStats(): AllLeadStats {
  const [leads, setLeads] = useState<any[]>([]);
  const [topLicensees, setTopLicensees] = useState<TopLicensee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      
      // Fetch leads and licensee data in parallel
      const [leadsResult, licenseeResult, sessionsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('state, city, release_status, claimed_by, created_at, claimed_at')
          .in('source', ['planilha', 'n8n'])
          .order('created_at', { ascending: false })
          .limit(50000),
        supabase
          .from('neohub_users')
          .select(`
            user_id, full_name, email, avatar_url,
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

      const leadsData = leadsResult.data || [];
      const licensees = licenseeResult.data || [];
      const sessionsData = sessionsResult.data || [];

      // Build online time map
      const onlineMap: Record<string, number> = {};
      sessionsData.forEach((s: any) => {
        if (s.user_id && s.duration_seconds) {
          onlineMap[s.user_id] = (onlineMap[s.user_id] || 0) + s.duration_seconds;
        }
      });
      
      setLeads(leadsData);

      // Calculate top licensees from leads data
      const claimMap: Record<string, { count: number; first: string; last: string }> = {};
      leadsData.forEach(l => {
        if (l.claimed_by) {
          if (!claimMap[l.claimed_by]) {
            claimMap[l.claimed_by] = { count: 0, first: l.claimed_at || l.created_at, last: l.claimed_at || l.created_at };
          }
          claimMap[l.claimed_by].count++;
          const claimDate = l.claimed_at || l.created_at;
          if (claimDate < claimMap[l.claimed_by].first) claimMap[l.claimed_by].first = claimDate;
          if (claimDate > claimMap[l.claimed_by].last) claimMap[l.claimed_by].last = claimDate;
        }
      });

      // Merge with licensee names - include all licensees even with 0 claims
      const allLicensees: TopLicensee[] = licensees.map((lic: any) => ({
        user_id: lic.user_id,
        full_name: lic.full_name || lic.email,
        email: lic.email,
        avatar_url: lic.avatar_url,
        total_claimed: claimMap[lic.user_id]?.count || 0,
        first_claim: claimMap[lic.user_id]?.first || '',
        last_claim: claimMap[lic.user_id]?.last || '',
        total_online_seconds: onlineMap[lic.user_id] || 0,
      }));

      allLicensees.sort((a, b) => b.total_claimed - a.total_claimed);
      setTopLicensees(allLicensees);
      setIsLoading(false);
    }
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const total = leads.length;
    const queued = leads.filter(l => l.release_status === 'queued').length;
    const available = leads.filter(l => l.release_status === 'available' && !l.claimed_by).length;
    const claimed = leads.filter(l => l.claimed_by).length;

    // By state
    const stateMap: Record<string, { total: number; available: number; claimed: number; queued: number }> = {};
    leads.forEach(l => {
      const s = l.state || 'N/A';
      if (!stateMap[s]) stateMap[s] = { total: 0, available: 0, claimed: 0, queued: 0 };
      stateMap[s].total++;
      if (l.release_status === 'queued') stateMap[s].queued++;
      else if (l.claimed_by) stateMap[s].claimed++;
      else stateMap[s].available++;
    });
    const byState = Object.entries(stateMap)
      .map(([state, v]) => ({ state, ...v }))
      .sort((a, b) => b.total - a.total);

    // By city (top 20)
    const cityMap: Record<string, { total: number; available: number; claimed: number }> = {};
    leads.forEach(l => {
      const c = l.city || 'N/A';
      if (!cityMap[c]) cityMap[c] = { total: 0, available: 0, claimed: 0 };
      cityMap[c].total++;
      if (l.claimed_by) cityMap[c].claimed++;
      else if (l.release_status !== 'queued') cityMap[c].available++;
    });
    const byCity = Object.entries(cityMap)
      .map(([city, v]) => ({ city, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    // By day (last 30 days)
    const now = new Date();
    const dayMap: Record<string, { total: number; claimed: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { total: 0, claimed: 0 };
    }
    leads.forEach(l => {
      const key = l.created_at?.slice(0, 10);
      if (key && dayMap[key] !== undefined) {
        dayMap[key].total++;
        if (l.claimed_by) dayMap[key].claimed++;
      }
    });
    const byDay = Object.entries(dayMap).map(([date, v]) => ({
      date: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      ...v,
    }));

    return { total, queued, available, claimed, byState, byCity, byDay, topLicensees, isLoading };
  }, [leads, topLicensees, isLoading]);

  return stats;
}
