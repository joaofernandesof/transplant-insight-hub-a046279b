import { useState, useEffect, useMemo, useCallback } from 'react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useCallIntelligence } from '@/hooks/useCallIntelligence';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, BarChart3, Plus, Brain, Loader2, Settings, Calendar } from 'lucide-react';
import { CallListTab } from './components/CallListTab';
import { RegisterCallTab } from './components/RegisterCallTab';
import { CallDashboardTab } from './components/CallDashboardTab';
import { CallAnalysisView } from './components/CallAnalysisView';
import { FirefliesSettingsTab } from './components/FirefliesSettingsTab';
import { AgendaTab } from './components/AgendaTab';

import { supabase } from '@/integrations/supabase/client';

const CALLS_LAST_SEEN_KEY = 'call-intelligence-calls-last-seen';

export default function CallIntelligencePage() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string | null>(() => {
    return localStorage.getItem(CALLS_LAST_SEEN_KEY);
  });

  // Fetch account
  useEffect(() => {
    if (!user) return;
    supabase
      .from('avivar_account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setAccountId(data.account_id);
      });
  }, [user]);

  const hook = useCallIntelligence(accountId || undefined);

  // Count new calls since last time user opened the Calls tab
  const newCallsCount = useMemo(() => {
    if (!lastSeenTimestamp || hook.calls.length === 0) return hook.calls.length > 0 && !lastSeenTimestamp ? hook.calls.length : 0;
    return hook.calls.filter(c => c.created_at && c.created_at > lastSeenTimestamp).length;
  }, [hook.calls, lastSeenTimestamp]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab === 'lista') {
      const now = new Date().toISOString();
      localStorage.setItem(CALLS_LAST_SEEN_KEY, now);
      setLastSeenTimestamp(now);
    }
    setActiveTab(tab);
  }, []);

  const handleViewAnalysis = (callId: string) => {
    setSelectedCallId(callId);
    handleTabChange('lista');
  };

  const handleCallCreated = () => {
    handleTabChange('lista');
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Faça login para acessar o módulo Call Intelligence.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] p-4 lg:p-6 pt-14 lg:pt-6 overflow-hidden">
      <div className="shrink-0 space-y-4 mb-4">
        <NeoTeamBreadcrumb />

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Call Intelligence</h1>
            <p className="text-muted-foreground text-sm">
              Análise de calls comerciais com IA • Relatórios BANT • Scripts WhatsApp
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-3 w-full justify-start">
            <TabsTrigger value="dashboard" className="border border-border bg-background rounded-lg px-5 py-3 gap-2 text-sm font-semibold shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md hover:bg-accent transition-all">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="lista" className="border border-border bg-background rounded-lg px-5 py-3 gap-2 text-sm font-semibold shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md hover:bg-accent transition-all">
              <Phone className="h-4 w-4" /> Calls
              {hook.calls.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{hook.calls.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="registrar" className="border border-border bg-background rounded-lg px-5 py-3 gap-2 text-sm font-semibold shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md hover:bg-accent transition-all">
              <Plus className="h-4 w-4" /> Registrar
            </TabsTrigger>
            <TabsTrigger value="agenda" className="border border-border bg-background rounded-lg px-5 py-3 gap-2 text-sm font-semibold shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md hover:bg-accent transition-all">
              <Calendar className="h-4 w-4" /> Agenda
            </TabsTrigger>
            <TabsTrigger value="config" className="border border-border bg-background rounded-lg px-5 py-3 gap-2 text-sm font-semibold shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md hover:bg-accent transition-all">
              <Settings className="h-4 w-4" /> Fireflies
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <Tabs value={activeTab}>
          <TabsContent value="dashboard" className="mt-0">
            <CallDashboardTab stats={hook.stats} analyses={hook.analyses} calls={hook.calls} />
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            {selectedCallId ? (
              <div className="space-y-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedCallId(null)} className="gap-1.5">
                  ← Voltar para lista
                </Button>
                <CallAnalysisView
                  call={hook.calls.find(c => c.id === selectedCallId) || null}
                  analysis={hook.getAnalysisForCall(selectedCallId)}
                  isAnalyzing={hook.isAnalyzing}
                  onAnalyze={() => hook.analyzeCall(selectedCallId)}
                  accountId={accountId}
                />
              </div>
            ) : (
              <CallListTab
                calls={hook.calls}
                analyses={hook.analyses}
                isLoading={hook.isLoading}
                isAnalyzing={hook.isAnalyzing}
                onAnalyze={hook.analyzeCall}
                onViewAnalysis={handleViewAnalysis}
                onDeleteCalls={hook.deleteCalls}
              />
            )}
          </TabsContent>

          <TabsContent value="registrar" className="mt-0">
            <RegisterCallTab
              onSubmit={hook.createCall}
              onCreated={handleCallCreated}
              accountId={accountId}
            />
          </TabsContent>

          <TabsContent value="agenda" className="mt-0">
            <AgendaTab accountId={accountId} />
          </TabsContent>

          <TabsContent value="config" className="mt-0">
            <FirefliesSettingsTab accountId={accountId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
