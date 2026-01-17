import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { metrics, getLastAvailableWeek, generateWeeks2026 } from '@/data/metricsData';
import { calculateMetrics, getMetricStatus, formatMetricValue } from '@/utils/metricCalculations';

export interface ClinicMetricsData {
  id: string;
  name: string;
  state: string | null;
  values: Record<string, number | string | null>;
  calculated: Record<string, number | string | null>;
  hasData: boolean;
}

export interface ClinicScore extends ClinicMetricsData {
  score: number;
  maxScore: number;
  percentage: number;
}

const KEY_METRICS = ['CTR', 'CPC', 'CPL', 'LPCR', 'Atend', 'TAgend', 'TShow', 'TFech', 'Tick', 'ROI'];

export function useClinicMetrics() {
  const { clinics, getClinicData } = useData();
  
  const weeks = generateWeeks2026();
  const lastAvailableWeek = getLastAvailableWeek(weeks);
  const weekNumber = lastAvailableWeek?.weekNumber || 1;

  // Calculate metrics for all clinics from real data
  const clinicsMetrics = useMemo((): ClinicMetricsData[] => {
    return clinics.map(clinic => {
      const clinicData = getClinicData(clinic.id);
      const week = clinicData.weeks.find(w => w.weekNumber === weekNumber);
      const values = week?.values || {};
      const calculated = calculateMetrics(values);
      
      return {
        id: clinic.id,
        name: clinic.name,
        state: clinic.state || null,
        values,
        calculated,
        hasData: Object.keys(values).length > 0
      };
    });
  }, [clinics, weekNumber, getClinicData]);

  // Calculate overall scores
  const clinicScores = useMemo((): ClinicScore[] => {
    return clinicsMetrics.map(clinic => {
      let score = 0;
      let total = 0;
      
      KEY_METRICS.forEach(sigla => {
        const metric = metrics.find(m => m.sigla === sigla);
        if (!metric) return;
        
        let value: number | null = null;
        if (metric.tipo === 'auto') {
          const v = clinic.calculated[sigla];
          value = typeof v === 'number' ? v : null;
        } else {
          const v = clinic.values[sigla];
          value = typeof v === 'number' ? v : null;
        }
        
        if (value !== null) {
          const status = getMetricStatus(sigla, value);
          if (status === 'great') score += 4;
          else if (status === 'good') score += 3;
          else if (status === 'medium') score += 2;
          else if (status === 'bad') score += 1;
          total += 4;
        }
      });
      
      return {
        ...clinic,
        score,
        maxScore: total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [clinicsMetrics]);

  // Get metric comparison data
  const getMetricComparison = (sigla: string) => {
    const metric = metrics.find(m => m.sigla === sigla);
    if (!metric) return [];

    return clinicsMetrics.map(clinic => {
      let value: number | null = null;
      
      if (metric.tipo === 'auto') {
        const v = clinic.calculated[sigla];
        value = typeof v === 'number' ? v : null;
      } else {
        const v = clinic.values[sigla];
        value = typeof v === 'number' ? v : null;
      }
      
      const status = value !== null ? getMetricStatus(sigla, value) : null;
      
      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        value,
        status,
        hasData: clinic.hasData
      };
    });
  };

  // Get best performer for a metric
  const getBestPerformer = (sigla: string) => {
    const comparison = getMetricComparison(sigla);
    const metric = metrics.find(m => m.sigla === sigla);
    if (!metric) return null;

    const withValues = comparison.filter(c => c.value !== null);
    if (withValues.length === 0) return null;

    // Determine if higher is better based on metric type
    const higherIsBetter = !['CPC', 'CPL', 'CPM', 'Freq', 'Bounce', 'AbForm', 'PageSpeed', 'TAb'].includes(sigla);
    
    return withValues.reduce((best, current) => {
      if (best.value === null) return current;
      if (current.value === null) return best;
      
      if (higherIsBetter) {
        return current.value > best.value ? current : best;
      } else {
        return current.value < best.value ? current : best;
      }
    });
  };

  // Get best practices from top performers
  const bestPractices = useMemo(() => {
    const practices: { metric: string; clinicName: string; value: number; tip: string }[] = [];
    
    KEY_METRICS.forEach(sigla => {
      const best = getBestPerformer(sigla);
      const metric = metrics.find(m => m.sigla === sigla);
      
      if (best && best.value !== null && best.status === 'great' && metric) {
        practices.push({
          metric: sigla,
          clinicName: best.clinicName,
          value: best.value,
          tip: metric.seBom
        });
      }
    });
    
    return practices;
  }, [clinicsMetrics]);

  // Get areas needing improvement across all clinics
  const areasToImprove = useMemo(() => {
    const issues: { metric: string; clinics: string[]; tip: string }[] = [];
    
    KEY_METRICS.forEach(sigla => {
      const comparison = getMetricComparison(sigla);
      const metric = metrics.find(m => m.sigla === sigla);
      
      if (!metric) return;
      
      const badClinics = comparison.filter(c => c.status === 'bad').map(c => c.clinicName);
      
      if (badClinics.length > 0) {
        issues.push({
          metric: sigla,
          clinics: badClinics,
          tip: metric.acoesCorretivas
        });
      }
    });
    
    return issues;
  }, [clinicsMetrics]);

  return {
    clinicsMetrics,
    clinicScores,
    lastAvailableWeek,
    keyMetrics: KEY_METRICS,
    getMetricComparison,
    getBestPerformer,
    bestPractices,
    areasToImprove
  };
}
