// ====================================
// KommoModulePage - Hub Principal do Módulo Kommo
// ====================================

import React, { useState } from 'react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LayoutDashboard, GitCompare, Users, TrendingUp, Target, 
  Clock, BarChart3, XCircle, ListTodo, HeartPulse, FileBarChart, Settings,
  RefreshCw
} from 'lucide-react';
import type { KommoTab } from './types';
import { KommoFiltersProvider } from './contexts/KommoFiltersContext';
import KommoFiltersBar from './components/KommoFiltersBar';
import KommoNotificationsPanel from './components/KommoNotificationsPanel';
import { useAutoSync } from './hooks/useAutoSync';
import { useSyncProgress } from './hooks/useSyncProgress';
import KommoSyncProgressBar from './components/KommoSyncProgressBar';

// Lazy-loaded dashboards
const KommoOverview = React.lazy(() => import('./dashboards/KommoOverview'));
const KommoFunnels = React.lazy(() => import('./dashboards/KommoFunnels'));
const KommoLeads = React.lazy(() => import('./dashboards/KommoLeads'));
const KommoConversion = React.lazy(() => import('./dashboards/KommoConversion'));
const KommoPerformance = React.lazy(() => import('./dashboards/KommoPerformance'));
const KommoSources = React.lazy(() => import('./dashboards/KommoSources'));
const KommoLosses = React.lazy(() => import('./dashboards/KommoLosses'));
const KommoTasks = React.lazy(() => import('./dashboards/KommoTasks'));
const KommoPostSales = React.lazy(() => import('./dashboards/KommoPostSales'));
const KommoTime = React.lazy(() => import('./dashboards/KommoTime'));
const KommoReports = React.lazy(() => import('./dashboards/KommoReports'));
const KommoSettings = React.lazy(() => import('./dashboards/KommoSettings'));

const TABS: { value: KommoTab; label: string; icon: React.ElementType }[] = [
  { value: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { value: 'funnels', label: 'Funis', icon: GitCompare },
  { value: 'leads', label: 'Leads', icon: Users },
  { value: 'conversion', label: 'Conversão', icon: TrendingUp },
  { value: 'performance', label: 'Performance', icon: Target },
  { value: 'sources', label: 'Origens', icon: BarChart3 },
  { value: 'time', label: 'Tempo', icon: Clock },
  { value: 'losses', label: 'Perdas', icon: XCircle },
  { value: 'tasks', label: 'Tarefas', icon: ListTodo },
  { value: 'post-sales', label: 'Pós-Vendas', icon: HeartPulse },
  { value: 'reports', label: 'Relatórios', icon: FileBarChart },
  { value: 'settings', label: 'Configurações', icon: Settings },
];

// Tabs that should NOT show the global filter bar
const NO_FILTER_TABS: KommoTab[] = ['settings', 'reports'];

const Fallback = () => <div className="p-6 text-muted-foreground">Carregando...</div>;

export default function KommoModulePage() {
  const [activeTab, setActiveTab] = useState<KommoTab>('overview');
  const { isSyncing, hasConfig, hasData } = useAutoSync();

  const showFilters = !NO_FILTER_TABS.includes(activeTab);

  return (
    <ModuleLayout>
      <KommoFiltersProvider>
        <div className="p-4 lg:p-6 space-y-4">
          {/* Syncing banner */}
          {isSyncing && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sincronizando dados do Kommo pela primeira vez...
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Kommo Intelligence</h1>
              <KommoNotificationsPanel />
            </div>
            <p className="text-sm text-muted-foreground">
              Centro de inteligência comercial integrado ao CRM Kommo
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as KommoTab)} className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <TabsList className="inline-flex h-9 gap-0.5 bg-muted/50 p-0.5 w-max">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger 
                    key={value} 
                    value={value} 
                    className="text-xs px-2.5 py-1.5 gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Global Filters */}
            {showFilters && <KommoFiltersBar />}

            <React.Suspense fallback={<Fallback />}>
              <TabsContent value="overview" className="mt-4"><KommoOverview /></TabsContent>
              <TabsContent value="funnels" className="mt-4"><KommoFunnels /></TabsContent>
              <TabsContent value="leads" className="mt-4"><KommoLeads /></TabsContent>
              <TabsContent value="conversion" className="mt-4"><KommoConversion /></TabsContent>
              <TabsContent value="performance" className="mt-4"><KommoPerformance /></TabsContent>
              <TabsContent value="sources" className="mt-4"><KommoSources /></TabsContent>
              <TabsContent value="time" className="mt-4"><KommoTime /></TabsContent>
              <TabsContent value="losses" className="mt-4"><KommoLosses /></TabsContent>
              <TabsContent value="tasks" className="mt-4"><KommoTasks /></TabsContent>
              <TabsContent value="post-sales" className="mt-4"><KommoPostSales /></TabsContent>
              <TabsContent value="reports" className="mt-4"><KommoReports /></TabsContent>
              <TabsContent value="settings" className="mt-4"><KommoSettings /></TabsContent>
            </React.Suspense>
          </Tabs>
        </div>
      </KommoFiltersProvider>
    </ModuleLayout>
  );
}
