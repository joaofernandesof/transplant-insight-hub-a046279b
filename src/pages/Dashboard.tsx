import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Header } from '@/components/Header';
import { WeekSelector } from '@/components/WeekSelector';
import { BaseDataInputTable } from '@/components/BaseDataInputTable';
import { HorizontalMetricsTable } from '@/components/HorizontalMetricsTable';
import { AllMetricsTable } from '@/components/AllMetricsTable';
import { InsightsPanel } from '@/components/InsightsPanel';
import { WeekData, isWeekAvailable, formatDate, getLastAvailableWeek } from '@/data/metricsData';
import { calculateMetrics } from '@/utils/metricCalculations';
import { 
  BarChart3, 
  FileInput, 
  Lightbulb, 
  Save, 
  Building2,
  GitCompare,
  Database,
  Table2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type TabType = 'input-base' | 'input-metrics' | 'metrics' | 'insights';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { getClinicData, saveWeekData, getAllClinicsData } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('input-base');
  const [selectedClinicId, setSelectedClinicId] = useState<string>(user?.id || '');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekValuesCache, setWeekValuesCache] = useState<Record<number, Record<string, number | string | null>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Get clinic data
  const clinicData = getClinicData(selectedClinicId);
  const weeks = clinicData.weeks;
  
  // Initialize with last available week
  useEffect(() => {
    if (!selectedWeek) {
      const lastAvailable = getLastAvailableWeek(weeks);
      if (lastAvailable) {
        setSelectedWeek(lastAvailable.weekNumber);
      }
    }
  }, [weeks, selectedWeek]);
  
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
  
  const currentWeekValues = selectedWeek ? getWeekValues(selectedWeek) : {};
  const calculatedMetrics = calculateMetrics(currentWeekValues);
  
  const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
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
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-2 space-y-4">
            {/* Admin Clinic Selector */}
            {isAdmin && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground text-sm">Selecionar Clínica</h3>
                </div>
                <select
                  value={selectedClinicId}
                  onChange={(e) => {
                    setSelectedClinicId(e.target.value);
                    setSelectedWeek(null);
                  }}
                  className="input-metric w-full text-sm"
                >
                  {clinicsList.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
                
                {/* Compare Clinics Button */}
                <button
                  onClick={() => navigate('/comparison')}
                  className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm"
                >
                  <GitCompare className="w-4 h-4" />
                  Comparar Clínicas
                </button>
              </div>
            )}
            
            {/* Week Selector */}
            <WeekSelector
              weeks={weeks}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              isAdmin={isAdmin}
            />
          </div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-10 space-y-4">
            {/* Week Header + Save */}
            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                {selectedWeekData && (
                  <>
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedWeekData.weekLabel}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(selectedWeekData.startDate)} a {formatDate(selectedWeekData.endDate)}
                    </p>
                  </>
                )}
              </div>
              
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
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-muted/50 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('input-base')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'input-base' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Database className="w-4 h-4" />
                Dados Base
              </button>
              <button
                onClick={() => setActiveTab('input-metrics')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'input-metrics' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Table2 className="w-4 h-4" />
                Indicadores Completos
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'metrics' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Resumo Semana
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'insights' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Lightbulb className="w-4 h-4" />
                Insights & Mentor
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="animate-fade-in">
              {activeTab === 'input-base' && selectedWeek && (
                <BaseDataInputTable
                  weeks={weeks}
                  currentWeekNumber={selectedWeek}
                  onValueChange={handleValueChange}
                  getWeekValues={getWeekValues}
                  isAdmin={isAdmin}
                />
              )}
              
              {activeTab === 'input-metrics' && selectedWeek && (
                <HorizontalMetricsTable
                  weeks={weeks}
                  currentWeekNumber={selectedWeek}
                  onValueChange={handleValueChange}
                  getWeekValues={getWeekValues}
                  getCalculatedMetrics={getCalculatedMetricsForWeek}
                  isAdmin={isAdmin}
                />
              )}
              
              {activeTab === 'metrics' && (
                <AllMetricsTable
                  calculatedValues={calculatedMetrics}
                  manualValues={currentWeekValues}
                  onManualChange={isEditable ? (key, val) => selectedWeek && handleValueChange(selectedWeek, key, val) : undefined}
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
      </div>
    </div>
  );
}
