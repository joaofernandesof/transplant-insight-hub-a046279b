import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Gift,
  Search,
  RefreshCw,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Loader2,
  ArrowLeft,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface StudentReferral {
  id: string;
  referrer_user_id: string;
  referral_code: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string;
  referred_has_crm: boolean;
  referred_crm: string | null;
  status: string;
  commission_rate: number;
  commission_paid: boolean;
  notes: string | null;
  created_at: string;
  converted_at: string | null;
  referrer_name?: string;
}

interface ReferralLead {
  id: string;
  referrer_user_id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  interest: string | null;
  status: string;
  commission_value: number;
  commission_paid: boolean;
  converted_value: number;
  created_at: string;
  converted_at: string | null;
  referrer_name?: string;
}

export default function ReferralsAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student_referrals');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [studentReferrals, setStudentReferrals] = useState<StudentReferral[]>([]);
  const [referralLeads, setReferralLeads] = useState<ReferralLead[]>([]);
  
  const [stats, setStats] = useState({
    totalStudentReferrals: 0,
    totalReferralLeads: 0,
    pendingStudentReferrals: 0,
    pendingReferralLeads: 0,
    convertedStudentReferrals: 0,
    convertedReferralLeads: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudentReferrals(),
        fetchReferralLeads()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentReferrals = async () => {
    const { data, error } = await supabase
      .from('student_referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student referrals:', error);
      return;
    }

    // Fetch referrer names
    const referrerIds = [...new Set(data?.map(r => r.referrer_user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name')
      .in('user_id', referrerIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
    
    const enrichedData = (data || []).map(r => ({
      ...r,
      referrer_name: profileMap.get(r.referrer_user_id) || 'Desconhecido'
    }));

    setStudentReferrals(enrichedData);
    
    setStats(prev => ({
      ...prev,
      totalStudentReferrals: enrichedData.length,
      pendingStudentReferrals: enrichedData.filter(r => r.status === 'pending').length,
      convertedStudentReferrals: enrichedData.filter(r => r.status === 'converted').length
    }));
  };

  const fetchReferralLeads = async () => {
    const { data, error } = await supabase
      .from('referral_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referral leads:', error);
      return;
    }

    // Fetch referrer names
    const referrerIds = [...new Set(data?.map(r => r.referrer_user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name')
      .in('user_id', referrerIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
    
    const enrichedData = (data || []).map(r => ({
      ...r,
      referrer_name: profileMap.get(r.referrer_user_id) || 'Desconhecido'
    }));

    setReferralLeads(enrichedData);
    
    setStats(prev => ({
      ...prev,
      totalReferralLeads: enrichedData.length,
      pendingReferralLeads: enrichedData.filter(r => r.status === 'pending').length,
      convertedReferralLeads: enrichedData.filter(r => r.status === 'converted').length
    }));
  };

  const updateStatus = async (table: 'student_referrals' | 'referral_leads', id: string, newStatus: string) => {
    const { error } = await supabase
      .from(table)
      .update({ 
        status: newStatus,
        ...(newStatus === 'converted' ? { converted_at: new Date().toISOString() } : {})
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Status atualizado!');
    fetchAllData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500 gap-1"><Phone className="h-3 w-3" />Contatado</Badge>;
      case 'enrolled':
        return <Badge className="bg-amber-500 gap-1"><UserPlus className="h-3 w-3" />Matriculado</Badge>;
      case 'converted':
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Convertido</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterData = <T extends { status: string; referred_name?: string; name?: string; referred_email?: string; email?: string }>(
    data: T[]
  ): T[] => {
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        (item.referred_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.referred_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredStudentReferrals = filterData(studentReferrals);
  const filteredReferralLeads = filterData(referralLeads);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Gift className="h-7 w-7 text-emerald-500" />
              Gestão de Indicações
            </h1>
            <p className="text-muted-foreground">Visualize e gerencie todas as indicações recebidas</p>
          </div>
        </div>
        <Button onClick={fetchAllData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStudentReferrals}</p>
                <p className="text-xs text-muted-foreground">Indicações Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReferralLeads}</p>
                <p className="text-xs text-muted-foreground">Leads Indicação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingStudentReferrals + stats.pendingReferralLeads}</p>
                <p className="text-xs text-muted-foreground">Pendentes Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.convertedStudentReferrals + stats.convertedReferralLeads}</p>
                <p className="text-xs text-muted-foreground">Convertidos Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="enrolled">Matriculado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student_referrals" className="gap-2">
            <Gift className="h-4 w-4" />
            Indicações Alunos ({filteredStudentReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="referral_leads" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Leads de Indicação ({filteredReferralLeads.length})
          </TabsTrigger>
        </TabsList>

        {/* Student Referrals Tab */}
        <TabsContent value="student_referrals">
          <Card>
            <CardHeader>
              <CardTitle>Indicações de Alunos (Formação 360)</CardTitle>
              <CardDescription>
                Indicações feitas por alunos da Formação 360 através do programa de comissionamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudentReferrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma indicação encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indicado</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead className="hidden lg:table-cell">CRM</TableHead>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudentReferrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{referral.referred_name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{referral.referred_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3" />
                                {referral.referred_email}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" />
                                {referral.referred_phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {referral.referred_has_crm ? (
                              <Badge variant="outline" className="text-green-600">
                                {referral.referred_crm || 'Sim'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{referral.referrer_name}</p>
                              <p className="text-xs text-muted-foreground">{referral.referral_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(referral.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(referral.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={referral.status} 
                              onValueChange={(value) => updateStatus('student_referrals', referral.id, value)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="contacted">Contatado</SelectItem>
                                <SelectItem value="enrolled">Matriculado</SelectItem>
                                <SelectItem value="converted">Convertido</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Leads Tab */}
        <TabsContent value="referral_leads">
          <Card>
            <CardHeader>
              <CardTitle>Leads de Indicação (Landing Page)</CardTitle>
              <CardDescription>
                Leads captados através da landing page de indicação geral
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReferralLeads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum lead encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Contato</TableHead>
                        <TableHead className="hidden lg:table-cell">Localização</TableHead>
                        <TableHead className="hidden xl:table-cell">Interesse</TableHead>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferralLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{lead.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {lead.city && lead.state ? (
                              <span className="text-sm">{lead.city}/{lead.state}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {lead.interest ? (
                              <Badge variant="outline">{lead.interest}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{lead.referrer_name}</p>
                          </TableCell>
                          <TableCell>{getStatusBadge(lead.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(lead.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={lead.status} 
                              onValueChange={(value) => updateStatus('referral_leads', lead.id, value)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="contacted">Contatado</SelectItem>
                                <SelectItem value="enrolled">Matriculado</SelectItem>
                                <SelectItem value="converted">Convertido</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
