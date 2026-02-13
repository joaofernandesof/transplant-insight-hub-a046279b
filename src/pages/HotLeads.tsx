import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ConfettiEffect } from '@/components/hotleads/ConfettiEffect';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Flame, RefreshCw, Loader2, Upload, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useHotLeads } from '@/hooks/useHotLeads';
import { useHotLeadsSettings } from '@/hooks/useHotLeadsSettings';
import {
  AvailableLeadCard,
  AcquiredLeadCard,
  LeadAcquireDialog,
  LeadImportDialog,
  LeadExportButton,
  PaginatedLeadColumn,
  HotLeadsGlobalFilters,
  NextLeadReleaseBanner,
} from '@/components/hotleads';
import { LicenseeSettingsDialog } from '@/components/hotleads/LicenseeSettingsDialog';
import { HotLeadsStats } from '@/components/hotleads/HotLeadsStats';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
    releaseLead,
    importLeads,
    getClaimerName,
  } = useHotLeads();
  const { settings, isLoading: settingsLoading, saveSettings, generateWhatsAppUrl } = useHotLeadsSettings();

  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [isAcquireOpen, setIsAcquireOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSettingsRequired, setShowSettingsRequired] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Cooldown: 5 minutes (300 seconds) after acquiring a lead
  const COOLDOWN_SECONDS = 300;
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`hotleads_cooldown_${user?.id}`);
    if (stored) {
      const expiresAt = parseInt(stored, 10);
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      if (remaining > 0) setCooldownRemaining(remaining);
      else localStorage.removeItem(`hotleads_cooldown_${user?.id}`);
    }
  }, [user?.id]);

  // Tick down the cooldown
  useEffect(() => {
    if (cooldownRemaining <= 0) {
      if (cooldownInterval.current) clearInterval(cooldownInterval.current);
      return;
    }
    cooldownInterval.current = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          localStorage.removeItem(`hotleads_cooldown_${user?.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (cooldownInterval.current) clearInterval(cooldownInterval.current); };
  }, [cooldownRemaining > 0, user?.id]);

  const startCooldown = useCallback(() => {
    const expiresAt = Date.now() + COOLDOWN_SECONDS * 1000;
    localStorage.setItem(`hotleads_cooldown_${user?.id}`, expiresAt.toString());
    setCooldownRemaining(COOLDOWN_SECONDS);
  }, [user?.id]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAcquireConfirm = useCallback(async (leadId: string, email: string) => {
    const success = await acquireLead(leadId, email);
    if (success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
      startCooldown();
    }
    return success;
  }, [acquireLead, startCooldown]);
  
  // Global filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Available states for filter
  const availableStates = useMemo(() => {
    return [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];
  }, [leads]);

  // Available cities (filtered by selected state)
  const availableCities = useMemo(() => {
    const filtered = stateFilter !== 'all' ? leads.filter(l => l.state === stateFilter) : leads;
    return [...new Set(filtered.map(l => l.city).filter(Boolean))] as string[];
  }, [leads, stateFilter]);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(lead => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          lead.name?.toLowerCase().includes(search) ||
          lead.phone?.toLowerCase().includes(search) ||
          lead.city?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      if (stateFilter !== 'all' && lead.state !== stateFilter) return false;
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
      if (periodFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        switch (periodFilter) {
          case 'today': if (leadDate < today) return false; break;
          case '7d': if (leadDate < new Date(now.getTime() - 7 * 86400000)) return false; break;
          case '30d': if (leadDate < new Date(now.getTime() - 30 * 86400000)) return false; break;
          case '90d': if (leadDate < new Date(now.getTime() - 90 * 86400000)) return false; break;
        }
      }
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc': return (a.name || '').localeCompare(b.name || '', 'pt-BR');
        case 'name_desc': return (b.name || '').localeCompare(a.name || '', 'pt-BR');
        case 'city_asc': return (a.city || '').localeCompare(b.city || '', 'pt-BR');
        case 'state_asc': return (a.state || '').localeCompare(b.state || '', 'pt-BR');
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [leads, searchTerm, stateFilter, cityFilter, periodFilter, sortBy]);

  // Filtered subsets
  const filteredAvailable = useMemo(() => 
    filteredLeads.filter(l => !l.claimed_by && l.release_status === 'available'), [filteredLeads]);
  
  const filteredMyLeads = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by === user?.id), [filteredLeads, user?.id]);
  
  const filteredAcquired = useMemo(() => 
    filteredLeads.filter(l => !!l.claimed_by && l.claimed_by !== user?.id), [filteredLeads, user?.id]);

  const handleAcquireClick = (lead: HotLead) => {
    if (!settings) {
      setSelectedLead(lead);
      setShowSettingsRequired(true);
      return;
    }
    setSelectedLead(lead);
    setIsAcquireOpen(true);
  };

  const handleSettingsSaved = async (values: { licensee_name: string; clinic_name: string; clinic_city: string }) => {
    const success = await saveSettings(values);
    if (success && selectedLead) {
      setShowSettingsRequired(false);
      // After saving settings, open the acquire dialog
      setTimeout(() => setIsAcquireOpen(true), 300);
    }
    return success;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-orange-600 to-red-600 sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-bold items-center gap-2 text-white hidden lg:flex">
              <Flame className="h-6 w-6 text-white/80" />
              HotLeads
            </h1>
            {/* Desktop buttons stay in header */}
            <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Importar</span>
                  </Button>
                  <LeadExportButton leads={leads} getClaimerName={getClaimerName} />
                </>
              )}
              {!isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Config</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLeads(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed top section - sticky below header */}
      <div className="shrink-0 px-3 lg:px-4 py-3 space-y-3 sticky top-[57px] z-10 bg-background">
        {/* Mobile action buttons - moved out of red header */}
        <div className="flex items-center gap-1.5 flex-wrap lg:hidden">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              <LeadExportButton leads={leads} getClaimerName={getClaimerName} />
            </>
          )}
          {!isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Config</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeads(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Desktop: filters first, then stats, then motivational */}
        <div className="hidden lg:block">
          <HotLeadsGlobalFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            availableStates={availableStates}
            availableCities={availableCities}
          />
        </div>

        <HotLeadsStats
          leads={filteredLeads}
          availableCount={filteredAvailable.length}
          myLeadsCount={filteredMyLeads.length}
          acquiredCount={filteredAcquired.length}
        />
        {/* Motivational phrase */}
        <div className="text-center py-2">
          <p className="text-lg lg:text-xl font-bold text-muted-foreground italic">
            🔥 Cada lead é um paciente buscando transformação — <span className="text-orange-600 font-extrabold not-italic">capture antes que outro licenciado o faça.</span>
          </p>
        </div>

        {/* Mobile: filters after motivational text */}
        <div className="lg:hidden">
          <HotLeadsGlobalFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            availableStates={availableStates}
            availableCities={availableCities}
          />
        </div>

        <NextLeadReleaseBanner onLeadReleased={() => fetchLeads(true)} />
      </div>

      {/* Scrollable columns area - takes remaining height */}
      <div className="flex-1 px-3 lg:px-4 pb-4">
        {/* Mobile: Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="available" className="flex flex-col">
            <TabsList className="w-full grid grid-cols-3 mb-3 shrink-0">
              <TabsTrigger value="available" className="text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 mr-1.5" />
                Disponíveis ({filteredAvailable.length})
              </TabsTrigger>
              <TabsTrigger value="mine" className="text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 mr-1.5" />
                Meus ({filteredMyLeads.length})
              </TabsTrigger>
              <TabsTrigger value="lost" className="text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 mr-1.5" />
                Perdidos ({filteredAcquired.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="available" className="flex-1 mt-0 min-h-0">
              <PaginatedLeadColumn
                title="Leads Disponíveis"
                dotColor="bg-green-500"
                items={filteredAvailable}
                emptyMessage="Nenhum lead disponível no momento."
                renderItem={(lead) => (
                  <AvailableLeadCard key={lead.id} lead={lead} onAcquire={handleAcquireClick} cooldownRemaining={cooldownRemaining} formatCooldown={formatCooldown} />
                )}
              />
            </TabsContent>
            <TabsContent value="mine" className="flex-1 mt-0 min-h-0">
              <PaginatedLeadColumn
                title="Meus Leads"
                dotColor="bg-blue-500"
                items={myLeads}
                emptyMessage="Você ainda não adquiriu nenhum lead."
                renderItem={(lead) => (
                  <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} isOwned onRelease={releaseLead} />
                )}
              />
            </TabsContent>
            <TabsContent value="lost" className="flex-1 mt-0 min-h-0">
              <PaginatedLeadColumn
                title="Oportunidade Perdida"
                dotColor="bg-red-500"
                items={acquiredLeads}
                emptyMessage="Nenhuma oportunidade perdida no momento."
                renderItem={(lead) => (
                  <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} onRelease={releaseLead} />
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden lg:grid grid-cols-3 gap-6 h-full">
          <PaginatedLeadColumn
            title="Leads Disponíveis"
            dotColor="bg-green-500"
            items={filteredAvailable}
            emptyMessage="Nenhum lead disponível no momento."
            renderItem={(lead) => (
              <AvailableLeadCard key={lead.id} lead={lead} onAcquire={handleAcquireClick} cooldownRemaining={cooldownRemaining} formatCooldown={formatCooldown} />
            )}
          />
          <PaginatedLeadColumn
            title="Meus Leads"
            dotColor="bg-blue-500"
            items={myLeads}
            emptyMessage="Você ainda não adquiriu nenhum lead."
            renderItem={(lead) => (
              <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} isOwned onRelease={releaseLead} />
            )}
          />
          <PaginatedLeadColumn
            title="Oportunidade Perdida"
            dotColor="bg-red-500"
            items={acquiredLeads}
            emptyMessage="Nenhuma oportunidade perdida no momento."
            renderItem={(lead) => (
              <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} onRelease={releaseLead} />
            )}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ConfettiEffect active={showConfetti} />

      <LeadAcquireDialog
        lead={selectedLead}
        open={isAcquireOpen}
        onOpenChange={setIsAcquireOpen}
        onConfirm={handleAcquireConfirm}
        settings={settings}
        generateWhatsAppUrl={generateWhatsAppUrl}
      />

      <LeadImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={importLeads}
      />

      {/* Settings dialog - voluntary */}
      <LicenseeSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSave={saveSettings}
      />

      {/* Settings dialog - required (before first acquire) */}
      <LicenseeSettingsDialog
        open={showSettingsRequired}
        onOpenChange={setShowSettingsRequired}
        settings={settings}
        onSave={handleSettingsSaved}
        required
      />
    </div>
  );
}
