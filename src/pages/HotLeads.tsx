import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLayout } from '@/components/ModuleLayout';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Flame, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw,
  Lock,
  DollarSign,
  BarChart3,
  Eye,
  EyeOff,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  source: string | null;
  interest_level: 'cold' | 'warm' | 'hot';
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  available_at: string | null;
  converted_value: number | null;
  procedures_sold: string[] | null;
  converted_at: string | null;
}

interface LicenseeStats {
  user_id: string;
  name: string;
  state: string | null;
  leads_claimed: number;
  leads_converted: number;
  total_value: number;
  conversion_rate: number;
}

const statusConfig = {
  new: { label: 'Disponível', color: 'bg-blue-100 text-blue-700', icon: Clock },
  contacted: { label: 'Em Contato', color: 'bg-yellow-100 text-yellow-700', icon: Phone },
  scheduled: { label: 'Agendado', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  converted: { label: 'Convertido', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const PROCEDURES = [
  'Transplante Capilar FUE',
  'Transplante Capilar DHI',
  'Micropigmentação',
  'Mesoterapia',
  'PRP Capilar',
  'Laser Capilar',
  'Consulta Inicial',
  'Retoque',
  'Outro'
];

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function HotLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; state: string | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('leads');
  
  // Conversion dialog
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [conversionValue, setConversionValue] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [conversionNotes, setConversionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // User state from user object
  const userState = user?.state || null;

  useEffect(() => {
    fetchLeads();
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  const fetchProfiles = async () => {
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
  };

  const fetchLeads = async (showRefresh = false) => {
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
  };

  const canClaimLead = (lead: Lead): boolean => {
    if (lead.claimed_by) return false;
    if (isAdmin) return false; // Admin não pega leads
    
    const availableAt = lead.available_at ? new Date(lead.available_at) : new Date(lead.created_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Within first hour: only same state
    if (availableAt > oneHourAgo) {
      return lead.state === userState;
    }
    
    // After 1 hour: anyone can claim
    return true;
  };

  const isInPriorityPeriod = (lead: Lead): boolean => {
    const availableAt = lead.available_at ? new Date(lead.available_at) : new Date(lead.created_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return availableAt > oneHourAgo;
  };

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
      
      setLeads(prev => prev.map(l => 
        l.id === lead.id ? { 
          ...l, 
          claimed_by: user.id, 
          claimed_at: new Date().toISOString(),
          status: 'contacted' as const
        } : l
      ));
      toast.success('Lead capturado com sucesso!');
    } catch (error) {
      console.error('Error claiming lead:', error);
      toast.error('Erro ao capturar lead. Talvez já foi pego por outro licenciado.');
      fetchLeads(true);
    } finally {
      setIsSaving(false);
    }
  };

  const openConversionDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setConversionValue(lead.converted_value?.toString() || '');
    setSelectedProcedures(lead.procedures_sold || []);
    setConversionNotes(lead.notes || '');
    setIsConversionOpen(true);
  };

  const saveConversion = async () => {
    if (!selectedLead) return;
    
    try {
      setIsSaving(true);
      
      const updateData: Partial<Lead> = {
        notes: conversionNotes || null,
        converted_value: parseFloat(conversionValue) || 0,
        procedures_sold: selectedProcedures,
        status: selectedProcedures.length > 0 || parseFloat(conversionValue) > 0 ? 'converted' : selectedLead.status,
        converted_at: selectedProcedures.length > 0 || parseFloat(conversionValue) > 0 ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === selectedLead.id ? { ...l, ...updateData } as Lead : l
      ));
      setIsConversionOpen(false);
      toast.success('Informações salvas!');
    } catch (error) {
      console.error('Error saving conversion:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const markAsLost = async () => {
    if (!selectedLead) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('leads')
        .update({ status: 'lost', notes: conversionNotes || null })
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === selectedLead.id ? { ...l, status: 'lost' as const, notes: conversionNotes || null } : l
      ));
      setIsConversionOpen(false);
      toast.success('Lead marcado como perdido');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProcedure = (procedure: string) => {
    setSelectedProcedures(prev => 
      prev.includes(procedure) 
        ? prev.filter(p => p !== procedure)
        : [...prev, procedure]
    );
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // For licensees: show only unclaimed OR their own claimed leads
      if (!isAdmin && lead.claimed_by && lead.claimed_by !== user?.id) {
        return false;
      }
      
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesState = stateFilter === 'all' || lead.state === stateFilter;
      
      return matchesSearch && matchesStatus && matchesState;
    });
  }, [leads, searchTerm, statusFilter, stateFilter, isAdmin, user?.id]);

  // My leads (claimed by me)
  const myLeads = useMemo(() => {
    return leads.filter(l => l.claimed_by === user?.id);
  }, [leads, user?.id]);

  // Available leads (not claimed)
  const availableLeads = useMemo(() => {
    return leads.filter(l => !l.claimed_by);
  }, [leads]);

  // Stats
  const stats = useMemo(() => {
    const relevantLeads = isAdmin ? leads : myLeads;
    return {
      total: relevantLeads.length,
      available: availableLeads.length,
      converted: relevantLeads.filter(l => l.status === 'converted').length,
      totalValue: relevantLeads.reduce((sum, l) => sum + (l.converted_value || 0), 0)
    };
  }, [leads, myLeads, availableLeads, isAdmin]);

  const conversionRate = stats.total > 0 
    ? ((stats.converted / stats.total) * 100).toFixed(1) 
    : '0';

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

  // Historical data for charts
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; leads: number; conversions: number; value: number }> = {};
    
    leads.forEach(lead => {
      const date = new Date(lead.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, leads: 0, conversions: 0, value: 0 };
      }
      
      months[monthKey].leads++;
      if (lead.status === 'converted') {
        months[monthKey].conversions++;
        months[monthKey].value += lead.converted_value || 0;
      }
    });
    
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data)
      .slice(-6);
  }, [leads]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const distribution = {
      converted: leads.filter(l => l.status === 'converted').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      scheduled: leads.filter(l => l.status === 'scheduled').length,
      lost: leads.filter(l => l.status === 'lost').length,
      new: leads.filter(l => l.status === 'new').length
    };
    
    return Object.entries(distribution)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: statusConfig[key as keyof typeof statusConfig].label,
        value
      }));
  }, [leads]);

  const availableStates = useMemo(() => {
    return [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];
  }, [leads]);

  const Layout = isAdmin ? AdminLayout : ModuleLayout;

  const renderLeadCard = (lead: Lead) => {
    const isMine = lead.claimed_by === user?.id;
    const isClaimed = !!lead.claimed_by;
    const canClaim = canClaimLead(lead);
    const inPriority = isInPriorityPeriod(lead);
    const StatusIcon = statusConfig[lead.status].icon;

    return (
      <Card key={lead.id} className={`hover:shadow-md transition-shadow ${isMine ? 'border-primary/50 bg-primary/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{lead.name}</h3>
                <Badge className={statusConfig[lead.status].color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[lead.status].label}
                </Badge>
                {isClaimed && !isMine && isAdmin && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    {profiles[lead.claimed_by!]?.name || 'Licenciado'}
                  </Badge>
                )}
                {isMine && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Meu Lead
                  </Badge>
                )}
                {!isClaimed && inPriority && (
                  <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                    <Timer className="h-3 w-3" />
                    Prioridade {lead.state}
                  </Badge>
                )}
              </div>
              
              {/* Show contact info only if claimed by user, admin, or not claimed */}
              {(isMine || isAdmin || !isClaimed) ? (
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="h-4 w-4" />
                    {lead.phone}
                  </a>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary">
                      <Mail className="h-4 w-4" />
                      {lead.email}
                    </a>
                  )}
                  {lead.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {lead.city}{lead.state ? `, ${lead.state}` : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4" />
                  <span>Dados ocultos - Lead já capturado</span>
                </div>
              )}
              
              {lead.status === 'converted' && lead.converted_value && (
                <div className="mt-2 flex items-center gap-2 text-green-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">R$ {lead.converted_value.toLocaleString('pt-BR')}</span>
                  {lead.procedures_sold && lead.procedures_sold.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      • {lead.procedures_sold.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isClaimed && canClaim && (
                <Button onClick={() => claimLead(lead)} disabled={isSaving}>
                  <Flame className="h-4 w-4 mr-2" />
                  Pegar Lead
                </Button>
              )}
              {isMine && (
                <Button variant="outline" onClick={() => openConversionDialog(lead)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {lead.status === 'converted' ? 'Editar' : 'Registrar Venda'}
                </Button>
              )}
              {isAdmin && isClaimed && (
                <Button variant="ghost" size="sm" onClick={() => openConversionDialog(lead)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2 pl-12 lg:pl-0">
              <Flame className="h-6 w-6 text-orange-500" />
              HotLeads
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isAdmin ? leads.length : myLeads.length}</p>
                  <p className="text-xs text-muted-foreground">{isAdmin ? 'Total Leads' : 'Meus Leads'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
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
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {(stats.totalValue / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
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

          <TabsContent value="leads">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, telefone ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="new">Disponíveis</SelectItem>
                        <SelectItem value="contacted">Em Contato</SelectItem>
                        <SelectItem value="converted">Convertidos</SelectItem>
                        <SelectItem value="lost">Perdidos</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos estados</SelectItem>
                        {availableStates.sort().map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(statusFilter !== 'all' || stateFilter !== 'all' || searchTerm) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setStatusFilter('all');
                          setStateFilter('all');
                          setSearchTerm('');
                        }}
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Exibindo {filteredLeads.length} leads
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Leads List */}
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
            ) : (
              <div className="grid gap-4">
                {filteredLeads.map(renderLeadCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Historical Chart */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Histórico de Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#22c55e" name="Conversões" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Value Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Valor por Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
                      <Bar dataKey="value" fill="#22c55e" name="Valor" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Conversion Rate */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Indicadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">{conversionRate}%</p>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        R$ {stats.converted > 0 ? (stats.totalValue / stats.converted).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">{myLeads.length}</p>
                      <p className="text-sm text-muted-foreground">Leads Capturados</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">{availableLeads.length}</p>
                      <p className="text-sm text-muted-foreground">Leads Aguardando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                          Nenhum lead foi capturado ainda
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
                              <p className="text-xs text-muted-foreground">Conversões</p>
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
                      <CardTitle>Leads por Licenciado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={licenseeStats.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="leads_claimed" fill="#3b82f6" name="Leads" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="leads_converted" fill="#22c55e" name="Conversões" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Faturamento por Licenciado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={licenseeStats.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <YAxis dataKey="name" type="category" width={100} />
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
                        <p className="text-sm text-muted-foreground">Leads Capturados</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{leads.filter(l => l.status === 'converted').length}</p>
                        <p className="text-sm text-muted-foreground">Convertidos</p>
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

      {/* Conversion Dialog */}
      <Dialog open={isConversionOpen} onOpenChange={setIsConversionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
            <DialogDescription>
              {selectedLead?.name} - {selectedLead?.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Procedimentos Vendidos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PROCEDURES.map(proc => (
                  <Badge
                    key={proc}
                    variant={selectedProcedures.includes(proc) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProcedure(proc)}
                  >
                    {proc}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="value">Valor da Venda (R$)</Label>
              <Input
                id="value"
                type="number"
                placeholder="0,00"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Anotações sobre o atendimento..."
                value={conversionNotes}
                onChange={(e) => setConversionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" onClick={markAsLost} disabled={isSaving}>
              <XCircle className="h-4 w-4 mr-2" />
              Marcar Perdido
            </Button>
            <Button onClick={saveConversion} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
