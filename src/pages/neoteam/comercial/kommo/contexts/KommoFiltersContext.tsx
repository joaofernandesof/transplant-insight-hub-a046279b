// ====================================
// KommoFiltersContext - Filtros Globais do Módulo Kommo
// ====================================

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export type DatePreset = 'today' | '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'all' | 'custom';

export interface KommoFilters {
  datePreset: DatePreset;
  dateFrom: Date;
  dateTo: Date;
  pipelineKommoIds: number[];
  responsibleUserKommoIds: number[];
  sources: string[];
  tags: string[];
}

interface KommoFiltersContextType {
  filters: KommoFilters;
  setDatePreset: (preset: DatePreset) => void;
  setCustomDateRange: (from: Date, to: Date) => void;
  setPipelines: (ids: number[]) => void;
  setResponsibles: (ids: number[]) => void;
  setSources: (sources: string[]) => void;
  setTags: (tags: string[]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const getDateRange = (preset: DatePreset): { from: Date; to: Date } => {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case '7d':
      return { from: subDays(now, 7), to: now };
    case '30d':
      return { from: subDays(now, 30), to: now };
    case '90d':
      return { from: subDays(now, 90), to: now };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last_month': {
      const lastMonth = subDays(startOfMonth(now), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case 'all':
      return { from: new Date('2020-01-01'), to: now };
    default:
      return { from: subDays(now, 30), to: now };
  }
};

const defaultRange = getDateRange('30d');

const DEFAULT_FILTERS: KommoFilters = {
  datePreset: '30d',
  dateFrom: defaultRange.from,
  dateTo: defaultRange.to,
  pipelineKommoIds: [],
  responsibleUserKommoIds: [],
  sources: [],
  tags: [],
};

const KommoFiltersContext = createContext<KommoFiltersContextType | null>(null);

export function KommoFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<KommoFilters>(DEFAULT_FILTERS);

  const setDatePreset = useCallback((preset: DatePreset) => {
    const range = getDateRange(preset);
    setFilters(prev => ({ ...prev, datePreset: preset, dateFrom: range.from, dateTo: range.to }));
  }, []);

  const setCustomDateRange = useCallback((from: Date, to: Date) => {
    setFilters(prev => ({ ...prev, datePreset: 'custom' as DatePreset, dateFrom: from, dateTo: to }));
  }, []);

  const setPipelines = useCallback((ids: number[]) => {
    setFilters(prev => ({ ...prev, pipelineKommoIds: ids }));
  }, []);

  const setResponsibles = useCallback((ids: number[]) => {
    setFilters(prev => ({ ...prev, responsibleUserKommoIds: ids }));
  }, []);

  const setSources = useCallback((sources: string[]) => {
    setFilters(prev => ({ ...prev, sources }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFilters(prev => ({ ...prev, tags }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.datePreset !== '30d') count++;
    if (filters.pipelineKommoIds.length > 0) count++;
    if (filters.responsibleUserKommoIds.length > 0) count++;
    if (filters.sources.length > 0) count++;
    if (filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <KommoFiltersContext.Provider value={{
      filters,
      setDatePreset,
      setCustomDateRange,
      setPipelines,
      setResponsibles,
      setSources,
      setTags,
      resetFilters,
      activeFilterCount,
    }}>
      {children}
    </KommoFiltersContext.Provider>
  );
}

export function useKommoFilters() {
  const ctx = useContext(KommoFiltersContext);
  if (!ctx) throw new Error('useKommoFilters must be used within KommoFiltersProvider');
  return ctx;
}
