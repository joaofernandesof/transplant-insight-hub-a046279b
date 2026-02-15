import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AllLeadStats {
  total: number;
  queued: number;
  available: number;
  claimed: number;
  byState: { state: string; total: number; available: number; claimed: number; queued: number }[];
  byCity: { city: string; total: number; available: number; claimed: number }[];
  byDay: { date: string; total: number; claimed: number }[];
  isLoading: boolean;
}

export function useAllLeadStats(): AllLeadStats {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      // Fetch ALL leads (including queued) - only the fields we need for stats
      const { data, error } = await supabase
        .from('leads')
        .select('state, city, release_status, claimed_by, created_at')
        .in('source', ['planilha', 'n8n'])
        .order('created_at', { ascending: false })
        .limit(50000);

      if (!error && data) {
        setLeads(data);
      }
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

    return { total, queued, available, claimed, byState, byCity, byDay, isLoading };
  }, [leads, isLoading]);

  return stats;
}
