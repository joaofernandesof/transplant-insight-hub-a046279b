/**
 * Hook for persisting AI insights in localStorage
 * Keeps insights cached until user manually triggers a refresh
 */

import { useState, useEffect, useCallback } from 'react';

interface StoredInsights<T> {
  insights: T;
  lastGenerated: string;
  contextKey?: string;
}

interface UsePersistedAIInsightsOptions {
  /** Unique storage key for this type of insights */
  storageKey: string;
  /** Optional context key (e.g., classId) to match when restoring */
  contextKey?: string;
}

interface UsePersistedAIInsightsReturn<T> {
  /** Current insights data */
  insights: T | null;
  /** When insights were last generated */
  lastGenerated: Date | null;
  /** Whether insights are currently loading */
  isLoading: boolean;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
  /** Save new insights (persists to localStorage) */
  saveInsights: (newInsights: T) => void;
  /** Clear stored insights */
  clearInsights: () => void;
}

export function usePersistedAIInsights<T = any>(
  options: UsePersistedAIInsightsOptions
): UsePersistedAIInsightsReturn<T> {
  const { storageKey, contextKey } = options;
  
  const [insights, setInsights] = useState<T | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load persisted insights on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredInsights<T> = JSON.parse(stored);
        // Only restore if same context or no context filter
        if (!contextKey || parsed.contextKey === contextKey) {
          setInsights(parsed.insights);
          setLastGenerated(new Date(parsed.lastGenerated));
        }
      }
    } catch (e) {
      console.warn(`Failed to load stored insights for ${storageKey}:`, e);
    }
  }, [storageKey, contextKey]);

  // Save insights to localStorage
  const saveInsights = useCallback((newInsights: T) => {
    try {
      const toStore: StoredInsights<T> = {
        insights: newInsights,
        lastGenerated: new Date().toISOString(),
        contextKey
      };
      localStorage.setItem(storageKey, JSON.stringify(toStore));
      setInsights(newInsights);
      setLastGenerated(new Date());
    } catch (e) {
      console.warn(`Failed to persist insights for ${storageKey}:`, e);
      // Still update state even if localStorage fails
      setInsights(newInsights);
      setLastGenerated(new Date());
    }
  }, [storageKey, contextKey]);

  // Clear stored insights
  const clearInsights = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setInsights(null);
      setLastGenerated(null);
    } catch (e) {
      console.warn(`Failed to clear insights for ${storageKey}:`, e);
    }
  }, [storageKey]);

  return {
    insights,
    lastGenerated,
    isLoading,
    setIsLoading,
    saveInsights,
    clearInsights,
  };
}
