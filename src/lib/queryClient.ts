import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized Query Client Configuration
 * 
 * Uses Stale-While-Revalidate (SWR) strategy to reduce unnecessary database calls:
 * - staleTime: How long data is considered fresh (no refetch)
 * - gcTime: How long unused data stays in cache (garbage collection)
 * - refetchOnWindowFocus: Refetch when user returns to tab
 * - refetchOnReconnect: Refetch when internet reconnects
 * - retry: Number of retries on failure
 */

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short: Data that changes frequently (1 minute stale, 5 minutes cache)
  SHORT: {
    staleTime: 1 * 60 * 1000,      // 1 minute
    gcTime: 5 * 60 * 1000,         // 5 minutes
  },
  // Medium: Data that changes occasionally (5 minutes stale, 15 minutes cache)
  MEDIUM: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 15 * 60 * 1000,        // 15 minutes
  },
  // Long: Relatively static data (15 minutes stale, 1 hour cache)
  LONG: {
    staleTime: 15 * 60 * 1000,     // 15 minutes
    gcTime: 60 * 60 * 1000,        // 1 hour
  },
  // Static: Rarely changing data (1 hour stale, 24 hours cache)
  STATIC: {
    staleTime: 60 * 60 * 1000,     // 1 hour
    gcTime: 24 * 60 * 60 * 1000,   // 24 hours
  },
} as const;

// Query key prefixes for organized cache management
export const QUERY_KEYS = {
  // User & Auth
  user: ['user'] as const,
  profile: ['profile'] as const,
  
  // Data that changes frequently
  leads: ['leads'] as const,
  hotLeads: ['hot-leads'] as const,
  notifications: ['notifications'] as const,
  surgeries: ['surgeries'] as const,
  sales: ['sales'] as const,
  
  // Data that changes occasionally
  clinics: ['clinics'] as const,
  patients: ['patients'] as const,
  appointments: ['appointments'] as const,
  conversations: ['crm-conversations'] as const,
  messages: ['crm-messages'] as const,
  
  // Relatively static data
  metrics: ['metrics'] as const,
  weeklyMetrics: ['weekly-metrics'] as const,
  usageStats: ['usage-stats'] as const,
  achievements: ['achievements'] as const,
  
  // Rarely changing data
  courses: ['courses'] as const,
  materials: ['materials'] as const,
  exams: ['exams'] as const,
  certificates: ['certificates'] as const,
  permissions: ['permissions'] as const,
} as const;

// Create optimized QueryClient with SWR defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: Medium cache strategy
      staleTime: CACHE_TIMES.MEDIUM.staleTime,
      gcTime: CACHE_TIMES.MEDIUM.gcTime,
      
      // Smart refetching
      refetchOnWindowFocus: false,      // Don't refetch on every tab switch
      refetchOnReconnect: true,         // Refetch when internet comes back
      refetchOnMount: 'always',         // Always check if data is stale on mount
      
      // Retry configuration
      retry: 2,                         // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network mode
      networkMode: 'offlineFirst',      // Use cache first, then network
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Helper to create query options with specific cache strategy
 * 
 * Usage:
 * ```ts
 * useQuery({
 *   queryKey: QUERY_KEYS.leads,
 *   queryFn: fetchLeads,
 *   ...withCache('SHORT'),
 * });
 * ```
 */
export function withCache(strategy: keyof typeof CACHE_TIMES) {
  return {
    staleTime: CACHE_TIMES[strategy].staleTime,
    gcTime: CACHE_TIMES[strategy].gcTime,
  };
}

/**
 * Helper to invalidate related queries
 * 
 * Usage:
 * ```ts
 * await invalidateRelated(['leads', 'hot-leads']);
 * ```
 */
export async function invalidateRelated(keys: (keyof typeof QUERY_KEYS)[]) {
  await Promise.all(
    keys.map(key => queryClient.invalidateQueries({ queryKey: QUERY_KEYS[key] }))
  );
}

/**
 * Helper to prefetch data before navigation
 * 
 * Usage:
 * ```ts
 * await prefetchData('leads', fetchLeads);
 * ```
 */
export async function prefetchData<T>(
  key: keyof typeof QUERY_KEYS,
  queryFn: () => Promise<T>,
  strategy: keyof typeof CACHE_TIMES = 'MEDIUM'
) {
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS[key],
    queryFn,
    ...withCache(strategy),
  });
}
