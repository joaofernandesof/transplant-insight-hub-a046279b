import React, { createContext, useContext, useState, ReactNode } from 'react';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

export type PeriodType = '7d' | '30d' | '3m' | '6m';

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  type: PeriodType;
}

interface DashboardPeriodContextType {
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  dateRange: PeriodRange;
  previousRange: PeriodRange;
}

const periodOptions: Record<PeriodType, { label: string; getDates: () => { start: Date; end: Date } }> = {
  '7d': {
    label: 'Últimos 7 dias',
    getDates: () => ({
      start: startOfDay(subDays(new Date(), 7)),
      end: endOfDay(new Date())
    })
  },
  '30d': {
    label: 'Últimos 30 dias',
    getDates: () => ({
      start: startOfDay(subDays(new Date(), 30)),
      end: endOfDay(new Date())
    })
  },
  '3m': {
    label: 'Últimos 3 meses',
    getDates: () => ({
      start: startOfDay(subMonths(new Date(), 3)),
      end: endOfDay(new Date())
    })
  },
  '6m': {
    label: 'Últimos 6 meses',
    getDates: () => ({
      start: startOfDay(subMonths(new Date(), 6)),
      end: endOfDay(new Date())
    })
  }
};

const getPreviousRange = (type: PeriodType): { start: Date; end: Date } => {
  const current = periodOptions[type].getDates();
  const diff = current.end.getTime() - current.start.getTime();
  return {
    start: new Date(current.start.getTime() - diff),
    end: new Date(current.end.getTime() - diff)
  };
};

const DashboardPeriodContext = createContext<DashboardPeriodContextType | undefined>(undefined);

export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodType>('30d');

  const currentDates = periodOptions[period].getDates();
  const previousDates = getPreviousRange(period);

  const dateRange: PeriodRange = {
    ...currentDates,
    label: periodOptions[period].label,
    type: period
  };

  const previousRange: PeriodRange = {
    ...previousDates,
    label: `Período anterior`,
    type: period
  };

  return (
    <DashboardPeriodContext.Provider value={{ period, setPeriod, dateRange, previousRange }}>
      {children}
    </DashboardPeriodContext.Provider>
  );
}

export function useDashboardPeriod() {
  const context = useContext(DashboardPeriodContext);
  if (context === undefined) {
    throw new Error('useDashboardPeriod must be used within a DashboardPeriodProvider');
  }
  return context;
}

export { periodOptions };