import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Download,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Target,
  Lightbulb,
  BarChart3,
  PieChart,
  MessageCircle,
  Send,
  Copy,
  Check,
  Link,
  ExternalLink
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { ReferralsTable, UnifiedReferral } from '@/components/admin/ReferralsTable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

// Stats interface
interface ReferralStats {
  total: number;
  pending: number;
  contacted: number;
  enrolled: number;
  converted: number;
  cancelled: number;
  conversionRate: number;
  avgTimeToConvert: number;
  totalCommissionPending: number;
  totalCommissionPaid: number;
  thisMonth: number;
  lastMonth: number;
  growthRate: number;
  topReferrers: { name: string; count: number; converted: number }[];
  bySource: { student: number; lead: number };
  byWeek: { week: string; count: number }[];
  byStatus: { name: string; value: number; color: string }[];
}

// Referrer user with link info
interface ReferrerUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  converted_referrals: number;
  pending_referrals: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  contacted: '#3b82f6',
  enrolled: '#8b5cf6',
  converted: '#10b981',
  cancelled: '#ef4444'
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  contacted: 'Contatado',
  enrolled: 'Matriculado',
  converted: 'Convertido',
  cancelled: 'Cancelado'
};

export default function ReferralsAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [referrerFilter, setReferrerFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [referrerSearchTerm, setReferrerSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [referrals, setReferrals] = useState<UnifiedReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [allReferrers, setAllReferrers] = useState<ReferrerUser[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch both sources in parallel and fail loudly if any query errors.
      const [studentRes, leadsRes] = await Promise.all([
        supabase.from('student_referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_leads').select('*').order('created_at', { ascending: false })
      ]);

      if (studentRes.error) throw studentRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const studentData = studentRes.data || [];
      const leadsData = leadsRes.data || [];

      // Get all referrer IDs
      const referrerIds = Array.from(
        new Set([
          ...studentData.map(r => r.referrer_user_id).filter(Boolean),
          ...leadsData.map(r => r.referrer_user_id).filter(Boolean)
        ])
      );

      // Fetch referrer names from neohub_users (primary) and profiles (fallback)
      const profileMap = new Map<string, string>();
      if (referrerIds.length > 0) {
        const [neohubRes, profilesRes] = await Promise.all([
          supabase.from('neohub_users').select('user_id, full_name').in('user_id', referrerIds),
          supabase.from('profiles').select('user_id, name').in('user_id', referrerIds)
        ]);

        if (neohubRes.error) throw neohubRes.error;
        if (profilesRes.error) throw profilesRes.error;

        // Create map: neohub_users takes priority over profiles
        profilesRes.data?.forEach(p => {
          if (p.name) profileMap.set(p.user_id, p.name);
        });
        neohubRes.data?.forEach(u => {
          if (u.full_name) profileMap.set(u.user_id, u.full_name);
        });
      }

      // Unify data
      const unified: UnifiedReferral[] = [
        ...studentData.map(r => ({
          id: r.id,
          source: 'student' as const,
          name: r.referred_name,
          email: r.referred_email,
          phone: r.referred_phone,
          referrer_user_id: r.referrer_user_id,
          referrer_name: profileMap.get(r.referrer_user_id) || 'Desconhecido',
          referrer_code: r.referral_code,
          status: r.status,
          has_crm: r.referred_has_crm,
          crm: r.referred_crm,
          commission_rate: r.commission_rate,
          commission_paid: r.commission_paid,
          created_at: r.created_at,
          converted_at: r.converted_at
        })),
        ...leadsData.map(r => ({
          id: r.id,
          source: 'lead' as const,
          name: r.name,
          email: r.email,
          phone: r.phone,
          referrer_user_id: r.referrer_user_id,
          referrer_name: profileMap.get(r.referrer_user_id) || 'Desconhecido',
          status: r.status,
          interest: r.interest,
          city: r.city,
          state: r.state,
          commission_value: r.commission_value,
          commission_paid: r.commission_paid,
          converted_value: r.converted_value,
          created_at: r.created_at,
          converted_at: r.converted_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReferrals(unified);
      calculateStats(unified);

      // Fetch all users with referral codes for the Referrers tab
      const { data: allNeohubUsers, error: allNeohubUsersError } = await supabase
        .from('neohub_users')
        .select('id, user_id, full_name, email, referral_code')
        .not('referral_code', 'is', null)
        .order('full_name');

      if (allNeohubUsersError) throw allNeohubUsersError;

      // Build referrer stats
      const baseUrl = window.location.origin;
      const referrersWithStats: ReferrerUser[] = (allNeohubUsers || []).map(user => {
        const userReferrals = unified.filter(r => r.referrer_user_id === user.user_id);
        return {
          id: user.id,
          user_id: user.user_id,
          full_name: user.full_name || 'Sem nome',
          email: user.email || '',
          referral_code: user.referral_code,
          referral_link: `${baseUrl}/indicacao-formacao360/${user.referral_code}`,
          total_referrals: userReferrals.length,
          converted_referrals: userReferrals.filter(r => r.status === 'converted').length,
          pending_referrals: userReferrals.filter(r => r.status === 'pending').length
        };
      });

      setAllReferrers(referrersWithStats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UnifiedReferral[]) => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);

    const thisMonthData = data.filter(r => new Date(r.created_at) >= thisMonthStart);
    const lastMonthData = data.filter(r => {
      const date = new Date(r.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const converted = data.filter(r => r.status === 'converted');
    const conversionTimes = converted
      .filter(r => r.converted_at)
      .map(r => differenceInDays(new Date(r.converted_at!), new Date(r.created_at)));
    const avgTimeToConvert = conversionTimes.length > 0 
      ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length 
      : 0;

    // Top referrers
    const referrerCounts: Record<string, { name: string; count: number; converted: number }> = {};
    data.forEach(r => {
      if (!referrerCounts[r.referrer_user_id]) {
        referrerCounts[r.referrer_user_id] = { name: r.referrer_name, count: 0, converted: 0 };
      }
      referrerCounts[r.referrer_user_id].count++;
      if (r.status === 'converted') {
        referrerCounts[r.referrer_user_id].converted++;
      }
    });
    const topReferrers = Object.values(referrerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // By week (last 8 weeks)
    const byWeek: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = subDays(now, i * 7 + 6);
      const weekEnd = subDays(now, i * 7);
      const count = data.filter(r => {
        const date = new Date(r.created_at);
        return date >= weekStart && date <= weekEnd;
      }).length;
      byWeek.push({
        week: format(weekEnd, 'dd/MM', { locale: ptBR }),
        count
      });
    }

    // By status
    const statusCounts: Record<string, number> = {};
    data.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name,
      value,
      color: STATUS_COLORS[name] || '#6b7280'
    }));

    setStats({
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      contacted: data.filter(r => r.status === 'contacted').length,
      enrolled: data.filter(r => r.status === 'enrolled').length,
      converted: converted.length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
      conversionRate: data.length > 0 ? (converted.length / data.length) * 100 : 0,
      avgTimeToConvert,
      totalCommissionPending: data.filter(r => r.status === 'converted' && !r.commission_paid)
        .reduce((acc, r) => acc + (r.commission_value || r.commission_rate || 0), 0),
      totalCommissionPaid: data.filter(r => r.commission_paid)
        .reduce((acc, r) => acc + (r.commission_value || r.commission_rate || 0), 0),
      thisMonth: thisMonthData.length,
      lastMonth: lastMonthData.length,
      growthRate: lastMonthData.length > 0 
        ? ((thisMonthData.length - lastMonthData.length) / lastMonthData.length) * 100 
        : 0,
      topReferrers,
      bySource: {
        student: data.filter(r => r.source === 'student').length,
        lead: data.filter(r => r.source === 'lead').length
      },
      byWeek,
      byStatus
    });
  };

  const updateStatus = async (referral: UnifiedReferral, newStatus: string) => {
    const table = referral.source === 'student' ? 'student_referrals' : 'referral_leads';
    const { error } = await supabase
      .from(table)
      .update({ 
        status: newStatus,
        ...(newStatus === 'converted' ? { converted_at: new Date().toISOString() } : {})
      })
      .eq('id', referral.id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Status atualizado!');
    fetchAllData();
  };

  const resendEmail = async (referral: UnifiedReferral) => {
    try {
      const response = await supabase.functions.invoke('notify-referral', {
        body: {
          name: referral.name,
          email: referral.email,
          phone: referral.phone,
          referralCode: referral.referrer_code || 'DIRECT',
          isStudentReferral: referral.source === 'student'
        }
      });

      if (response.error) throw response.error;
      toast.success('E-mail reenviado com sucesso!');
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Erro ao reenviar e-mail');
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}! Somos da equipe IBRAMEC e vimos seu interesse através de nossa indicação. Podemos ajudá-lo?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof Clock; variant: 'secondary' | 'default' | 'destructive' | 'outline'; className?: string }> = {
      pending: { icon: Clock, variant: 'secondary' },
      contacted: { icon: Phone, variant: 'default', className: 'bg-blue-500' },
      enrolled: { icon: UserPlus, variant: 'default', className: 'bg-violet-500' },
      converted: { icon: CheckCircle, variant: 'default', className: 'bg-green-500' },
      cancelled: { icon: XCircle, variant: 'destructive' }
    };
    const { icon: Icon, variant, className } = config[status] || { icon: Clock, variant: 'outline' };
    return (
      <Badge variant={variant} className={`gap-1 ${className || ''}`}>
        <Icon className="h-3 w-3" />
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  // Unique referrers for filter
  const uniqueReferrers = useMemo(() => {
    const map = new Map<string, string>();
    referrals.forEach(r => map.set(r.referrer_user_id, r.referrer_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [referrals]);

  // Filtered data
  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      const matchesSearch = searchTerm === '' ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referrer_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || r.source === sourceFilter;
      const matchesReferrer = referrerFilter === 'all' || r.referrer_user_id === referrerFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const date = new Date(r.created_at);
        const now = new Date();
        if (dateFilter === '7d') matchesDate = date >= subDays(now, 7);
        else if (dateFilter === '30d') matchesDate = date >= subDays(now, 30);
        else if (dateFilter === '90d') matchesDate = date >= subDays(now, 90);
      }
      
      return matchesSearch && matchesStatus && matchesSource && matchesReferrer && matchesDate;
    });
  }, [referrals, searchTerm, statusFilter, sourceFilter, dateFilter, referrerFilter]);

  // Filtered referrers for the management tab
  const filteredReferrers = useMemo(() => {
    if (!referrerSearchTerm) return allReferrers;
    return allReferrers.filter(r =>
      r.full_name.toLowerCase().includes(referrerSearchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(referrerSearchTerm.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(referrerSearchTerm.toLowerCase())
    );
  }, [allReferrers, referrerSearchTerm]);

  const copyToClipboard = async (text: string, code: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Indicador', 'Origem', 'Status', 'Data', 'Convertido em'];
    const rows = filteredReferrals.map(r => [
      r.name,
      r.email,
      r.phone,
      r.referrer_name,
      r.source === 'student' ? 'Indicador' : 'Indicado',
      STATUS_LABELS[r.status] || r.status,
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
      r.converted_at ? format(new Date(r.converted_at), 'dd/MM/yyyy HH:mm') : '-'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportação concluída!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <GlobalBreadcrumb />
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Gift className="h-7 w-7 text-emerald-500" />
              Dashboard de Indicações
            </h1>
            <p className="text-muted-foreground">
              5% de comissão PIX para indicadores • 5% de desconto para indicados
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={fetchAllData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="referrers" className="gap-2">
            <Users className="h-4 w-4" />
            Indicadores ({allReferrers.length})
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* KPI Cards */}
          {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Indicações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Percent className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs text-muted-foreground">Este Mês</p>
                  {stats.growthRate !== 0 && (
                    <Badge variant={stats.growthRate > 0 ? 'default' : 'destructive'} className="text-[10px] mt-1">
                      {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                  <Target className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgTimeToConvert.toFixed(0)}d</p>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly Trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Indicações por Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byWeek}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={stats.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {stats.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights + Top Referrers */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Insights */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Insights & Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pending > stats.converted && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Alto volume pendente</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.pending} indicações aguardam contato. Priorize follow-up para aumentar conversão.
                    </p>
                  </div>
                </div>
              )}
              {stats.conversionRate < 20 && stats.total > 5 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <TrendingDown className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Taxa de conversão baixa</p>
                    <p className="text-xs text-muted-foreground">
                      Apenas {stats.conversionRate.toFixed(1)}% converte. Revise o processo de abordagem.
                    </p>
                  </div>
                </div>
              )}
              {stats.avgTimeToConvert > 14 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Ciclo de conversão longo</p>
                    <p className="text-xs text-muted-foreground">
                      Média de {stats.avgTimeToConvert.toFixed(0)} dias. Considere automação de follow-ups.
                    </p>
                  </div>
                </div>
              )}
              {stats.growthRate > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Crescimento positivo!</p>
                    <p className="text-xs text-muted-foreground">
                      +{stats.growthRate.toFixed(0)}% vs mês anterior. Continue incentivando indicadores.
                    </p>
                  </div>
                </div>
              )}
              {stats.topReferrers.length > 0 && stats.topReferrers[0].count >= 3 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <Gift className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Top indicador identificado</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.topReferrers[0].name} lidera com {stats.topReferrers[0].count} indicações. 
                      Considere reconhecimento especial.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Referrers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Indicadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topReferrers.length > 0 ? (
                <div className="space-y-3">
                  {stats.topReferrers.map((referrer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-500 text-white' : 
                          idx === 1 ? 'bg-gray-400 text-white' : 
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{referrer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {referrer.converted} convertidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{referrer.count}</p>
                        <p className="text-xs text-muted-foreground">indicações</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum indicador ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Component */}
      <ReferralsTable
        referrals={filteredReferrals}
        onStatusChange={updateStatus}
        onOpenWhatsApp={openWhatsApp}
        onResendEmail={resendEmail}
      />
        </TabsContent>

        {/* Referrers Management Tab */}
        <TabsContent value="referrers" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5 text-emerald-500" />
                    Gestão de Indicadores
                  </CardTitle>
                  <CardDescription>
                    Todos os usuários do sistema com seus links de indicação
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {allReferrers.length} indicadores
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou código..."
                  value={referrerSearchTerm}
                  onChange={(e) => setReferrerSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{allReferrers.length}</p>
                  <p className="text-xs text-muted-foreground">Total Indicadores</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{allReferrers.filter(r => r.total_referrals > 0).length}</p>
                  <p className="text-xs text-muted-foreground">Com Indicações</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{allReferrers.reduce((acc, r) => acc + r.total_referrals, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Indicações</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{allReferrers.reduce((acc, r) => acc + r.converted_referrals, 0)}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
              </div>

              {/* Table */}
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indicador</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="hidden lg:table-cell">Link</TableHead>
                      <TableHead className="text-center">Indicações</TableHead>
                      <TableHead className="text-center hidden sm:table-cell">Convertidos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrers.map((referrer) => (
                      <TableRow key={referrer.id}>
                        <TableCell>
                          <p className="font-medium">{referrer.full_name}</p>
                          <p className="text-xs text-muted-foreground md:hidden truncate max-w-[120px]">
                            {referrer.email}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
                            {referrer.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {referrer.referral_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <span className="text-xs text-muted-foreground truncate">
                              {referrer.referral_link.replace(window.location.origin, '')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={referrer.total_referrals > 0 ? 'default' : 'secondary'}>
                            {referrer.total_referrals}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Badge variant={referrer.converted_referrals > 0 ? 'default' : 'secondary'} className={referrer.converted_referrals > 0 ? 'bg-emerald-500' : ''}>
                            {referrer.converted_referrals}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyToClipboard(referrer.referral_link, referrer.referral_code)}
                              title="Copiar link"
                            >
                              {copiedCode === referrer.referral_code ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => window.open(referrer.referral_link, '_blank')}
                              title="Abrir link"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            {referrer.total_referrals > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setReferrerFilter(referrer.user_id);
                                  setActiveTab('dashboard');
                                }}
                                title="Ver indicações"
                              >
                                <Users className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
