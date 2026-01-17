import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  MessageSquare,
  TrendingUp,
  Users,
  Loader2,
  Eye,
  StickyNote,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

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
}

const statusConfig = {
  new: { label: 'Novo', color: 'bg-blue-100 text-blue-700', icon: Clock },
  contacted: { label: 'Contatado', color: 'bg-yellow-100 text-yellow-700', icon: MessageSquare },
  scheduled: { label: 'Agendado', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  converted: { label: 'Convertido', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const interestConfig = {
  cold: { label: 'Frio', color: 'bg-slate-100 text-slate-600' },
  warm: { label: 'Morno', color: 'bg-orange-100 text-orange-600' },
  hot: { label: 'Quente', color: 'bg-red-100 text-red-600' }
};

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function HotLeads() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  
  // Detail dialog
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

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

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus as Lead['status'] } : lead
      ));
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const updateLeadInterest = async (leadId: string, newInterest: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ interest_level: newInterest })
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, interest_level: newInterest as Lead['interest_level'] } : lead
      ));
      toast.success('Nível de interesse atualizado!');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar interesse');
    }
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    
    try {
      setIsSavingNotes(true);
      const { error } = await supabase
        .from('leads')
        .update({ notes: editNotes || null })
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => 
        lead.id === selectedLead.id ? { ...lead, notes: editNotes || null } : lead
      ));
      setSelectedLead(prev => prev ? { ...prev, notes: editNotes || null } : null);
      toast.success('Anotações salvas!');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Erro ao salvar anotações');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setIsDetailOpen(true);
  };

  // Get unique states from leads for filter
  const availableStates = [...new Set(leads.map(l => l.state).filter(Boolean))] as string[];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesInterest = interestFilter === 'all' || lead.interest_level === interestFilter;
    const matchesState = stateFilter === 'all' || lead.state === stateFilter;
    return matchesSearch && matchesStatus && matchesInterest && matchesState;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.interest_level === 'hot').length,
    converted: leads.filter(l => l.status === 'converted').length
  };

  const conversionRate = stats.total > 0 
    ? ((stats.converted / stats.total) * 100).toFixed(1) 
    : '0';

  return (
    <ModuleLayout>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">Novos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Flame className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hot}</p>
                  <p className="text-xs text-muted-foreground">Leads Quentes</p>
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
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone, email ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="new">Novos</SelectItem>
                    <SelectItem value="contacted">Contatados</SelectItem>
                    <SelectItem value="scheduled">Agendados</SelectItem>
                    <SelectItem value="converted">Convertidos</SelectItem>
                    <SelectItem value="lost">Perdidos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={interestFilter} onValueChange={setInterestFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Interesse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos níveis</SelectItem>
                    <SelectItem value="hot">🔥 Quente</SelectItem>
                    <SelectItem value="warm">🌡️ Morno</SelectItem>
                    <SelectItem value="cold">❄️ Frio</SelectItem>
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

                {(statusFilter !== 'all' || interestFilter !== 'all' || stateFilter !== 'all' || searchTerm) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setInterestFilter('all');
                      setStateFilter('all');
                      setSearchTerm('');
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Exibindo {filteredLeads.length} de {leads.length} leads
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
                  ? 'Os leads das suas campanhas aparecerão aqui automaticamente.'
                  : 'Tente ajustar os filtros de busca.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => {
              const StatusIcon = statusConfig[lead.status].icon;
              return (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <Badge className={interestConfig[lead.interest_level].color}>
                            {lead.interest_level === 'hot' && '🔥 '}
                            {interestConfig[lead.interest_level].label}
                          </Badge>
                          {lead.notes && (
                            <Badge variant="outline" className="gap-1">
                              <StickyNote className="h-3 w-3" />
                              Notas
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </a>
                          {lead.email && (
                            <a 
                              href={`mailto:${lead.email}`}
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
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
                        {lead.utm_campaign && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Campanha: {lead.utm_campaign}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={statusConfig[lead.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[lead.status].label}
                        </Badge>
                        
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Contatado</SelectItem>
                            <SelectItem value="scheduled">Agendado</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Lead Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLead?.name}
              {selectedLead && (
                <Badge className={interestConfig[selectedLead.interest_level].color}>
                  {interestConfig[selectedLead.interest_level].label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Lead recebido em {selectedLead && new Date(selectedLead.created_at).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <a 
                    href={`tel:${selectedLead.phone}`}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedLead.phone}
                  </a>
                </div>
                {selectedLead.email && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <a 
                      href={`mailto:${selectedLead.email}`}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary truncate"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedLead.email}
                    </a>
                  </div>
                )}
                {selectedLead.city && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Localização</Label>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      {selectedLead.city}{selectedLead.state ? `, ${selectedLead.state}` : ''}
                    </p>
                  </div>
                )}
                {selectedLead.source && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Origem</Label>
                    <p className="text-sm font-medium">{selectedLead.source}</p>
                  </div>
                )}
              </div>

              {/* UTM Info */}
              {(selectedLead.utm_source || selectedLead.utm_campaign) && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground mb-2 block">Rastreamento</Label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedLead.utm_source && (
                      <Badge variant="secondary">source: {selectedLead.utm_source}</Badge>
                    )}
                    {selectedLead.utm_medium && (
                      <Badge variant="secondary">medium: {selectedLead.utm_medium}</Badge>
                    )}
                    {selectedLead.utm_campaign && (
                      <Badge variant="secondary">campaign: {selectedLead.utm_campaign}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Interest */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                  <Select
                    value={selectedLead.status}
                    onValueChange={(value) => {
                      updateLeadStatus(selectedLead.id, value);
                      setSelectedLead(prev => prev ? { ...prev, status: value as Lead['status'] } : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="contacted">Contatado</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="converted">Convertido</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Nível de Interesse</Label>
                  <Select
                    value={selectedLead.interest_level}
                    onValueChange={(value) => {
                      updateLeadInterest(selectedLead.id, value);
                      setSelectedLead(prev => prev ? { ...prev, interest_level: value as Lead['interest_level'] } : null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">🔥 Quente</SelectItem>
                      <SelectItem value="warm">🌡️ Morno</SelectItem>
                      <SelectItem value="cold">❄️ Frio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Anotações</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Adicione observações sobre este lead..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fechar
            </Button>
            <Button onClick={saveNotes} disabled={isSavingNotes}>
              {isSavingNotes && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Anotações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
