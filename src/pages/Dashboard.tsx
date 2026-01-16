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
  Calendar,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type TabType = 'indicators' | 'summary' | 'insights';

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
    name: `Clínica ${id.slice(0, 8)}...`
  }));

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedClinicId && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma clínica encontrada</h2>
            <p className="text-muted-foreground">Sua clínica será criada automaticamente.</p>
          </div>
        </div>
      </div>
    );
  }
  
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
          
          {/* Save Button - Only for licensees */}
          {isEditable && (
            <button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving}
              className={cn(
                'btn-primary flex items-center gap-2',
                (!hasUnsavedChanges || isSaving) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Alterações' : 'Salvo'}
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
