import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WeekData, generateWeeks2026, isWeekAvailable } from '@/data/metricsData';
import { calculateMetrics, CalculatedMetrics } from '@/utils/metricCalculations';
import { toast } from 'sonner';

interface ClinicData {
  clinicId: string;
  weeks: WeekData[];
}

export interface ClinicInfo {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
}

interface DataContextType {
  clinicsData: Record<string, ClinicData>;
  clinics: ClinicInfo[];
  getClinicData: (clinicId: string) => ClinicData;
  saveWeekData: (clinicId: string, weekNumber: number, values: Record<string, number | string | null>) => Promise<void>;
  getCalculatedMetrics: (clinicId: string, weekNumber: number) => CalculatedMetrics;
  getAllClinicsData: () => Record<string, ClinicData>;
  isLoading: boolean;
  userClinicId: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clinicsData, setClinicsData] = useState<Record<string, ClinicData>>({});
  const [clinics, setClinics] = useState<ClinicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userClinicId, setUserClinicId] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  // Log admin access to clinic data for audit purposes
  const logAdminAccess = useCallback(async (action: string, resourceType: string, resourceId?: string, metadata?: Record<string, unknown>) => {
    if (!user || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('admin_audit_log' as 'profiles')
        .insert({
          admin_user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          metadata: metadata || null,
        } as never);
      
      if (error) {
        console.error('Error logging admin access:', error);
      }
    } catch (error) {
      console.error('Error logging admin access:', error);
      // Don't throw - audit logging should not block functionality
    }
  }, [user, isAdmin]);

  // Fetch user's clinic and metrics from database
  const fetchUserData = useCallback(async () => {
    if (!user) {
      setClinicsData({});
      setUserClinicId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (isAdmin) {
        // Log admin access to all clinics data
        logAdminAccess('view_all_clinics', 'clinics', undefined, { context: 'dashboard_load' });
        
        // Admin: fetch all clinics and their metrics
        const { data: clinics, error: clinicsError } = await supabase
          .from('clinics')
          .select('*');

        if (clinicsError) {
          console.error('Error fetching clinics:', clinicsError);
          toast.error('Erro ao carregar dados das clínicas');
          setIsLoading(false);
          return;
        }

        if (!clinics || clinics.length === 0) {
          setClinicsData({});
          setClinics([]);
          setIsLoading(false);
          return;
        }

        // Set clinics list
        setClinics(clinics.map(c => ({
          id: c.id,
          name: c.name,
          state: c.state || null,
          city: c.city || null
        })));

        // Fetch all metrics for all clinics
        const { data: allMetrics, error: metricsError } = await supabase
          .from('weekly_metrics')
          .select('*');

        if (metricsError) {
          console.error('Error fetching metrics:', metricsError);
        }

        // Build clinics data structure
        const newClinicsData: Record<string, ClinicData> = {};
        
        for (const clinic of clinics) {
          const clinicMetrics = allMetrics?.filter(m => m.clinic_id === clinic.id) || [];
          const baseWeeks = generateWeeks2026();
          
          const weeks = baseWeeks.map(week => {
            const savedMetric = clinicMetrics.find(m => m.week_number === week.weekNumber);
            return {
              ...week,
              isAvailable: isWeekAvailable(week),
              values: savedMetric?.values as Record<string, number | string | null> || {},
              isFilled: savedMetric?.is_filled || false,
            };
          });

          newClinicsData[clinic.id] = {
            clinicId: clinic.id,
            weeks,
          };
        }

        setClinicsData(newClinicsData);
      } else {
        // Licensee: fetch only their clinic
        const { data: clinic, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (clinicError) {
          console.error('Error fetching clinic:', clinicError);
          toast.error('Erro ao carregar dados da clínica');
          setIsLoading(false);
          return;
        }

        let clinicId = clinic?.id;

        // If no clinic exists, create one
        if (!clinic) {
          const { data: newClinic, error: createError } = await supabase
            .from('clinics')
            .insert({
              user_id: user.id,
              name: user.clinicName || `Clínica de ${user.name}`,
              city: user.city,
              state: user.state,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating clinic:', createError);
            toast.error('Erro ao criar clínica');
            setIsLoading(false);
            return;
          }

          clinicId = newClinic.id;
        }

        setUserClinicId(clinicId);

        // Fetch metrics for user's clinic
        const { data: metrics, error: metricsError } = await supabase
          .from('weekly_metrics')
          .select('*')
          .eq('clinic_id', clinicId);

        if (metricsError) {
          console.error('Error fetching metrics:', metricsError);
        }

        // Build weeks with saved data
        const baseWeeks = generateWeeks2026();
        const weeks = baseWeeks.map(week => {
          const savedMetric = metrics?.find(m => m.week_number === week.weekNumber);
          return {
            ...week,
            isAvailable: isWeekAvailable(week),
            values: savedMetric?.values as Record<string, number | string | null> || {},
            isFilled: savedMetric?.is_filled || false,
          };
        });

        setClinicsData({
          [clinicId]: {
            clinicId,
            weeks,
          },
        });
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      toast.error('Erro ao carregar dados');
    }

    setIsLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const getClinicData = useCallback((clinicId: string): ClinicData => {
    if (clinicsData[clinicId]) {
      return {
        ...clinicsData[clinicId],
        weeks: clinicsData[clinicId].weeks.map(w => ({
          ...w,
          isAvailable: isWeekAvailable(w),
        })),
      };
    }

    // Return empty clinic data structure if not found
    return {
      clinicId,
      weeks: generateWeeks2026().map(w => ({
        ...w,
        isAvailable: isWeekAvailable(w),
      })),
    };
  }, [clinicsData]);

  const saveWeekData = useCallback(async (
    clinicId: string, 
    weekNumber: number, 
    values: Record<string, number | string | null>
  ): Promise<void> => {
    try {
      const isFilled = Object.keys(values).length > 0 && 
        Object.values(values).some(v => v !== null && v !== '');

      // Upsert the week data
      const { error } = await supabase
        .from('weekly_metrics')
        .upsert({
          clinic_id: clinicId,
          week_number: weekNumber,
          year: 2026,
          values,
          is_filled: isFilled,
        }, {
          onConflict: 'clinic_id,week_number,year',
        });

      if (error) {
        console.error('Error saving week data:', error);
        toast.error('Erro ao salvar dados');
        throw error;
      }

      // Update local state
      setClinicsData(prev => {
        const clinicData = prev[clinicId];
        if (!clinicData) return prev;

        const updatedWeeks = clinicData.weeks.map(w => {
          if (w.weekNumber === weekNumber) {
            return {
              ...w,
              values,
              isFilled,
            };
          }
          return w;
        });

        return {
          ...prev,
          [clinicId]: {
            ...clinicData,
            weeks: updatedWeeks,
          },
        };
      });
    } catch (error) {
      console.error('Error in saveWeekData:', error);
      throw error;
    }
  }, []);

  const getCalculatedMetrics = useCallback((clinicId: string, weekNumber: number): CalculatedMetrics => {
    const clinicData = getClinicData(clinicId);
    const week = clinicData.weeks.find(w => w.weekNumber === weekNumber);
    
    if (!week || !week.values || Object.keys(week.values).length === 0) {
      return {};
    }
    
    return calculateMetrics(week.values);
  }, [getClinicData]);

  const getAllClinicsData = useCallback(() => clinicsData, [clinicsData]);

  const refreshData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  return (
    <DataContext.Provider value={{
      clinicsData,
      clinics,
      getClinicData,
      saveWeekData,
      getCalculatedMetrics,
      getAllClinicsData,
      isLoading,
      userClinicId,
      refreshData,
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
