import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Header } from '@/components/Header';
import { WeekSelector } from '@/components/WeekSelector';
import { DataEntryTable } from '@/components/DataEntryTable';
import { ManualMetricsTable } from '@/components/ManualMetricsTable';
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
  ChevronDown,
  GitCompare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type TabType = 'input' | 'metrics' | 'insights';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { getClinicData, saveWeekData, getAllClinicsData } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [selectedClinicId, setSelectedClinicId] = useState<string>(user?.id || '');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, number | string | null>>({});
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
  
  // Load values when week changes
  useEffect(() => {
    if (selectedWeek) {
      const week = weeks.find(w => w.weekNumber === selectedWeek);
      if (week) {
        setInputValues(week.values || {});
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedWeek, weeks, selectedClinicId]);
  
  const handleInputChange = (key: string, value: number | string | null) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };
  
  const handleSave = () => {
    if (selectedWeek) {
      saveWeekData(selectedClinicId, selectedWeek, inputValues);
      setHasUnsavedChanges(false);
    }
  };
  
  const calculatedMetrics = calculateMetrics(inputValues);
  
  const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
  const isEditable = isAdmin || (selectedWeekData && isWeekAvailable(selectedWeekData));
  
  // For admin: list of clinics
  const allClinicsData = getAllClinicsData();
  const clinicsList = isAdmin ? [
    { id: 'clinic-1', name: 'Clínica Capilar SP' },
    { id: 'clinic-2', name: 'Hair Center RJ' },
    { id: 'clinic-3', name: 'Transplante Capilar BH' }
  ] : [];
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Admin Clinic Selector */}
            {isAdmin && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Selecionar Clínica</h3>
                </div>
                <select
                  value={selectedClinicId}
                  onChange={(e) => {
                    setSelectedClinicId(e.target.value);
                    setSelectedWeek(null);
                  }}
                  className="input-metric w-full"
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
                  className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
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
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Week Header */}
            {selectedWeekData && (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedWeekData.weekLabel}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(selectedWeekData.startDate)} a {formatDate(selectedWeekData.endDate)}
                  </p>
                </div>
                
                {isEditable && (
                  <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                    className={cn(
                      'btn-primary',
                      !hasUnsavedChanges && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Save className="w-4 h-4" />
                    {hasUnsavedChanges ? 'Salvar Alterações' : 'Salvo'}
                  </button>
                )}
              </div>
            )}
            
            {/* Tabs */}
            <div className="flex gap-2 bg-muted/50 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('input')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'input' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileInput className="w-4 h-4" />
                Preenchimento
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
                Indicadores
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
              {activeTab === 'input' && (
                <div className="space-y-6">
                  <DataEntryTable
                    values={inputValues}
                    onChange={handleInputChange}
                    isEditable={isEditable}
                  />
                  <ManualMetricsTable
                    values={inputValues}
                    onChange={handleInputChange}
                    isEditable={isEditable}
                  />
                </div>
              )}
              
              {activeTab === 'metrics' && (
                <AllMetricsTable
                  calculatedValues={calculatedMetrics}
                  manualValues={inputValues}
                  onManualChange={isEditable ? handleInputChange : undefined}
                  isEditable={isEditable}
                />
              )}
              
              {activeTab === 'insights' && (
                <InsightsPanel
                  calculatedValues={calculatedMetrics}
                  manualValues={inputValues}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
