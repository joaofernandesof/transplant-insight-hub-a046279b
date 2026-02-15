import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfettiEffect } from '@/components/hotleads/ConfettiEffect';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Flame, RefreshCw, Loader2, Upload, Settings, Unlock, BarChart3, Home, LayoutGrid, List } from 'lucide-react';
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
  LeadListRow,
} from '@/components/hotleads';
import { LicenseeSettingsDialog } from '@/components/hotleads/LicenseeSettingsDialog';
import { AdminManualReleaseDialog } from '@/components/hotleads/AdminManualReleaseDialog';
import { HotLeadsStats } from '@/components/hotleads/HotLeadsStats';
import { HotLeadsAdminDashboard } from '@/components/hotleads/HotLeadsAdminDashboard';
import type { HotLead } from '@/hooks/useHotLeads';

const ITEMS_PER_PAGE = 10;

interface HotLeadsProps {
  initialView?: 'marketplace' | 'dashboard' | 'settings';
}

export default function HotLeads({ initialView = 'marketplace' }: HotLeadsProps) {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const {
    leads,
    availableLeads,
    myLeads,
    acquiredLeads,
    queuedCount,
    isLoading,
    isRefreshing,
    fetchLeads,
    acquireLead,
    releaseLead,
    importLeads,
    getClaimerName,
    updateLeadOutcome,
    overdueLeads,
    isBlocked,
    profiles,
    hotleadsProfiles,
  } = useHotLeads();
  const { settings, isLoading: settingsLoading, saveSettings, generateWhatsAppUrl } = useHotLeadsSettings();

  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [isAcquireOpen, setIsAcquireOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialView === 'settings');
  const [showSettingsRequired, setShowSettingsRequired] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isManualReleaseOpen, setIsManualReleaseOpen] = useState(false);
  const adminView = initialView === 'dashboard' ? 'dashboard' : 'marketplace';

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
  const [userFilter, setUserFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'available' | 'mine' | 'lost'>('available');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [activePage, setActivePage] = useState(1);

  // Available states for filter
  const availableStates = useMemo(() => {
    return [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];
  }, [leads]);

  // Available cities (filtered by selected state)
  const availableCities = useMemo(() => {
    const filtered = stateFilter !== 'all' ? leads.filter(l => l.state === stateFilter) : leads;
    return [...new Set(filtered.map(l => l.city).filter(Boolean))] as string[];
  }, [leads, stateFilter]);

  // Available users for admin filter - only those with hotleads portal access
  const availableUsers = useMemo(() => {
    return Object.entries(hotleadsProfiles).map(([id, name]) => ({ id, name: name as string }));
  }, [hotleadsProfiles]);

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
      if (userFilter !== 'all' && lead.claimed_by !== userFilter) return false;
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
  }, [leads, searchTerm, stateFilter, cityFilter, periodFilter, sortBy, userFilter]);

  // Filtered subsets
  const filteredAvailable = useMemo(() => 
    filteredLeads.filter(l => !l.claimed_by && l.release_status === 'available'), [filteredLeads]);
  
  const filteredMyLeads = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by === user?.id), [filteredLeads, user?.id]);
  
  const filteredAcquired = useMemo(() => 
    filteredLeads.filter(l => !!l.claimed_by && l.claimed_by !== user?.id), [filteredLeads, user?.id]);

  // Pagination for active tab
  const activeItems = useMemo(() => {
    if (activeTab === 'available') return filteredAvailable;
    if (activeTab === 'mine') return filteredMyLeads;
    return filteredAcquired;
  }, [activeTab, filteredAvailable, filteredMyLeads, filteredAcquired]);

  const activeTotal = activeItems.length;
  const activeTotalPages = Math.max(1, Math.ceil(activeTotal / ITEMS_PER_PAGE));
  const paginatedActive = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return activeItems.slice(start, start + ITEMS_PER_PAGE);
  }, [activeItems, activePage]);

  // Reset page and selection when tab or filters change
  useEffect(() => { setActivePage(1); setSelectedLeads(new Set()); }, [activeTab, searchTerm, stateFilter, cityFilter, periodFilter, sortBy, userFilter]);

  const toggleLeadSelection = useCallback((id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleAcquireClick = (lead: HotLead) => {
    if (isBlocked) {
      toast.error('Você precisa informar o destino dos seus leads pendentes antes de adquirir novos.');
      setActiveTab('mine');
      return;
    }
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
    <div className="flex-1 flex flex-col bg-background h-[calc(100dvh-52px)] lg:h-dvh overflow-y-auto">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-orange-600 to-red-600 sticky top-0 z-20 hidden lg:block">
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
                  <Button
                    variant={adminView === 'marketplace' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => navigate('/hotleads')}
                  >
                    <Home className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Início</span>
                  </Button>
                  <Button
                    variant={adminView === 'dashboard' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => navigate('/hotleads/dashboard')}
                  >
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Painel</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsManualReleaseOpen(true)}>
                    <Unlock className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Liberar</span>
                  </Button>
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
      <div className="shrink-0 px-3 lg:px-4 py-2 lg:py-3 space-y-2 lg:space-y-3">
        {/* Mobile action buttons - moved out of red header */}
        <div className="flex items-center gap-1.5 flex-wrap lg:hidden">
          {isAdmin && (
            <>
              <Button
                variant={adminView === 'marketplace' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => navigate('/hotleads')}
              >
                <Home className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Início</span>
              </Button>
              <Button
                variant={adminView === 'dashboard' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => navigate('/hotleads/dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Painel</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsManualReleaseOpen(true)}>
                <Unlock className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Liberar</span>
              </Button>
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

        {/* Admin Dashboard View */}
        {isAdmin && adminView === 'dashboard' ? (
          <div className="mt-2">
            <HotLeadsAdminDashboard />
          </div>
        ) : (
          <>
            <HotLeadsStats
              leads={filteredLeads}
              availableCount={filteredAvailable.length}
              myLeadsCount={filteredMyLeads.length}
              acquiredCount={filteredAcquired.length}
              queuedCount={queuedCount}
            />
            {/* Motivational phrase */}
            <div className="relative text-center py-3 px-4 sm:py-4 sm:px-6 my-2 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-200/60 dark:border-orange-800/40 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400/5 via-transparent to-transparent" />
              <p className="relative text-sm sm:text-lg lg:text-2xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text text-transparent tracking-tight">
                🔥 Cada lead é um paciente buscando transformação
              </p>
            </div>


            <NextLeadReleaseBanner onLeadReleased={() => fetchLeads(true)} />
          </>
        )}
      </div>

      {/* Toggle + Grid layout */}
      {(!isAdmin || adminView === 'marketplace') && (
        <div className="flex-1 px-3 lg:px-4 pb-4">
          {/* Blocking banner when overdue leads exist */}
          {isBlocked && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                  Você possui {overdueLeads.length} {overdueLeads.length === 1 ? 'lead' : 'leads'} sem destino definido
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Informe se o lead foi <strong>Vendido</strong>, está <strong>Em Atendimento</strong> ou foi <strong>Descartado</strong> para desbloquear a aquisição de novos leads.
                </p>
                <button
                  onClick={() => setActiveTab('mine')}
                  className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900"
                >
                  Ver meus leads pendentes →
                </button>
              </div>
            </div>
          )}

          {/* Pill toggle buttons + filters - sticky */}
          <div className="flex flex-wrap items-center gap-2 mb-4 sticky top-0 z-10 bg-background py-3 -mx-3 px-3 lg:-mx-4 lg:px-4 border-b border-border/40">
            {[
              { key: 'available', label: 'Disponíveis', count: filteredAvailable.length, color: 'bg-green-500' },
              { key: 'mine', label: 'Meus Leads', count: filteredMyLeads.length, color: 'bg-blue-500', alert: overdueLeads.length > 0 },
              { key: 'lost', label: 'Perdidos', count: filteredAcquired.length, color: 'bg-red-500' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'available' | 'mine' | 'lost')}
                className={`
                  relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0
                  ${activeTab === tab.key
                    ? 'bg-orange-600 text-white shadow-md scale-[1.02]'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                `}
              >
                <span className={`h-2 w-2 rounded-full ${tab.color}`} />
                {tab.label}
                <span className={`
                  ml-1 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-background text-foreground'}
                `}>
                  {tab.count}
                </span>
                {'alert' in tab && tab.alert && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 border-2 border-background animate-pulse" />
                )}
              </button>
            ))}

            {/* Spacer to push filters right */}
            <div className="flex-1" />

            {/* Inline filters (right-aligned) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
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
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                availableUsers={availableUsers}
                isAdmin={isAdmin}
                inline
              />
            </div>
            {/* Mobile filters below */}
            <div className="sm:hidden w-full">
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
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                availableUsers={availableUsers}
                isAdmin={isAdmin}
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 transition-colors ${viewMode === 'cards' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
                title="Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selection count */}
          {selectedLeads.size > 0 && (
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedLeads.size}</span> selecionado{selectedLeads.size > 1 ? 's' : ''}
              <button onClick={() => setSelectedLeads(new Set())} className="text-xs underline text-primary hover:text-primary/80">Limpar</button>
            </div>
          )}

          {/* Card grid or List view */}
          {viewMode === 'cards' ? (
            <>
              {activeTab === 'available' && (
                filteredAvailable.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Nenhum lead disponível no momento.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {paginatedActive.map((lead) => (
                      <AvailableLeadCard key={lead.id} lead={lead} onAcquire={handleAcquireClick} cooldownRemaining={cooldownRemaining} formatCooldown={formatCooldown} selected={selectedLeads.has(lead.id)} onSelect={toggleLeadSelection} />
                    ))}
                  </div>
                )
              )}
              {activeTab === 'mine' && (
                filteredMyLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Você ainda não adquiriu nenhum lead.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {paginatedActive.map((lead) => (
                      <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} isOwned onRelease={releaseLead} onUpdateOutcome={updateLeadOutcome} selected={selectedLeads.has(lead.id)} onSelect={toggleLeadSelection} />
                    ))}
                  </div>
                )
              )}
              {activeTab === 'lost' && (
                filteredAcquired.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Nenhuma oportunidade perdida no momento.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {paginatedActive.map((lead) => (
                      <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} onRelease={releaseLead} selected={selectedLeads.has(lead.id)} onSelect={toggleLeadSelection} />
                    ))}
                  </div>
                )
              )}
            </>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {paginatedActive.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhum lead encontrado.</p>
              ) : (
                paginatedActive.map((lead) => (
                  <LeadListRow
                    key={lead.id}
                    lead={lead}
                    variant={activeTab}
                    selected={selectedLeads.has(lead.id)}
                    onSelect={toggleLeadSelection}
                    onAcquire={activeTab === 'available' ? handleAcquireClick : undefined}
                    cooldownRemaining={activeTab === 'available' ? cooldownRemaining : undefined}
                    formatCooldown={activeTab === 'available' ? formatCooldown : undefined}
                    claimerName={activeTab === 'lost' ? getClaimerName(lead.claimed_by) : undefined}
                    onRelease={releaseLead}
                    onUpdateOutcome={activeTab === 'mine' ? updateLeadOutcome : undefined}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {activeTotal > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => setActivePage(p => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="px-3 py-1.5 text-sm rounded-md border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                {activePage} de {activeTotalPages}
              </span>
              <button
                onClick={() => setActivePage(p => Math.min(activeTotalPages, p + 1))}
                disabled={activePage === activeTotalPages}
                className="px-3 py-1.5 text-sm rounded-md border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Admin manual release dialog */}
      {isAdmin && (
        <AdminManualReleaseDialog
          open={isManualReleaseOpen}
          onOpenChange={setIsManualReleaseOpen}
          onLeadReleased={() => fetchLeads(true)}
        />
      )}
    </div>
  );
}
