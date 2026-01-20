import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLayout } from '@/components/ModuleLayout';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Flame, RefreshCw, Loader2, Users, CheckCircle2, DollarSign,
  BarChart3, TrendingUp, Calendar, MessageCircle, ListTodo, PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Lead,
  LeadCard,
  LeadKanban,
  LeadFilters,
  LeadDetailDialog,
  LeadDashboard,
  statusConfig,
  SortOption
} from '@/components/hotleads';
import { CrmInbox, CrmTasksPanel, CrmMetricsDashboard } from '@/components/crm';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface LicenseeStats {
  user_id: string;
  name: string;
  state: string | null;
  leads_claimed: number;
  leads_converted: number;
  total_value: number;
  conversion_rate: number;
}

export default function HotLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; state: string | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [procedureFilter, setProcedureFilter] = useState('all');
  const [licenseeFilter, setLicenseeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Dashboard filters
  const [dashboardCityFilter, setDashboardCityFilter] = useState('all');
  const [dashboardLicenseeFilter, setDashboardLicenseeFilter] = useState('all');
  const [dashboardPeriodFilter, setDashboardPeriodFilter] = useState('30d');
  
  // Dialog
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('leads');
  const userState = user?.state || null;

  // Fetch profiles for admin
  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, state');
      
      if (error) throw error;
      
      const profilesMap: Record<string, { name: string; state: string | null }> = {};
      data?.forEach(p => {
        profilesMap[p.user_id] = { name: p.name, state: p.state };
      });
      setProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  // Fetch leads
  const fetchLeads = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    if (isAdmin) {
      fetchProfiles();
    }
  }, [fetchLeads, fetchProfiles, isAdmin]);

  // Notify edge function
  const notifyEvent = async (eventType: string, leadData: Lead, extraData?: Record<string, any>) => {
    try {
      await supabase.functions.invoke('notify-hotlead-event', {
        body: {
          event_type: eventType,
          lead_name: leadData.name,
          lead_phone: leadData.phone,
          lead_state: leadData.state,
          lead_city: leadData.city,
          procedure_interest: leadData.procedure_interest,
          licensee_name: user?.name || 'Licenciado',
          ...extraData
        }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Check if user can claim a lead
  const canClaimLead = useCallback((lead: Lead): boolean => {
    if (lead.claimed_by) return false;
    if (isAdmin) return false;
    
    const availableAt = lead.available_at ? new Date(lead.available_at) : new Date(lead.created_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (availableAt > oneHourAgo) {
      return lead.state === userState;
    }
    
    return true;
  }, [isAdmin, userState]);

  // Check if lead is in priority period
  const isInPriorityPeriod = useCallback((lead: Lead): boolean => {
    const availableAt = lead.available_at ? new Date(lead.available_at) : new Date(lead.created_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return availableAt > oneHourAgo;
  }, []);

  // Claim lead
  const claimLead = async (lead: Lead) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('leads')
        .update({ 
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
          status: 'contacted'
        })
        .eq('id', lead.id)
        .is('claimed_by', null);

      if (error) throw error;
      
      const updatedLead = { 
        ...lead, 
        claimed_by: user.id, 
        claimed_at: new Date().toISOString(),
        status: 'contacted' as const
      };
      
      setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      toast.success('Lead captado com sucesso!');
      
      // Notify
      notifyEvent('lead_claimed', updatedLead);
    } catch (error) {
      console.error('Error claiming lead:', error);
      toast.error('Erro ao captar lead. Talvez já foi pego por outro licenciado.');
      fetchLeads(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Open lead details
  const openDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  // Save lead update
  const saveLeadUpdate = async (data: {
    status?: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
    converted_value?: number;
    procedures_sold?: string[];
    notes?: string;
    scheduled_at?: string;
    discard_reason?: string;
  }) => {
    if (!selectedLead) return;
    
    try {
      setIsSaving(true);
      
      const updateData: Partial<Lead> = {
        ...data,
        converted_at: data.status === 'converted' ? new Date().toISOString() : selectedLead.converted_at
      };

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      const updatedLead = { ...selectedLead, ...updateData } as Lead;
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
      
      // Notify based on status
      if (data.status === 'scheduled') {
        toast.success('Consulta agendada!');
        notifyEvent('lead_scheduled', updatedLead, { scheduled_at: data.scheduled_at });
      } else if (data.status === 'converted') {
        toast.success('Venda registrada!');
        notifyEvent('lead_sold', updatedLead, { 
          converted_value: data.converted_value,
          procedures_sold: data.procedures_sold 
        });
      } else if (data.status === 'lost') {
        toast.success('Lead descartado');
        notifyEvent('lead_discarded', updatedLead, { discard_reason: data.discard_reason });
      } else {
        toast.success('Informações salvas!');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao salvar');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle drag-and-drop status change
  const handleKanbanStatusChange = async (lead: Lead, newStatus: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost') => {
    // For converted and lost, we need extra info - open dialog instead
    if (newStatus === 'converted' || newStatus === 'lost') {
      setSelectedLead(lead);
      setIsDetailOpen(true);
      toast.info(newStatus === 'converted' 
        ? 'Informe o valor e procedimento da venda' 
        : 'Informe o motivo do descarte');
      return;
    }
    
    try {
      const updateData: Partial<Lead> = { status: newStatus };
      
      if (newStatus === 'scheduled') {
        updateData.scheduled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);

      if (error) throw error;
      
      const updatedLead = { ...lead, ...updateData } as Lead;
      setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      
      toast.success('Status atualizado!');
      
      if (newStatus === 'scheduled') {
        notifyEvent('lead_scheduled', updatedLead);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Status order for sorting
  const statusOrder: Record<string, number> = {
    new: 1,
    contacted: 2,
    scheduled: 3,
    converted: 4,
    lost: 5
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      // For licensees: show only unclaimed OR their own leads
      if (!isAdmin && lead.claimed_by && lead.claimed_by !== user?.id) {
        return false;
      }
      
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesState = stateFilter === 'all' || lead.state === stateFilter;
      const matchesProcedure = procedureFilter === 'all' || lead.procedure_interest === procedureFilter;
      const matchesLicensee = licenseeFilter === 'all' || lead.claimed_by === licenseeFilter;
      
      return matchesSearch && matchesStatus && matchesState && matchesProcedure && matchesLicensee;
    });

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        case 'value_desc':
          return (b.converted_value || 0) - (a.converted_value || 0);
        case 'value_asc':
          return (a.converted_value || 0) - (b.converted_value || 0);
        case 'status_asc':
          return (statusOrder[a.status || 'new'] || 0) - (statusOrder[b.status || 'new'] || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [leads, searchTerm, statusFilter, stateFilter, procedureFilter, licenseeFilter, sortBy, isAdmin, user?.id]);

  // Stats
  const stats = useMemo(() => {
    const myLeads = leads.filter(l => l.claimed_by === user?.id);
    const relevantLeads = isAdmin ? leads : myLeads;
    const availableLeads = leads.filter(l => !l.claimed_by);
    
    return {
      total: isAdmin ? leads.length : myLeads.length,
      available: availableLeads.length,
      scheduled: relevantLeads.filter(l => l.status === 'scheduled').length,
      converted: relevantLeads.filter(l => l.status === 'converted').length,
      totalValue: relevantLeads.reduce((sum, l) => sum + (l.converted_value || 0), 0)
    };
  }, [leads, user?.id, isAdmin]);

  // Available states for filter
  const availableStates = useMemo(() => {
    return [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];
  }, [leads]);

  // Licensees for filter
  const licensees = useMemo(() => {
    const ids = [...new Set(leads.map(l => l.claimed_by).filter(Boolean))] as string[];
    return ids.map(id => ({ id, name: profiles[id]?.name || 'Licenciado' }));
  }, [leads, profiles]);

  // Licensee comparison stats (admin only)
  const licenseeStats = useMemo((): LicenseeStats[] => {
    if (!isAdmin) return [];
    
    const statsMap: Record<string, LicenseeStats> = {};
    
    leads.forEach(lead => {
      if (!lead.claimed_by) return;
      
      if (!statsMap[lead.claimed_by]) {
        const profile = profiles[lead.claimed_by];
        statsMap[lead.claimed_by] = {
          user_id: lead.claimed_by,
          name: profile?.name || 'Licenciado',
          state: profile?.state || null,
          leads_claimed: 0,
          leads_converted: 0,
          total_value: 0,
          conversion_rate: 0
        };
      }
      
      statsMap[lead.claimed_by].leads_claimed++;
      if (lead.status === 'converted') {
        statsMap[lead.claimed_by].leads_converted++;
        statsMap[lead.claimed_by].total_value += lead.converted_value || 0;
      }
    });
    
    return Object.values(statsMap).map(s => ({
      ...s,
      conversion_rate: s.leads_claimed > 0 ? (s.leads_converted / s.leads_claimed) * 100 : 0
    })).sort((a, b) => b.total_value - a.total_value);
  }, [leads, profiles, isAdmin]);

  const Layout = isAdmin ? AdminLayout : ModuleLayout;

  return (
    <Layout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2 pl-12 lg:pl-0">
              <Flame className="h-6 w-6 text-orange-500" />
              CRM Médico Neo
            </h1>
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
          
          {/* CRM Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="leads" className="gap-1 text-xs">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Funil</span>
              </TabsTrigger>
              <TabsTrigger value="inbox" className="gap-1 text-xs">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Inbox</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1 text-xs">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">Rotina</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-1 text-xs">
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Métricas</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl overflow-x-hidden">
        {/* CRM Tab Contents */}
        {activeTab === 'inbox' && <CrmInbox />}
        {activeTab === 'tasks' && <CrmTasksPanel />}
        {activeTab === 'metrics' && <CrmMetricsDashboard />}
        
        {activeTab === 'leads' && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{isAdmin ? 'Total Leads' : 'Meus Leads'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Flame className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.available}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.scheduled}</p>
                  <p className="text-xs text-muted-foreground">Agendados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Vendidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {(stats.totalValue / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads">
              <Flame className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="comparison">
                <TrendingUp className="h-4 w-4 mr-2" />
                Comparativo
              </TabsTrigger>
            )}
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <LeadFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  stateFilter={stateFilter}
                  setStateFilter={setStateFilter}
                  procedureFilter={procedureFilter}
                  setProcedureFilter={setProcedureFilter}
                  licenseeFilter={licenseeFilter}
                  setLicenseeFilter={setLicenseeFilter}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  availableStates={availableStates}
                  licensees={licensees}
                  isAdmin={isAdmin}
                  filteredCount={filteredLeads.length}
                  totalCount={leads.length}
                />
              </CardContent>
            </Card>

            {/* Leads View */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
                  <p className="text-muted-foreground">
                    {leads.length === 0 
                      ? 'Os leads das campanhas aparecerão aqui automaticamente.'
                      : 'Tente ajustar os filtros de busca.'}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === 'kanban' ? (
              <LeadKanban
                leads={filteredLeads}
                userId={user?.id}
                isAdmin={isAdmin}
                profiles={profiles}
                canClaimLead={canClaimLead}
                isInPriorityPeriod={isInPriorityPeriod}
                onClaim={claimLead}
                onOpenDetails={openDetails}
                onStatusChange={handleKanbanStatusChange}
              />
            ) : (
              <div className="space-y-3">
                {filteredLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isMine={lead.claimed_by === user?.id}
                    isAdmin={isAdmin}
                    canClaim={canClaimLead(lead)}
                    inPriority={isInPriorityPeriod(lead)}
                    onClaim={claimLead}
                    onOpenDetails={openDetails}
                    licenseName={lead.claimed_by ? profiles[lead.claimed_by]?.name : undefined}
                    compact={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <LeadDashboard
              leads={leads}
              isAdmin={isAdmin}
              profiles={profiles}
              cityFilter={dashboardCityFilter}
              setCityFilter={setDashboardCityFilter}
              licenseeFilter={dashboardLicenseeFilter}
              setLicenseeFilter={setDashboardLicenseeFilter}
              periodFilter={dashboardPeriodFilter}
              setPeriodFilter={setDashboardPeriodFilter}
            />
          </TabsContent>

          {/* Comparison Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="comparison">
              <div className="grid gap-6">
                {/* Ranking */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ranking de Licenciados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {licenseeStats.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum lead foi captado ainda
                        </p>
                      ) : (
                        licenseeStats.map((stat, index) => (
                          <div key={stat.user_id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-muted-foreground/20 text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{stat.name}</p>
                              <p className="text-sm text-muted-foreground">{stat.state || 'N/A'}</p>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-lg font-bold">{stat.leads_claimed}</p>
                              <p className="text-xs text-muted-foreground">Leads</p>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-lg font-bold text-green-600">{stat.leads_converted}</p>
                              <p className="text-xs text-muted-foreground">Vendas</p>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-lg font-bold">{stat.conversion_rate.toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">Taxa</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                R$ {stat.total_value.toLocaleString('pt-BR')}
                              </p>
                              <p className="text-xs text-muted-foreground">Faturado</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Leads por Licenciado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={licenseeStats.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="leads_claimed" fill="#3b82f6" name="Leads" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="leads_converted" fill="#22c55e" name="Vendas" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Faturamento por Licenciado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={licenseeStats.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                          <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                          <Bar dataKey="total_value" fill="#22c55e" name="Valor" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Global Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resultados Globais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold">{leads.length}</p>
                        <p className="text-sm text-muted-foreground">Total de Leads</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold">{leads.filter(l => l.claimed_by).length}</p>
                        <p className="text-sm text-muted-foreground">Leads Captados</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{leads.filter(l => l.status === 'converted').length}</p>
                        <p className="text-sm text-muted-foreground">Vendidos</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold text-primary">
                          {leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Taxa Global</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                          R$ {(leads.reduce((s, l) => s + (l.converted_value || 0), 0) / 1000).toFixed(1)}k
                        </p>
                        <p className="text-sm text-muted-foreground">Faturamento Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onSave={saveLeadUpdate}
        isMine={selectedLead?.claimed_by === user?.id}
        isAdmin={isAdmin}
      />
    </Layout>
  );
}
