import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfettiEffect } from '@/components/hotleads/ConfettiEffect';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Button } from '@/components/ui/button';
import { Flame, RefreshCw, Loader2, Upload, Settings, Unlock, BarChart3, Home, LayoutGrid, List, FlaskConical, Eye, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useHotLeads } from '@/hooks/useHotLeads';
import { useLeadNotificationSound } from '@/hooks/useLeadNotificationSound';
import { useGamification } from '@/hooks/useGamification';
import { useHotLeadsSettings } from '@/hooks/useHotLeadsSettings';
import { useHotLeadsRadiusSetting } from '@/hooks/useHotLeadsRadiusSetting';
import { haversineKm } from '@/utils/haversine';
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
import { BulkActionsBar } from '@/components/hotleads/BulkActionsBar';
import { AdminManualReleaseDialog } from '@/components/hotleads/AdminManualReleaseDialog';
import { HotLeadsStats } from '@/components/hotleads/HotLeadsStats';
import { HotLeadsAdminDashboard } from '@/components/hotleads/HotLeadsAdminDashboard';
import { AdminTestLeadDialog } from '@/components/hotleads/AdminTestLeadDialog';
import { OverdueLeadsPopup } from '@/components/hotleads/OverdueLeadsPopup';
import { SaleFormDialog } from '@/components/hotleads/SaleFormDialog';
import { DiscardFormDialog } from '@/components/hotleads/DiscardFormDialog';
import { SaleCelebrationPopup } from '@/components/hotleads/SaleCelebrationPopup';
import { HotLeadsAdminRadiusSettings } from '@/components/hotleads/HotLeadsAdminRadiusSettings';

import type { HotLead, LeadTab } from '@/hooks/useHotLeads';
import { CompleteProfileGate } from '@/components/hotleads/CompleteProfileGate';
import { PendingSalesGate } from '@/components/hotleads/PendingSalesGate';

const ITEMS_PER_PAGE = 10;

interface HotLeadsProps {
  initialView?: 'marketplace' | 'dashboard' | 'settings';
}

// Emails com permissão de criar leads de teste (além de admins)
const TEST_BUTTON_ALLOWED_EMAILS = ['nicholas.barreto@neofolic.com.br'];

export default function HotLeads({ initialView = 'marketplace' }: HotLeadsProps) {
  const { isAdmin: realIsAdmin, user } = useAuth();
  const { activeProfile } = useUnifiedAuth();
  // Respect profile simulation: if admin is simulating another profile, hide admin UI
  const isAdmin = realIsAdmin && (!activeProfile || activeProfile === 'administrador');
  const canCreateTestLeads = isAdmin || TEST_BUTTON_ALLOWED_EMAILS.includes(user?.email || '');
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
  const { radiusKm } = useHotLeadsRadiusSetting();
  const { awardPoints } = useGamification();

  // Wrapper to clear "new leads" flag when manually refreshing
  const handleRefresh = useCallback(() => {
    setHasNewLeads(false);
    fetchLeads(true);
  }, [fetchLeads]);

  // Listen for focus-available custom event
  useEffect(() => {
    const handler = () => setActiveTab('available');
    window.addEventListener('hotlead:focus-available', handler);
    return () => window.removeEventListener('hotlead:focus-available', handler);
  }, []);

  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [isAcquireOpen, setIsAcquireOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialView === 'settings');

  useEffect(() => {
    if (initialView === 'settings' && !isAdmin) {
      setIsSettingsOpen(true);
    }
  }, [initialView, isAdmin]);
  const [showSettingsRequired, setShowSettingsRequired] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isManualReleaseOpen, setIsManualReleaseOpen] = useState(false);
  const [isTestLeadOpen, setIsTestLeadOpen] = useState(false);
  const [isOverduePopupOpen, setIsOverduePopupOpen] = useState(false);
  const [hasNewLeads, setHasNewLeads] = useState(false);
  const adminView = initialView === 'dashboard' ? 'dashboard' : 'marketplace';

  // Admin user simulation
  const [simulatedUserId, setSimulatedUserId] = useState<string>('');
  const [simulatedUserList, setSimulatedUserList] = useState<{ user_id: string; full_name: string; email: string; avatar_url: string | null; address_state: string | null; latitude: number | null; longitude: number | null }[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchLicensees() {
      const { data } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email, avatar_url, address_state, latitude, longitude, neohub_user_profiles!inner(profile, is_active)')
        .eq('neohub_user_profiles.profile', 'licenciado')
        .eq('neohub_user_profiles.is_active', true)
        .eq('is_active', true)
        .order('full_name');
      setSimulatedUserList((data || []).map((u: any) => ({
        user_id: u.user_id,
        full_name: u.full_name || u.email,
        email: u.email,
        avatar_url: u.avatar_url,
        address_state: u.address_state,
        latitude: u.latitude,
        longitude: u.longitude,
      })));
    }
    fetchLicensees();
  }, [isAdmin]);

  const simulatedUser = simulatedUserList.find(u => u.user_id === simulatedUserId);
  // Effective user id/state for filtering (simulated or real)
  const effectiveUserId = simulatedUserId || user?.id;
  const effectiveUserState = simulatedUserId ? (simulatedUser?.address_state || null) : (user?.state || null);
  // Admin is viewing as admin (not simulating a specific user)
  const isAdminDirectView = realIsAdmin && !simulatedUserId;

  // Fetch current user's coordinates for radius filtering
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    async function fetchCoords() {
      const { data } = await supabase
        .from('neohub_users')
        .select('latitude, longitude')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (data?.latitude && data?.longitude) {
        setUserCoords({ lat: data.latitude as number, lng: data.longitude as number });
      }
    }
    fetchCoords();
  }, [user?.id]);

  // Effective coordinates for filtering (simulated user or real user)
  const effectiveCoords = useMemo(() => {
    if (simulatedUserId && simulatedUser) {
      return simulatedUser.latitude && simulatedUser.longitude
        ? { lat: simulatedUser.latitude, lng: simulatedUser.longitude }
        : null;
    }
    return userCoords;
  }, [simulatedUserId, simulatedUser, userCoords]);

  // Sound + browser notification for new leads - DON'T auto-fetch, just flag
  useLeadNotificationSound({
    onNewLead: () => setHasNewLeads(true),
    enabled: adminView === 'marketplace',
  });

  const COOLDOWN_SECONDS = 300;
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`hotleads_cooldown_${user?.id}`);
    if (stored) {
      const expiresAt = parseInt(stored, 10);
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      if (remaining > 0) setCooldownRemaining(remaining);
      else localStorage.removeItem(`hotleads_cooldown_${user?.id}`);
    }
  }, [user?.id]);

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
      
      // Gamification: award points for acquiring lead
      awardPoints('lead_acquired', leadId);
      
      // Check if fast response (within 5 min of release)
      const lead = availableLeads.find(l => l.id === leadId);
      if (lead?.available_at) {
        const releaseTime = new Date(lead.available_at).getTime();
        const now = Date.now();
        if (now - releaseTime < 5 * 60 * 1000) {
          awardPoints('fast_response', leadId);
        }
      }
    }
    return success;
  }, [acquireLead, startCooldown, awardPoints, availableLeads]);

  // Wrap updateLeadOutcome to award gamification points
  // Sale form dialog state
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [saleFormLeadId, setSaleFormLeadId] = useState<string | null>(null);
  const saleFormLead = useMemo(() => leads.find(l => l.id === saleFormLeadId), [leads, saleFormLeadId]);

  // Discard form dialog state
  const [discardFormOpen, setDiscardFormOpen] = useState(false);
  const [discardFormLeadId, setDiscardFormLeadId] = useState<string | null>(null);
  const discardFormLead = useMemo(() => leads.find(l => l.id === discardFormLeadId), [leads, discardFormLeadId]);

  const handleUpdateOutcome = useCallback(async (leadId: string, outcome: any): Promise<boolean> => {
    // If marking as "vendido", show sale form first
    if (outcome === 'vendido') {
      setSaleFormLeadId(leadId);
      setSaleFormOpen(true);
      return true;
    }
    // If marking as "descartado", show discard form first
    if (outcome === 'descartado') {
      setDiscardFormLeadId(leadId);
      setDiscardFormOpen(true);
      return true;
    }
    const success = await updateLeadOutcome(leadId, outcome);
    if (success) {
      if (outcome === 'em_atendimento') {
        awardPoints('lead_in_service', leadId);
      }
    }
    return success;
  }, [updateLeadOutcome, awardPoints]);

  const handleSaleConfirm = useCallback(async (procedure: string, value: number) => {
    if (!saleFormLeadId) return;
    const lead = leads.find(l => l.id === saleFormLeadId);
    
    // Update outcome + sale details
    const success = await updateLeadOutcome(saleFormLeadId, 'vendido');
    if (success) {
      // Save sale details
      await supabase.from('leads').update({ sold_procedure: procedure, sold_value: value } as any).eq('id', saleFormLeadId);
      awardPoints('lead_sold', saleFormLeadId);
      
      // Insert sale notification for admin celebration popup
      const claimerName = lead?.claimed_by ? getClaimerName(lead.claimed_by) : null;
      await supabase.from('hotlead_sale_notifications' as any).insert({
        lead_id: saleFormLeadId,
        lead_name: lead?.name || 'Lead',
        licensee_name: claimerName,
        procedure_name: procedure,
        sale_value: value,
      });

      // Send email notification
      try {
        await supabase.functions.invoke('notify-hotlead-event', {
          body: {
            event_type: 'lead_sold',
            lead_name: lead?.name || 'Lead',
            lead_phone: lead?.phone || '',
            lead_city: lead?.city,
            lead_state: lead?.state,
            licensee_name: claimerName,
            converted_value: value,
            procedures_sold: [procedure],
          },
        });
      } catch (e) {
        console.error('Failed to send sale notification email:', e);
      }
    }
    setSaleFormOpen(false);
    setSaleFormLeadId(null);
  }, [saleFormLeadId, leads, updateLeadOutcome, awardPoints, getClaimerName]);

  const handleDiscardConfirm = useCallback(async (reason: string) => {
    if (!discardFormLeadId) return;
    const success = await updateLeadOutcome(discardFormLeadId, 'descartado');
    if (success) {
      await supabase.from('leads').update({ discard_reason: reason } as any).eq('id', discardFormLeadId);
    }
    setDiscardFormOpen(false);
    setDiscardFormLeadId(null);
  }, [discardFormLeadId, updateLeadOutcome]);

  // Global filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [userFilter, setUserFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<LeadTab>('available');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [activePage, setActivePage] = useState(1);

  const availableStates = useMemo(() => {
    return [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];
  }, [leads]);

  const availableCities = useMemo(() => {
    const filtered = stateFilter !== 'all' ? leads.filter(l => l.state === stateFilter) : leads;
    return [...new Set(filtered.map(l => l.city).filter(Boolean))] as string[];
  }, [leads, stateFilter]);

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

  // ── Tab subsets ──
  // Disponíveis: filter by radius (Haversine) when coordinates are available, fallback to state
  const filteredAvailable = useMemo(() => {
    const base = filteredLeads.filter(l => !l.claimed_by && l.release_status === 'available');
    if (realIsAdmin && !simulatedUserId) return base; // Admin real sempre vê todos

    const coords = effectiveCoords;
    const state = effectiveUserState;

    if (!coords && !state) return [];

    return base.filter(l => {
      // If both have coordinates, use Haversine radius
      if (coords && l.latitude && l.longitude) {
        const dist = haversineKm(coords.lat, coords.lng, l.latitude, l.longitude);
        return dist <= radiusKm;
      }
      // Fallback: same state
      if (state) {
        return !l.state || l.state === state;
      }
      return false;
    });
  }, [filteredLeads, realIsAdmin, simulatedUserId, effectiveCoords, effectiveUserState, radiusKm]);
  
  // Adquiridos: admin sees ALL claimed with no outcome; user sees only their own
  const filteredAcquired = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by && !l.lead_outcome && (isAdminDirectView || l.claimed_by === effectiveUserId)), [filteredLeads, effectiveUserId, isAdminDirectView]);
  
  // Em Atendimento
  const filteredInProgress = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by && l.lead_outcome === 'em_atendimento' && (isAdminDirectView || l.claimed_by === effectiveUserId)), [filteredLeads, effectiveUserId, isAdminDirectView]);
  
  // Vendido
  const filteredSold = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by && l.lead_outcome === 'vendido' && (isAdminDirectView || l.claimed_by === effectiveUserId)), [filteredLeads, effectiveUserId, isAdminDirectView]);
  
  // Descartado
  const filteredDiscarded = useMemo(() => 
    filteredLeads.filter(l => l.claimed_by && l.lead_outcome === 'descartado' && (isAdminDirectView || l.claimed_by === effectiveUserId)), [filteredLeads, effectiveUserId, isAdminDirectView]);
  
  // Indisponível: only for non-admin or simulated view — claimed by OTHER users
  const filteredUnavailable = useMemo(() => 
    isAdminDirectView ? [] : filteredLeads.filter(l => !!l.claimed_by && l.claimed_by !== effectiveUserId), [filteredLeads, effectiveUserId, isAdminDirectView]);

  // Tab definitions
  const TAB_CONFIG: { key: LeadTab; label: string; color: string; alert?: boolean }[] = [
    { key: 'available', label: 'Disponíveis', color: 'bg-green-500' },
    { key: 'acquired', label: isAdminDirectView ? 'Sem Desfecho' : 'Adquiridos', color: 'bg-blue-500', alert: overdueLeads.some(l => !l.lead_outcome) },
    { key: 'in_progress', label: 'Em Atendimento', color: 'bg-amber-500', alert: overdueLeads.some(l => l.lead_outcome === 'em_atendimento') },
    { key: 'sold', label: 'Vendido', color: 'bg-emerald-500' },
    { key: 'discarded', label: 'Descartado', color: 'bg-red-500' },
    ...(!isAdminDirectView ? [{ key: 'unavailable' as LeadTab, label: 'Indisponível', color: 'bg-slate-400' }] : []),
  ];

  const getTabCount = (key: LeadTab) => {
    switch (key) {
      case 'available': return filteredAvailable.length;
      case 'acquired': return filteredAcquired.length;
      case 'in_progress': return filteredInProgress.length;
      case 'sold': return filteredSold.length;
      case 'discarded': return filteredDiscarded.length;
      case 'unavailable': return filteredUnavailable.length;
    }
  };

  const activeItems = useMemo(() => {
    switch (activeTab) {
      case 'available': return filteredAvailable;
      case 'acquired': return filteredAcquired;
      case 'in_progress': return filteredInProgress;
      case 'sold': return filteredSold;
      case 'discarded': return filteredDiscarded;
      case 'unavailable': return filteredUnavailable;
    }
  }, [activeTab, filteredAvailable, filteredAcquired, filteredInProgress, filteredSold, filteredDiscarded, filteredUnavailable]);

  const activeTotal = activeItems.length;
  const activeTotalPages = Math.max(1, Math.ceil(activeTotal / ITEMS_PER_PAGE));
  const paginatedActive = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return activeItems.slice(start, start + ITEMS_PER_PAGE);
  }, [activeItems, activePage]);

  useEffect(() => { setActivePage(1); setSelectedLeads(new Set()); }, [activeTab, searchTerm, stateFilter, cityFilter, periodFilter, sortBy, userFilter]);

  const toggleLeadSelection = useCallback((id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedLeads(new Set(activeItems.map(l => l.id)));
  }, [activeItems]);

  const handleAcquireClick = (lead: HotLead) => {
    if (isBlocked) {
      toast.error('Você precisa atualizar o status dos seus leads pendentes antes de adquirir novos.');
      // Navigate to the tab with overdue leads
      if (overdueLeads.some(l => !l.lead_outcome)) {
        setActiveTab('acquired');
      } else {
        setActiveTab('in_progress');
      }
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
      setTimeout(() => setIsAcquireOpen(true), 300);
    }
    return success;
  };

  // Determine which card component to render per lead
  const isOwnedTab = activeTab === 'acquired' || activeTab === 'in_progress' || activeTab === 'sold' || activeTab === 'discarded';
  const showOutcomeActions = activeTab === 'acquired' || activeTab === 'in_progress' || activeTab === 'sold' || activeTab === 'discarded';

  // Map tab to LeadListRow variant
  const getListRowVariant = (): 'available' | 'mine' | 'lost' => {
    if (activeTab === 'available') return 'available';
    if (activeTab === 'unavailable') return 'lost';
    return 'mine';
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'available': return 'Nenhum lead disponível no momento.';
      case 'acquired': return 'Nenhum lead adquirido aguardando atendimento.';
      case 'in_progress': return 'Nenhum lead em atendimento.';
      case 'sold': return 'Nenhum lead vendido ainda.';
      case 'discarded': return 'Nenhum lead descartado.';
      case 'unavailable': return 'Nenhum lead indisponível no momento.';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <CompleteProfileGate>
    <PendingSalesGate>
    <div className="flex-1 flex flex-col bg-background h-[calc(100dvh-52px)] lg:h-dvh overflow-y-auto">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-orange-600 to-red-600 lg:sticky lg:top-0 z-20 hidden lg:block">
        <div className="px-3 lg:px-4 py-2 lg:py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2 text-white">
              <Flame className="h-5 w-5 lg:h-6 lg:w-6 text-white/80" />
              HotLeads
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
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
              {canCreateTestLeads && (
                <Button variant="outline" size="sm" onClick={() => setIsTestLeadOpen(true)}>
                  <FlaskConical className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Teste</span>
                </Button>
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
                variant={hasNewLeads ? "default" : "outline"}
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={hasNewLeads ? 'animate-pulse bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : ''}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{hasNewLeads ? 'Novos leads!' : 'Atualizar'}</span>
                {hasNewLeads && <span className="sm:hidden">!</span>}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed top section */}
      <div className="shrink-0 px-3 lg:px-4 py-2 lg:py-3 space-y-2 lg:space-y-3">
        {/* Mobile action buttons - normal flow, not sticky */}
        <div className="flex items-center gap-1.5 flex-wrap lg:hidden">
          {isAdmin && (
            <>
              <Button variant={adminView === 'marketplace' ? 'secondary' : 'outline'} size="sm" onClick={() => navigate('/hotleads')}>
                <Home className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Início</span>
              </Button>
              <Button variant={adminView === 'dashboard' ? 'secondary' : 'outline'} size="sm" onClick={() => navigate('/hotleads/dashboard')}>
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
          {canCreateTestLeads && (
            <Button variant="outline" size="sm" onClick={() => setIsTestLeadOpen(true)}>
              <FlaskConical className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Teste</span>
            </Button>
          )}
          {!isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Config</span>
            </Button>
          )}
          <Button
            variant={hasNewLeads ? "default" : "outline"}
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={hasNewLeads ? 'animate-pulse bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{hasNewLeads ? 'Novos leads!' : 'Atualizar'}</span>
            {hasNewLeads && <span className="sm:hidden">!</span>}
          </Button>
        </div>

        {/* Dashboard Views */}
        {isAdmin && adminView === 'dashboard' ? (
          <div className="mt-2">
            <HotLeadsAdminDashboard />
          </div>
        ) : isAdmin && initialView === 'settings' ? (
          <div className="mt-2">
            <h2 className="text-lg font-bold mb-4">Configurações do HotLeads</h2>
            <HotLeadsAdminRadiusSettings />
          </div>
        ) : (
          <>
            {/* Admin User Simulation Selector */}
            {isAdmin && adminView === 'marketplace' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 shrink-0">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Visualizar como:</span>
                </div>
                <Select value={simulatedUserId || '__admin__'} onValueChange={(v) => setSimulatedUserId(v === '__admin__' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs w-full max-w-xs">
                    <SelectValue placeholder="Administrador (você)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__admin__">
                      <span className="font-medium">Administrador (visão padrão)</span>
                    </SelectItem>
                    {simulatedUserList.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{u.full_name}</span>
                          {u.address_state && (
                            <Badge variant="outline" className="text-[10px] shrink-0">{u.address_state}</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {simulatedUserId && simulatedUser && (
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={simulatedUser.avatar_url || ''} />
                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                          {simulatedUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-primary">{simulatedUser.full_name.split(' ')[0]}</span>
                      {simulatedUser.address_state && (
                        <span className="text-[10px] text-muted-foreground">({simulatedUser.address_state})</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSimulatedUserId('')}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <HotLeadsStats
              leads={filteredLeads}
              availableCount={filteredAvailable.length}
              myLeadsCount={isAdminDirectView ? (filteredAcquired.length + filteredInProgress.length + filteredSold.length + filteredDiscarded.length) : (filteredAcquired.length + filteredInProgress.length)}
              acquiredCount={isAdminDirectView ? 0 : filteredUnavailable.length}
              queuedCount={queuedCount}
              isAdminView={isAdminDirectView}
            />
            {/* Motivational phrase */}
            <div className="relative text-center py-3 px-4 sm:py-4 sm:px-6 my-2 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-200/60 dark:border-orange-800/40 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400/5 via-transparent to-transparent" />
              <p className="relative text-sm sm:text-lg lg:text-2xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text text-transparent tracking-tight">
                🔥 Cada lead é um paciente buscando transformação
              </p>
            </div>

            <NextLeadReleaseBanner onLeadReleased={() => setHasNewLeads(true)} />
          </>
        )}
      </div>

      {/* Toggle + Grid layout */}
      {adminView === 'marketplace' && (
        <div className="flex-1 px-3 lg:px-4 pb-4">
          {/* Blocking banner when overdue leads exist */}
          {isBlocked && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                  Você possui {overdueLeads.length} {overdueLeads.length === 1 ? 'lead' : 'leads'} sem atualização há mais de 7 dias
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Atualize o status para desbloquear novas aquisições. Toque abaixo para ver os detalhes:
                </p>
                {/* Show first 3 overdue lead names inline */}
                <div className="mt-2 space-y-1">
                  {overdueLeads.slice(0, 3).map(lead => (
                    <div key={lead.id} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-medium truncate max-w-[200px]">• {lead.name}</span>
                      <span className="text-amber-500 dark:text-amber-400">
                        ({!lead.lead_outcome ? 'Sem desfecho' : 'Atualizar atendimento'})
                      </span>
                    </div>
                  ))}
                  {overdueLeads.length > 3 && (
                    <p className="text-[11px] text-amber-500">...e mais {overdueLeads.length - 3}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                    onClick={() => setIsOverduePopupOpen(true)}
                  >
                    Ver todos os detalhes →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Radius restriction banner for non-admin users */}
          {!isAdmin && (user?.state || userCoords) && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-sm">📍</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {userCoords
                  ? <>Exibindo leads num raio de <strong>{radiusKm} km</strong> da sua localização.</>
                  : <>Exibindo apenas leads do estado <strong>{user?.state}</strong>. Para filtro por raio, atualize suas coordenadas.</>
                }
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4 sticky top-0 z-10 bg-background py-3 -mx-3 px-3 lg:-mx-4 lg:px-4 border-b border-border/40">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-0 w-full rounded-xl overflow-hidden border border-border shadow-sm">
              {TAB_CONFIG.map((tab, index) => {
                const isActive = activeTab === tab.key;
                const count = getTabCount(tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      relative flex items-center justify-center gap-1.5 px-2 py-3 text-xs sm:text-sm font-semibold transition-all
                      ${index > 0 ? 'border-l border-border/50' : ''}
                      ${isActive
                        ? 'bg-orange-600 text-white shadow-inner'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isActive ? 'ring-2 ring-white/40' : ''} ${tab.color}`} />
                    <span className="hidden sm:inline truncate">{tab.label}</span>
                    <span className="sm:hidden truncate">{tab.label.length > 8 ? tab.label.slice(0, 6) + '…' : tab.label}</span>
                    <span className={`
                      ml-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px]
                      ${isActive ? 'bg-white/25 text-white' : 'bg-background text-foreground'}
                    `}>
                      {count}
                    </span>
                    {tab.alert && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-background animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Inline filters */}
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

              {/* View toggle - desktop only */}
              <div className="hidden lg:flex items-center border rounded-lg overflow-hidden shrink-0">
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
          </div>

          {/* Bulk actions bar */}
          <BulkActionsBar
            selectedLeads={selectedLeads}
            allLeads={leads}
            activeTab={activeTab}
            activeItems={activeItems}
            onClearSelection={() => setSelectedLeads(new Set())}
            onSelectAll={selectAllVisible}
            onRelease={releaseLead}
            onUpdateOutcome={handleUpdateOutcome}
            getClaimerName={getClaimerName}
          />

          {/* Card grid or List view */}
          {viewMode === 'cards' ? (
            <>
              {activeItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">{getEmptyMessage()}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedActive.map((lead) => {
                    if (activeTab === 'available') {
                      return <AvailableLeadCard key={lead.id} lead={lead} onAcquire={handleAcquireClick} cooldownRemaining={cooldownRemaining} formatCooldown={formatCooldown} selected={selectedLeads.has(lead.id)} onSelect={toggleLeadSelection} />;
                    }
                    if (activeTab === 'unavailable') {
                      return <AcquiredLeadCard key={lead.id} lead={lead} claimerName={getClaimerName(lead.claimed_by)} onRelease={releaseLead} selected={selectedLeads.has(lead.id)} onSelect={toggleLeadSelection} />;
                    }
                    // Owned tabs: acquired, in_progress, sold, discarded
                    return (
                      <AcquiredLeadCard
                        key={lead.id}
                        lead={lead}
                        claimerName={getClaimerName(lead.claimed_by)}
                        isOwned={!isAdminDirectView || lead.claimed_by === effectiveUserId}
                        onRelease={releaseLead}
                        onUpdateOutcome={showOutcomeActions ? handleUpdateOutcome : undefined}
                        selected={selectedLeads.has(lead.id)}
                        onSelect={toggleLeadSelection}
                      />
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {paginatedActive.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">{getEmptyMessage()}</p>
              ) : (
                paginatedActive.map((lead) => (
                  <LeadListRow
                    key={lead.id}
                    lead={lead}
                    variant={getListRowVariant()}
                    selected={selectedLeads.has(lead.id)}
                    onSelect={toggleLeadSelection}
                    onAcquire={activeTab === 'available' ? handleAcquireClick : undefined}
                    cooldownRemaining={activeTab === 'available' ? cooldownRemaining : undefined}
                    formatCooldown={activeTab === 'available' ? formatCooldown : undefined}
                    claimerName={(activeTab === 'unavailable' || isAdminDirectView) ? getClaimerName(lead.claimed_by) : undefined}
                    onRelease={releaseLead}
                    onUpdateOutcome={showOutcomeActions ? handleUpdateOutcome : undefined}
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

      <LicenseeSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSave={saveSettings}
      />

      <LicenseeSettingsDialog
        open={showSettingsRequired}
        onOpenChange={setShowSettingsRequired}
        settings={settings}
        onSave={handleSettingsSaved}
        required
      />

      {isAdmin && (
        <>
          <AdminManualReleaseDialog
            open={isManualReleaseOpen}
            onOpenChange={setIsManualReleaseOpen}
            onLeadReleased={handleRefresh}
          />
          <AdminTestLeadDialog
            open={isTestLeadOpen}
            onOpenChange={setIsTestLeadOpen}
            onCreated={handleRefresh}
          />
        </>
      )}

      <OverdueLeadsPopup
        open={isOverduePopupOpen}
        onOpenChange={setIsOverduePopupOpen}
        overdueLeads={overdueLeads}
        onGoToTab={(tab) => setActiveTab(tab)}
      />

      <SaleFormDialog
        open={saleFormOpen}
        onClose={() => { setSaleFormOpen(false); setSaleFormLeadId(null); }}
        onConfirm={handleSaleConfirm}
        leadName={saleFormLead?.name || ''}
      />

      <DiscardFormDialog
        open={discardFormOpen}
        onClose={() => { setDiscardFormOpen(false); setDiscardFormLeadId(null); }}
        onConfirm={handleDiscardConfirm}
        leadName={discardFormLead?.name || ''}
      />

      <SaleCelebrationPopup />
    </div>
    </PendingSalesGate>
    </CompleteProfileGate>
  );
}
