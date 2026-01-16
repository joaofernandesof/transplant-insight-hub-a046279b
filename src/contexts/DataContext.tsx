import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WeekData, generateWeeks2026, isWeekAvailable } from '@/data/metricsData';
import { calculateMetrics, CalculatedMetrics } from '@/utils/metricCalculations';

interface ClinicData {
  clinicId: string;
  weeks: WeekData[];
}

interface DataContextType {
  clinicsData: Record<string, ClinicData>;
  getClinicData: (clinicId: string) => ClinicData;
  saveWeekData: (clinicId: string, weekNumber: number, values: Record<string, number | string | null>) => void;
  getCalculatedMetrics: (clinicId: string, weekNumber: number) => CalculatedMetrics;
  getAllClinicsData: () => Record<string, ClinicData>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'byneofolic_data';

export function DataProvider({ children }: { children: ReactNode }) {
  const [clinicsData, setClinicsData] = useState<Record<string, ClinicData>>({});

  useEffect(() => {
    // Load saved data
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Reconstruct dates
      Object.keys(parsed).forEach(clinicId => {
        parsed[clinicId].weeks = parsed[clinicId].weeks.map((w: any) => ({
          ...w,
          startDate: new Date(w.startDate),
          endDate: new Date(w.endDate)
        }));
      });
      setClinicsData(parsed);
    }
  }, []);

  const saveToStorage = (data: Record<string, ClinicData>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getClinicData = (clinicId: string): ClinicData => {
    if (!clinicsData[clinicId]) {
      const newClinicData: ClinicData = {
        clinicId,
        weeks: generateWeeks2026().map(w => ({
          ...w,
          isAvailable: isWeekAvailable(w)
        }))
      };
      
      setClinicsData(prev => {
        const updated = { ...prev, [clinicId]: newClinicData };
        saveToStorage(updated);
        return updated;
      });
      
      return newClinicData;
    }
    
    // Update availability status
    return {
      ...clinicsData[clinicId],
      weeks: clinicsData[clinicId].weeks.map(w => ({
        ...w,
        isAvailable: isWeekAvailable(w)
      }))
    };
  };

  const saveWeekData = (clinicId: string, weekNumber: number, values: Record<string, number | string | null>) => {
    setClinicsData(prev => {
      const clinicData = prev[clinicId] || {
        clinicId,
        weeks: generateWeeks2026()
      };
      
      const updatedWeeks = clinicData.weeks.map(w => {
        if (w.weekNumber === weekNumber) {
          return {
            ...w,
            values,
            isFilled: Object.keys(values).length > 0
          };
        }
        return w;
      });
      
      const updated = {
        ...prev,
        [clinicId]: {
          ...clinicData,
          weeks: updatedWeeks
        }
      };
      
      saveToStorage(updated);
      return updated;
    });
  };

  const getCalculatedMetrics = (clinicId: string, weekNumber: number): CalculatedMetrics => {
    const clinicData = getClinicData(clinicId);
    const week = clinicData.weeks.find(w => w.weekNumber === weekNumber);
    
    if (!week || !week.values || Object.keys(week.values).length === 0) {
      return {};
    }
    
    return calculateMetrics(week.values);
  };

  const getAllClinicsData = () => clinicsData;

  return (
    <DataContext.Provider value={{
      clinicsData,
      getClinicData,
      saveWeekData,
      getCalculatedMetrics,
      getAllClinicsData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
