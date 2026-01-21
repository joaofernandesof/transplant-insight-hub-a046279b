import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Header } from '@/components/Header';
import { AdminLayout } from '@/components/AdminLayout';
import { ModuleLayout } from '@/components/ModuleLayout';
import { HorizontalMetricsTable } from '@/components/HorizontalMetricsTable';
import { DailyMetricsTable } from '@/components/DailyMetricsTable';
import { MetricsDashboard } from '@/components/MetricsDashboard';
import { InsightsPanel } from '@/components/InsightsPanel';
import { WeekData, isWeekAvailable, formatDate, getLastAvailableWeek, generateWeeks2026 } from '@/data/metricsData';
import { calculateMetrics } from '@/utils/metricCalculations';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Save, 
  Building2,
  GitCompare,
  Table2,
  Calendar,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type TabType = 'indicators' | 'dashboard' | 'insights';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { getClinicData, saveWeekData, getAllClinicsData, isLoading: dataLoading, userClinicId, clinicsData } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('indicators');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [weekValuesCache, setWeekValuesCache] = useState<Record<number, Record<string, number | string | null>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Set selected clinic based on user role
  useEffect(() => {
    if (isAdmin) {
      // Admin: select first clinic from list
      const clinicIds = Object.keys(clinicsData);
      if (clinicIds.length > 0 && !selectedClinicId) {
        setSelectedClinicId(clinicIds[0]);
      }
    } else if (userClinicId) {
      // Licensee: use their own clinic
      setSelectedClinicId(userClinicId);
    }
  }, [isAdmin, userClinicId, clinicsData, selectedClinicId]);
  
  // Get clinic data
  const clinicData = selectedClinicId ? getClinicData(selectedClinicId) : { clinicId: '', weeks: generateWeeks2026() };
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
    setHasUnsavedChanges(false);
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
  
  const handleSaveAll = async () => {
    if (!selectedClinicId) {
      toast.error('Nenhuma clínica selecionada');
      return;
    }

    setIsSaving(true);
    try {
      const savePromises = Object.entries(weekValuesCache).map(async ([weekNum, values]) => {
        if (Object.keys(values).length > 0) {
          await saveWeekData(selectedClinicId, parseInt(weekNum), values);
        }
      });
      
      await Promise.all(savePromises);
      setHasUnsavedChanges(false);
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };
  
  const currentWeekValues = getWeekValues(currentWeekNumber);
  const calculatedMetrics = calculateMetrics(currentWeekValues);
  
  const selectedWeekData = weeks.find(w => w.weekNumber === currentWeekNumber);
  const isEditable = !isAdmin && selectedWeekData && isWeekAvailable(selectedWeekData);
  
  // For admin: list of clinics from database
  const clinicsList = Object.entries(clinicsData).map(([id, data]) => ({
    id,
    name: (data as any).name || `Clínica ${id.slice(0, 8)}...`
  }));
  
  const selectedClinicName = clinicsList.find(c => c.id === selectedClinicId)?.name || 'Clínica';

  const Layout = isAdmin ? AdminLayout : ModuleLayout;

  if (dataLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!selectedClinicId && !isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma clínica encontrada</h2>
            <p className="text-muted-foreground">Sua clínica será criada automaticamente.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="p-2 sm:p-4 lg:p-6 pt-14 sm:pt-4 max-w-[1920px] mx-auto overflow-x-hidden w-full">
        {/* Top Bar - Mobile optimized */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-6">
          {/* Admin Controls - Stack on mobile */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 bg-card rounded-lg sm:rounded-xl border border-border px-2 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto">
                <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="bg-transparent border-none text-xs sm:text-sm font-medium focus:outline-none cursor-pointer flex-1 min-w-0"
                >
                  {clinicsList.length === 0 && (
                    <option value="">Nenhuma clínica cadastrada</option>
                  )}
                  {clinicsList.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/comparison')}
                  className="btn-secondary flex items-center justify-center gap-1 text-xs flex-1 sm:flex-none px-2 py-1.5"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Comparar</span>
                </button>
                
                <button
                  onClick={() => navigate('/licensees')}
                  className="btn-secondary flex items-center justify-center gap-1 text-xs flex-1 sm:flex-none px-2 py-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Licenciados</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Week Info + Save - Compact on mobile */}
          <div className="flex items-center gap-2">
            {/* Current Week Info */}
            <div className="flex items-center gap-1.5 sm:gap-3 bg-card rounded-lg sm:rounded-xl border border-border px-2 sm:px-4 py-1.5 sm:py-2 flex-1 min-w-0">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0 min-w-0">
                <span className="text-xs font-semibold text-foreground">S{currentWeekNumber}</span>
                {currentWeek && (
                  <span className="text-[9px] sm:text-xs text-muted-foreground truncate">
                    {formatDate(currentWeek.startDate)} - {formatDate(currentWeek.endDate)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Save Button - Only for licensees */}
            {isEditable && (
              <button
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges || isSaving}
                className={cn(
                  'btn-primary flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs whitespace-nowrap',
                  (!hasUnsavedChanges || isSaving) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span className="hidden xs:inline">
                  {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar' : 'Salvo'}
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs - Compact on mobile */}
        <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0 mb-3 sm:mb-6 scrollbar-hide">
          <div className="flex gap-1 bg-card border border-border p-1 rounded-lg sm:rounded-xl w-fit min-w-full sm:min-w-0 shadow-sm">
            <button
              onClick={() => setActiveTab('indicators')}
              className={cn(
                'flex items-center justify-center gap-1 px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-sm transition-all flex-1 sm:flex-none whitespace-nowrap',
                activeTab === 'indicators' 
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Table2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Indicadores</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                'flex items-center justify-center gap-1 px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-sm transition-all flex-1 sm:flex-none whitespace-nowrap',
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={cn(
                'flex items-center justify-center gap-1 px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-sm transition-all flex-1 sm:flex-none whitespace-nowrap',
                activeTab === 'insights' 
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Insights</span>
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'indicators' && (
            <>
              {/* Daily Metrics History with Filters */}
              <DailyMetricsTable
                clinicId={selectedClinicId}
                clinicName={selectedClinicName}
                isAdmin={isAdmin}
              />
              
              {/* Weekly Metrics Table */}
              <HorizontalMetricsTable
                weeks={weeks}
                currentWeekNumber={currentWeekNumber}
                onValueChange={handleValueChange}
                getWeekValues={getWeekValues}
                getCalculatedMetrics={getCalculatedMetricsForWeek}
                isAdmin={isAdmin}
              />
            </>
          )}
          
          {activeTab === 'dashboard' && (
            <MetricsDashboard
              weeks={weeks}
              currentWeekNumber={currentWeekNumber}
              getWeekValues={getWeekValues}
              clinicName={selectedClinicName}
              clinicId={selectedClinicId}
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
    </Layout>
  );
}
