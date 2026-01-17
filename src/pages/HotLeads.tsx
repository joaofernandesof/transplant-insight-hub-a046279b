import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Flame, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  TrendingUp,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  source: string;
  interest_level: 'cold' | 'warm' | 'hot';
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  notes: string | null;
  created_at: string;
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

export default function HotLeads() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.interest_level === 'hot').length,
    converted: leads.filter(l => l.status === 'converted').length
  };

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
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg bg-background"
                >
                  <option value="all">Todos os status</option>
                  <option value="new">Novos</option>
                  <option value="contacted">Contatados</option>
                  <option value="scheduled">Agendados</option>
                  <option value="converted">Convertidos</option>
                  <option value="lost">Perdidos</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                            {interestConfig[lead.interest_level].label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </span>
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {lead.email}
                            </span>
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
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[lead.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[lead.status].label}
                        </Badge>
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1 bg-background"
                        >
                          <option value="new">Novo</option>
                          <option value="contacted">Contatado</option>
                          <option value="scheduled">Agendado</option>
                          <option value="converted">Convertido</option>
                          <option value="lost">Perdido</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </ModuleLayout>
  );
}
