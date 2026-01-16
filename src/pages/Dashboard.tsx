import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Header } from '@/components/Header';
import { HorizontalMetricsTable } from '@/components/HorizontalMetricsTable';
import { AllMetricsTable } from '@/components/AllMetricsTable';
import { InsightsPanel } from '@/components/InsightsPanel';
import { WeekData, isWeekAvailable, formatDate, getLastAvailableWeek, generateWeeks2026 } from '@/data/metricsData';
import { calculateMetrics } from '@/utils/metricCalculations';
import { 
  BarChart3, 
  Lightbulb, 
  Save, 
  Building2,
  GitCompare,
  Table2,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type TabType = 'indicators' | 'summary' | 'insights';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { getClinicData, saveWeekData, getAllClinicsData } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('indicators');
  const [selectedClinicId, setSelectedClinicId] = useState<string>(user?.id || '');
  const [weekValuesCache, setWeekValuesCache] = useState<Record<number, Record<string, number | string | null>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Get clinic data
  const clinicData = getClinicData(selectedClinicId);
  const weeks = clinicData.weeks;
  
  // Get current week number
  const allWeeks = generateWeeks2026();
  const currentWeek = getLastAvailableWeek(allWeeks);
  const currentWeekNumber = currentWeek?.weekNumber || 1;
  
  // Load all week values into cache
  useEffect(() => {
    const cache: Record<number, Record<string, number | string | null>> = {};
    weeks.forEach(week => {
      cache[week.weekNumber] = week.values || {};
    });
    setWeekValuesCache(cache);
  }, [weeks, selectedClinicId]);
  
  const getWeekValues = useCallback((weekNumber: number) => {
    return weekValuesCache[weekNumber] || {};
  }, [weekValuesCache]);
  
  const getCalculatedMetricsForWeek = useCallback((weekNumber: number) => {
    const values = getWeekValues(weekNumber);
    return calculateMetrics(values);
  }, [getWeekValues]);
  
  const handleValueChange = (weekNumber: number, key: string, value: number | string | null) => {
    setWeekValuesCache(prev => ({
      ...prev,
      [weekNumber]: {
        ...(prev[weekNumber] || {}),
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  const handleSaveAll = () => {
    Object.entries(weekValuesCache).forEach(([weekNum, values]) => {
      if (Object.keys(values).length > 0) {
        saveWeekData(selectedClinicId, parseInt(weekNum), values);
      }
    });
    setHasUnsavedChanges(false);
  };
  
  const currentWeekValues = getWeekValues(currentWeekNumber);
  const calculatedMetrics = calculateMetrics(currentWeekValues);
  
  const selectedWeekData = weeks.find(w => w.weekNumber === currentWeekNumber);
  const isEditable = isAdmin || (selectedWeekData && isWeekAvailable(selectedWeekData));
  
  // For admin: list of clinics
  const clinicsList = isAdmin ? [
    { id: 'clinic-1', name: 'Clínica Capilar SP' },
    { id: 'clinic-2', name: 'Hair Center RJ' },
    { id: 'clinic-3', name: 'Transplante Capilar BH' }
  ] : [];
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card rounded-xl border border-border px-4 py-2">
                <Building2 className="w-5 h-5 text-primary" />
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer"
                >
                  {clinicsList.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => navigate('/comparison')}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <GitCompare className="w-4 h-4" />
                Comparar Clínicas
              </button>
              
              <button
                onClick={() => navigate('/licensees')}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Building2 className="w-4 h-4" />
                Gerenciar Licenciados
              </button>
            </div>
          )}
          
          {/* Current Week Info */}
          <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-2">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <span className="text-sm font-semibold text-foreground">Semana Atual: </span>
              <span className="text-sm text-primary font-bold">S{currentWeekNumber}</span>
              {currentWeek && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({formatDate(currentWeek.startDate)} - {formatDate(currentWeek.endDate)})
                </span>
              )}
            </div>
          </div>
          
          {/* Save Button */}
          {isEditable && (
            <button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges}
              className={cn(
                'btn-primary flex items-center gap-2',
                !hasUnsavedChanges && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Save className="w-4 h-4" />
              {hasUnsavedChanges ? 'Salvar Alterações' : 'Salvo'}
            </button>
          )}
        </div>
        
        {/* Tabs - Styled like Resumo Semana */}
        <div className="flex flex-wrap gap-2 bg-card border border-border p-1.5 rounded-xl w-fit mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('indicators')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all',
              activeTab === 'indicators' 
                ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Table2 className="w-4 h-4" />
            Indicadores Completos
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all',
              activeTab === 'summary' 
                ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Resumo Semana
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all',
              activeTab === 'insights' 
                ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Lightbulb className="w-4 h-4" />
            Insights & Mentor
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'indicators' && (
            <HorizontalMetricsTable
              weeks={weeks}
              currentWeekNumber={currentWeekNumber}
              onValueChange={handleValueChange}
              getWeekValues={getWeekValues}
              getCalculatedMetrics={getCalculatedMetricsForWeek}
              isAdmin={isAdmin}
            />
          )}
          
          {activeTab === 'summary' && (
            <AllMetricsTable
              calculatedValues={calculatedMetrics}
              manualValues={currentWeekValues}
              onManualChange={isEditable ? (key, val) => handleValueChange(currentWeekNumber, key, val) : undefined}
              isEditable={isEditable}
            />
          )}
          
          {activeTab === 'insights' && (
            <InsightsPanel
              calculatedValues={calculatedMetrics}
              manualValues={currentWeekValues}
            />
          )}
        </div>
      </div>
    </div>
  );
}