import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface UserUsageStats {
  user_id: string;
  user_name: string;
  user_email: string;
  avatar_url: string | null;
  clinic_name: string | null;
  total_time_seconds: number;
  session_count: number;
  last_seen_at: string | null;
  is_online: boolean;
}

interface UsageStatsFilters {
  period: 'all' | 'today' | 'week' | 'month';
}

export const useUsageStats = (filters: UsageStatsFilters = { period: 'all' }) => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<UserUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get all licensee profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url, clinic_name, last_seen_at');

      if (profilesError) throw profilesError;

      // Get licensee user_ids (non-admins)
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);
      const licenseeProfiles = profiles?.filter(p => !adminIds.has(p.user_id)) || [];

      // Build date filter
      let dateFilter: string | null = null;
      const now = new Date();

      if (filters.period === 'today') {
        dateFilter = startOfDay(now).toISOString();
      } else if (filters.period === 'week') {
        dateFilter = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      } else if (filters.period === 'month') {
        dateFilter = startOfMonth(now).toISOString();
      }

      // Get sessions for each user
      const userStats: UserUsageStats[] = await Promise.all(
        licenseeProfiles.map(async (profile) => {
          let query = supabase
            .from('user_sessions')
            .select('duration_seconds, started_at')
            .eq('user_id', profile.user_id);

          if (dateFilter) {
            query = query.gte('started_at', dateFilter);
          }

          const { data: sessions } = await query;

          const totalTime = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
          const sessionCount = sessions?.length || 0;

          // Check if user is online (last seen in last 2 minutes)
          const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at) : null;
          const isOnline = lastSeen ? (now.getTime() - lastSeen.getTime()) < 120000 : false;

          return {
            user_id: profile.user_id,
            user_name: profile.name,
            user_email: profile.email,
            avatar_url: profile.avatar_url,
            clinic_name: profile.clinic_name,
            total_time_seconds: totalTime,
            session_count: sessionCount,
            last_seen_at: profile.last_seen_at,
            is_online: isOnline,
          };
        })
      );

      // Sort by total time (descending)
      userStats.sort((a, b) => b.total_time_seconds - a.total_time_seconds);
      
      setStats(userStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, filters.period]);

  // Load once on mount or when filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, lastUpdated, refresh: fetchStats };
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
