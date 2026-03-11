import { useState } from 'react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useCallIntelligence } from '@/hooks/useCallIntelligence';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, BarChart3, Plus, Brain, Loader2, Settings } from 'lucide-react';
import { CallListTab } from './components/CallListTab';
import { RegisterCallTab } from './components/RegisterCallTab';
import { CallDashboardTab } from './components/CallDashboardTab';
import { CallAnalysisView } from './components/CallAnalysisView';
import { FirefliesSettingsTab } from './components/FirefliesSettingsTab';

// We need an account_id - for NeoTeam we'll use the user's first avivar account or fallback
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export default function CallIntelligencePage() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('lista');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

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

  const handleViewAnalysis = (callId: string) => {
    setSelectedCallId(callId);
    setActiveTab('analise');
  };

  const handleCallCreated = () => {
    setActiveTab('lista');
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Faça login para acessar o módulo Call Intelligence.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="lista" className="gap-1.5">
            <Phone className="h-4 w-4" /> Calls
            {hook.calls.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{hook.calls.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="registrar" className="gap-1.5">
            <Plus className="h-4 w-4" /> Registrar
          </TabsTrigger>
          <TabsTrigger value="analise" className="gap-1.5">
            <Brain className="h-4 w-4" /> Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <CallDashboardTab stats={hook.stats} analyses={hook.analyses} calls={hook.calls} />
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <CallListTab
            calls={hook.calls}
            analyses={hook.analyses}
            isLoading={hook.isLoading}
            isAnalyzing={hook.isAnalyzing}
            onAnalyze={hook.analyzeCall}
            onViewAnalysis={handleViewAnalysis}
          />
        </TabsContent>

        <TabsContent value="registrar" className="mt-4">
          <RegisterCallTab
            onSubmit={hook.createCall}
            onCreated={handleCallCreated}
            accountId={accountId}
          />
        </TabsContent>

        <TabsContent value="analise" className="mt-4">
          {selectedCallId ? (
            <CallAnalysisView
              call={hook.calls.find(c => c.id === selectedCallId) || null}
              analysis={hook.getAnalysisForCall(selectedCallId)}
              isAnalyzing={hook.isAnalyzing}
              onAnalyze={() => hook.analyzeCall(selectedCallId)}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Selecione uma call na aba "Calls" para ver ou gerar a análise.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
