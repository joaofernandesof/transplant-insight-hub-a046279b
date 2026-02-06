import { useState, useMemo, useCallback } from 'react';
import { ConfettiEffect } from '@/components/hotleads/ConfettiEffect';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, RefreshCw, Loader2, Upload, BarChart3, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useHotLeads } from '@/hooks/useHotLeads';
import {
  AvailableLeadCard,
  AcquiredLeadCard,
  LeadAcquireDialog,
  LeadImportDialog,
  LeadExportButton,
  PaginatedLeadColumn,
  HotLeadsOverview,
  BrazilMapChart,
  HotLeadsCharts,
  HotLeadsGlobalFilters,
  NextLeadReleaseBanner,
} from '@/components/hotleads';
import type { HotLead } from '@/hooks/useHotLeads';

export default function HotLeads() {
  const { isAdmin, user } = useAuth();
  const {
    leads,
    availableLeads,
    myLeads,
    acquiredLeads,
    isLoading,
    isRefreshing,
    fetchLeads,
    acquireLead,
    importLeads,
    getClaimerName,
  } = useHotLeads();

  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [isAcquireOpen, setIsAcquireOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAcquireConfirm = useCallback(async (leadId: string, email: string) => {
    const success = await acquireLead(leadId, email);
    if (success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
    return success;
  }, [acquireLead]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Global filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  // Available states for filter
  const availableStates = useMemo(() => {
    return [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];
  }, [leads]);

  // Filtered leads based on global filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          lead.name?.toLowerCase().includes(search) ||
          lead.phone?.toLowerCase().includes(search) ||
          lead.city?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // State filter
      if (stateFilter !== 'all' && lead.state !== stateFilter) return false;
      
      // Period filter
      if (periodFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (periodFilter) {
          case 'today':
            if (leadDate < today) return false;
            break;
          case '7d':
            if (leadDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
            break;
          case '30d':
            if (leadDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false;
            break;
          case '90d':
            if (leadDate < new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)) return false;
            break;
        }
      }
      
      return true;
    });
  }, [leads, searchTerm, stateFilter, periodFilter]);

  // Filtered subsets
  const filteredAvailable = useMemo(() => 
    filteredLeads.filter(l => !l.claimed_by && (l as any).release_status === 'available'), [filteredLeads]);
  
  const filteredMyLeads = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by === user?.id), [filteredLeads, user?.id]);
  
  const filteredAcquired = useMemo(() => 
    filteredLeads.filter(l => !!l.claimed_by && l.claimed_by !== user?.id), [filteredLeads, user?.id]);

  const handleAcquireClick = (lead: HotLead) => {
    setSelectedLead(lead);
    setIsAcquireOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2 pl-12 lg:pl-0">
              <Flame className="h-6 w-6 text-orange-500" />
              HotLeads
            </h1>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <LeadExportButton leads={leads} getClaimerName={getClaimerName} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      if (!confirm('Resetar toda a base de leads? Esta ação não pode ser desfeita.')) return;
                      const { error } = await supabase.from('leads').delete().eq('source', 'planilha');
                      if (error) { toast.error('Erro ao resetar'); return; }
                      toast.success('Base resetada');
                      fetchLeads(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLeads(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content with Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads ({leads.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Global Filters */}
          <div className="px-4 py-4">
            <HotLeadsGlobalFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              periodFilter={periodFilter}
              setPeriodFilter={setPeriodFilter}
              availableStates={availableStates}
            />
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="flex-1 overflow-y-auto px-4 pb-6 mt-0">
            <div className="space-y-6">
              {/* Overview Stats */}
              <HotLeadsOverview
                leads={filteredLeads}
                myLeads={myLeads}
                availableLeads={availableLeads}
                acquiredLeads={acquiredLeads}
              />

              {/* Brazil Map */}
              <BrazilMapChart leads={filteredLeads} />

              {/* Charts */}
              <HotLeadsCharts leads={filteredLeads} />
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="flex-1 overflow-hidden px-4 pb-4 mt-0">
            <NextLeadReleaseBanner onLeadReleased={() => fetchLeads(true)} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <PaginatedLeadColumn
                title="Leads Disponíveis"
                dotColor="bg-green-500"
                items={filteredAvailable}
                emptyMessage="Nenhum lead disponível no momento."
                renderItem={(lead) => (
                  <AvailableLeadCard key={lead.id} lead={lead} onAcquire={handleAcquireClick} />
                )}
              />
              <PaginatedLeadColumn
                title="Meus Leads"
                dotColor="bg-blue-500"
                items={myLeads}
                emptyMessage="Você ainda não adquiriu nenhum lead."
                renderItem={(lead) => (
                  <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} />
                )}
              />
              <PaginatedLeadColumn
                title="Leads Adquiridos"
                dotColor="bg-muted-foreground"
                items={acquiredLeads}
                emptyMessage="Nenhum lead adquirido por outros."
                renderItem={(lead) => (
                  <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} />
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ConfettiEffect active={showConfetti} />

      <LeadAcquireDialog
        lead={selectedLead}
        open={isAcquireOpen}
        onOpenChange={setIsAcquireOpen}
        onConfirm={handleAcquireConfirm}
      />

      <LeadImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={importLeads}
      />
    </div>
  );
}
