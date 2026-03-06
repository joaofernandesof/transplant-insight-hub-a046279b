/**
 * NeoAcademy Financial Dashboard - Controle financeiro completo
 * Pagamentos, carrinhos, recorrências, inadimplência, links de pagamento
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign, CreditCard, AlertTriangle, TrendingUp, Link2, Search,
  ExternalLink, Copy, Plus, Loader2, Filter, RefreshCw,
  CheckCircle, XCircle, Clock, Ban, MoreHorizontal, Eye,
  Users, BarChart3, ArrowUpDown, ChevronUp, ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Stripe products mapping
const STRIPE_PRODUCTS = [
  { id: 'prod_TsPBy7bvDUdxis', name: 'Sinal Reserva - Brows Transplant', type: 'one_time' },
  { id: 'prod_Ts7Duxyf2jOLiI', name: 'Pré-Inscrição Brows 360° - IBRAMEC', type: 'one_time' },
  { id: 'prod_Tqy5wHgKRKMXuK', name: 'Reserva - Formação 360°', type: 'one_time' },
  { id: 'prod_Tq98B8iCfUKwpy', name: 'Amortização Formação 360', type: 'one_time' },
  { id: 'prod_TORjanuq02qTyP', name: 'Mensalidade Licenciamento', type: 'subscription' },
  { id: 'prod_TORivRc0C4Q4M7', name: 'Quitação Taxa Licenciamento', type: 'one_time' },
  { id: 'prod_TIRKnfsIjmwdp0', name: 'Formação 360', type: 'one_time' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: 'Pago', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  overdue: { label: 'Inadimplente', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle },
  failed: { label: 'Falhou', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  refunded: { label: 'Reembolsado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: RefreshCw },
  canceled: { label: 'Cancelado', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Ban },
};

function formatCurrency(cents: number, currency = 'brl') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

export default function NeoAcademyAdminFinancial() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createLinkOpen, setCreateLinkOpen] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkPriceId, setNewLinkPriceId] = useState('');
  const [newLinkAmount, setNewLinkAmount] = useState('');
  const [newLinkType, setNewLinkType] = useState<'one_time' | 'subscription'>('one_time');

  // Account ID
  const { data: accountId } = useQuery({
    queryKey: ['neoacademy-account-id-fin', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return null;
      const { data } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .or(`user_id.eq.${user.authUserId},user_id.eq.${user.id}`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (data?.account_id) return data.account_id;
      if (user.isAdmin) {
        const { data: fallback } = await supabase.from('neoacademy_accounts').select('id').limit(1).maybeSingle();
        return fallback?.id || null;
      }
      return null;
    },
    enabled: !!user,
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['neoacademy-orders', accountId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('neoacademy_orders')
        .select('*')
        .eq('account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });

  // Fetch payment links
  const { data: paymentLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ['neoacademy-payment-links', accountId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('neoacademy_payment_links')
        .select('*')
        .eq('account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });

  // Fetch user profiles for displaying names
  const orderUserIds = useMemo(() => [...new Set(orders.map((o: any) => o.user_id))] as string[], [orders]);
  const { data: userProfiles = {} } = useQuery({
    queryKey: ['neoacademy-fin-profiles', orderUserIds],
    queryFn: async () => {
      if (!orderUserIds.length) return {};
      const { data } = await supabase.from('profiles').select('user_id, name, email').in('user_id', orderUserIds.slice(0, 50));
      const map: Record<string, { name: string; email: string }> = {};
      data?.forEach(p => { map[p.user_id] = { name: p.name, email: p.email }; });
      return map;
    },
    enabled: orderUserIds.length > 0,
  });

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = orders.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.amount_cents || 0), 0);
    const pendingAmount = orders.filter((o: any) => o.status === 'pending').reduce((s: number, o: any) => s + (o.amount_cents || 0), 0);
    const overdueCount = orders.filter((o: any) => o.status === 'overdue').length;
    const overdueAmount = orders.filter((o: any) => o.status === 'overdue').reduce((s: number, o: any) => s + (o.amount_cents || 0), 0);
    const subscriptions = orders.filter((o: any) => o.order_type === 'subscription' && o.status === 'paid').length;
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: any) => o.status === 'paid').length;
    return { totalRevenue, pendingAmount, overdueCount, overdueAmount, subscriptions, totalOrders, paidOrders };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o: any) => {
        const profile = userProfiles[o.user_id];
        return (profile?.name?.toLowerCase().includes(q) || profile?.email?.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q));
      });
    }
    if (statusFilter !== 'all') {
      result = result.filter((o: any) => o.status === statusFilter);
    }
    return result;
  }, [orders, search, statusFilter, userProfiles]);

  // Create payment link mutation
  const createPaymentLink = useMutation({
    mutationFn: async () => {
      if (!accountId || !user) throw new Error('No account');
      
      // Call Stripe to create payment link
      const { data, error } = await supabase.functions.invoke('neoacademy-create-payment-link', {
        body: { price_id: newLinkPriceId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save to DB
      const { error: dbError } = await (supabase as any)
        .from('neoacademy_payment_links')
        .insert({
          account_id: accountId,
          created_by: user.authUserId,
          stripe_payment_link_id: data.id,
          stripe_price_id: newLinkPriceId,
          title: newLinkTitle,
          amount_cents: parseInt(newLinkAmount || '0') * 100,
          payment_type: newLinkType,
          url: data.url,
        });
      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-payment-links'] });
      toast.success('Link de pagamento criado!');
      setCreateLinkOpen(false);
      setNewLinkTitle('');
      setNewLinkPriceId('');
      setNewLinkAmount('');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar link'),
  });

  // Mark order as paid/overdue manually
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'paid') updates.paid_at = new Date().toISOString();
      if (status === 'canceled') updates.canceled_at = new Date().toISOString();
      
      const { error } = await (supabase as any)
        .from('neoacademy_orders')
        .update(updates)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-orders'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado!');
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white">Controle Financeiro</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateLinkOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Link2 className="h-4 w-4" />
            Novo Link de Pagamento
          </Button>
        </div>
      </header>

      <div className="px-6 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#14141f] border border-white/5 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 gap-2">
              <AlertTriangle className="h-4 w-4" />
              Inadimplência ({stats.overdueCount})
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 gap-2">
              <Link2 className="h-4 w-4" />
              Links ({paymentLinks.length})
            </TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW ===== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <DollarSign className="h-5 w-5 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-xs text-zinc-500">Receita Total</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <Clock className="h-5 w-5 text-amber-400 mb-2" />
                <div className="text-2xl font-bold text-white">{formatCurrency(stats.pendingAmount)}</div>
                <div className="text-xs text-zinc-500">Pendente</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <AlertTriangle className="h-5 w-5 text-red-400 mb-2" />
                <div className="text-2xl font-bold text-white">{stats.overdueCount}</div>
                <div className="text-xs text-zinc-500">Inadimplentes</div>
                {stats.overdueAmount > 0 && (
                  <div className="text-[10px] text-red-400 mt-1">{formatCurrency(stats.overdueAmount)}</div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <TrendingUp className="h-5 w-5 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">{stats.subscriptions}</div>
                <div className="text-xs text-zinc-500">Recorrências Ativas</div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <div className="text-sm text-zinc-400 mb-1">Total de Ordens</div>
                <div className="text-xl font-bold text-white">{stats.totalOrders}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <div className="text-sm text-zinc-400 mb-1">Pagos</div>
                <div className="text-xl font-bold text-emerald-400">{stats.paidOrders}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <div className="text-sm text-zinc-400 mb-1">Links Ativos</div>
                <div className="text-xl font-bold text-blue-400">{paymentLinks.filter((l: any) => l.is_active).length}</div>
              </div>
            </div>
          </TabsContent>

          {/* ===== ORDERS ===== */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por aluno ou descrição..."
                  className="pl-10 bg-[#14141f] border-white/5 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-[#14141f] border-white/5 text-white">
                  <Filter className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Inadimplentes</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="refunded">Reembolsados</SelectItem>
                  <SelectItem value="canceled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#14141f] border-b border-white/5">
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Aluno</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Descrição</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Valor</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tipo</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Data</span>
                      </th>
                      <th className="text-center px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.map((order: any) => {
                      const profile = userProfiles[order.user_id];
                      const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConf.icon;
                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">{profile?.name || 'Aluno'}</p>
                              <p className="text-[11px] text-zinc-500">{profile?.email || order.user_id.slice(0, 8)}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-zinc-300 truncate max-w-[200px]">{order.description || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-white">{formatCurrency(order.amount_cents, order.currency)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-[10px] ${order.order_type === 'subscription' ? 'border-blue-500/30 text-blue-400' : 'border-zinc-500/30 text-zinc-400'}`}>
                              {order.order_type === 'subscription' ? 'Recorrente' : 'Único'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-[10px] gap-1 ${statusConf.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConf.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-zinc-500">
                              {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/5">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white min-w-[180px]">
                                {order.status !== 'paid' && (
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'paid' })}
                                    className="hover:bg-white/5 cursor-pointer gap-2 text-emerald-400"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Marcar como Pago
                                  </DropdownMenuItem>
                                )}
                                {order.status !== 'overdue' && order.status !== 'paid' && (
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'overdue' })}
                                    className="hover:bg-white/5 cursor-pointer gap-2 text-red-400"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                    Marcar Inadimplente
                                  </DropdownMenuItem>
                                )}
                                {order.status !== 'canceled' && (
                                  <DropdownMenuItem
                                    onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'canceled' })}
                                    className="hover:bg-white/5 cursor-pointer gap-2 text-zinc-400"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Cancelar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum pagamento encontrado</p>
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-600 text-right">
              Exibindo {filteredOrders.length} de {orders.length} pagamentos
            </p>
          </TabsContent>

          {/* ===== OVERDUE ===== */}
          <TabsContent value="overdue" className="space-y-4">
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">Controle de Inadimplência</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Alunos com pagamentos vencidos têm acesso automaticamente bloqueado. Atualize o status para restaurar o acesso.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#14141f] border-b border-white/5">
                      <th className="text-left px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Aluno</span></th>
                      <th className="text-left px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Descrição</span></th>
                      <th className="text-left px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Valor</span></th>
                      <th className="text-left px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Vencimento</span></th>
                      <th className="text-center px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.filter((o: any) => o.status === 'overdue').map((order: any) => {
                      const profile = userProfiles[order.user_id];
                      return (
                        <tr key={order.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">{profile?.name || 'Aluno'}</p>
                            <p className="text-[11px] text-zinc-500">{profile?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{order.description || '—'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-red-400">{formatCurrency(order.amount_cents)}</td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {order.due_date ? format(new Date(order.due_date), 'dd/MM/yyyy') : format(new Date(order.created_at), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'paid' })}
                              className="text-emerald-400 hover:bg-emerald-500/10 h-7 text-xs gap-1"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Regularizar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {orders.filter((o: any) => o.status === 'overdue').length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30 text-emerald-500" />
                  <p className="text-sm text-emerald-400">Nenhum aluno inadimplente!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== PAYMENT LINKS ===== */}
          <TabsContent value="links" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Gerencie links de pagamento para enviar aos alunos</p>
              <Button size="sm" onClick={() => setCreateLinkOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Criar Link
              </Button>
            </div>

            <div className="grid gap-3">
              {paymentLinks.map((link: any) => (
                <div key={link.id} className="p-4 rounded-xl bg-[#14141f] border border-white/5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-400 shrink-0" />
                      <p className="text-sm font-medium text-white truncate">{link.title}</p>
                      <Badge variant="outline" className={`text-[9px] ${link.payment_type === 'subscription' ? 'border-blue-500/30 text-blue-400' : 'border-zinc-500/30 text-zinc-400'}`}>
                        {link.payment_type === 'subscription' ? 'Recorrente' : 'Único'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-zinc-500">{formatCurrency(link.amount_cents)}</span>
                      <span className="text-xs text-zinc-600">{link.usage_count || 0} usos</span>
                      <span className="text-xs text-zinc-600">
                        Criado {formatDistanceToNow(new Date(link.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {link.url && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(link.url)}
                          className="text-zinc-400 hover:text-white hover:bg-white/5 h-8 gap-1"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(link.url, '_blank')}
                          className="text-blue-400 hover:bg-blue-500/10 h-8 gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {paymentLinks.length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum link de pagamento criado</p>
                  <Button size="sm" variant="ghost" onClick={() => setCreateLinkOpen(true)} className="mt-2 text-blue-400">
                    Criar primeiro link
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Payment Link Dialog */}
      <Dialog open={createLinkOpen} onOpenChange={setCreateLinkOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-400" />
              Criar Link de Pagamento
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newLinkTitle.trim()) { toast.error('Informe um título'); return; }
              if (!newLinkPriceId.trim()) { toast.error('Informe o Price ID do Stripe'); return; }
              createPaymentLink.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Título *</label>
              <Input
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Ex: Formação 360° - Pagamento"
                className="bg-[#0a0a0f] border-white/10 text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Stripe Price ID *</label>
              <Input
                value={newLinkPriceId}
                onChange={(e) => setNewLinkPriceId(e.target.value)}
                placeholder="price_..."
                className="bg-[#0a0a0f] border-white/10 text-white"
                required
              />
              <p className="text-[10px] text-zinc-600 mt-1">ID do preço configurado no Stripe</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Valor (R$)</label>
              <Input
                type="number"
                value={newLinkAmount}
                onChange={(e) => setNewLinkAmount(e.target.value)}
                placeholder="0.00"
                className="bg-[#0a0a0f] border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Tipo</label>
              <Select value={newLinkType} onValueChange={(v: any) => setNewLinkType(v)}>
                <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectItem value="one_time">Pagamento Único</SelectItem>
                  <SelectItem value="subscription">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateLinkOpen(false)} className="text-zinc-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={createPaymentLink.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {createPaymentLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Criar Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
