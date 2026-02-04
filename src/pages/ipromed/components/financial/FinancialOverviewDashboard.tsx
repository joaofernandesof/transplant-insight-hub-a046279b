/**
 * CPG Advocacia Médica - Financial Overview Dashboard
 * Dashboard completo com gráficos, filtros de período e insights
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Calendar as CalendarIcon,
  Filter,
  ChevronRight,
  Banknote,
  PiggyBank,
  CreditCard,
  ArrowRight,
  BadgePercent,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, startOfWeek, endOfWeek, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface Installment {
  id: string;
  client_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at: string | null;
  paid_amount: number | null;
}

interface PaymentHistory {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  client_id: string;
}

interface Client {
  id: string;
  name: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatShortCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return formatCurrency(value);
};

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
  { value: 'custom', label: 'Personalizado' },
];

const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
  cheque: 'Cheque',
};

export default function FinancialOverviewDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: now, end: now };
      case 'week':
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return customDateRange?.from && customDateRange?.to 
          ? { start: customDateRange.from, end: customDateRange.to }
          : { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, customDateRange]);

  // Fetch installments
  const { data: installments = [], isLoading: loadingInstallments } = useQuery({
    queryKey: ['financial-installments-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_contract_installments')
        .select('id, client_id, amount, due_date, status, paid_at, paid_amount')
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Auto-update overdue status
      const now = new Date();
      return (data || []).map(inst => ({
        ...inst,
        status: inst.status === 'pending' && new Date(inst.due_date) < now ? 'overdue' : inst.status
      })) as Installment[];
    },
  });

  // Fetch payment history
  const { data: paymentHistory = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['financial-payments-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_payment_history')
        .select('id, amount, payment_date, payment_method, client_id')
        .order('payment_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PaymentHistory[];
    },
  });

  // Fetch clients for names
  const { data: clients = [] } = useQuery({
    queryKey: ['financial-clients-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name');

      if (error) throw error;
      return data as Client[];
    },
  });

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  // Filter data by date range
  const filteredInstallments = useMemo(() => {
    return installments.filter(inst => {
      const dueDate = parseISO(inst.due_date);
      return isWithinInterval(dueDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [installments, dateRange]);

  const filteredPayments = useMemo(() => {
    return paymentHistory.filter(p => {
      const payDate = parseISO(p.payment_date);
      return isWithinInterval(payDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [paymentHistory, dateRange]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalReceivable = filteredInstallments.reduce((sum, i) => sum + i.amount, 0);
    const received = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const pending = filteredInstallments.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const overdue = filteredInstallments.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
    const overdueCount = filteredInstallments.filter(i => i.status === 'overdue').length;
    const paidCount = filteredInstallments.filter(i => i.status === 'paid').length;
    const pendingCount = filteredInstallments.filter(i => i.status === 'pending').length;
    
    // Clients analysis
    const clientStats = new Map<string, { total: number; paid: number; overdue: number }>();
    installments.forEach(inst => {
      if (!clientStats.has(inst.client_id)) {
        clientStats.set(inst.client_id, { total: 0, paid: 0, overdue: 0 });
      }
      const stat = clientStats.get(inst.client_id)!;
      stat.total += inst.amount;
      if (inst.status === 'paid') stat.paid += (inst.paid_amount || inst.amount);
      if (inst.status === 'overdue') stat.overdue += inst.amount;
    });
    
    const clientsWithDebt = Array.from(clientStats.entries()).filter(([, s]) => s.overdue > 0).length;
    const clientsAdimplentes = Array.from(clientStats.entries()).filter(([, s]) => s.overdue === 0 && s.total > 0).length;
    
    // Projections (next 30 days)
    const next30Days = subDays(new Date(), -30);
    const projectedIncome = installments
      .filter(i => i.status === 'pending' && parseISO(i.due_date) <= next30Days)
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalReceivable,
      received,
      pending,
      overdue,
      overdueCount,
      paidCount,
      pendingCount,
      clientsWithDebt,
      clientsAdimplentes,
      totalClients: clientStats.size,
      projectedIncome,
      adimplenciaRate: (filteredInstallments.length > 0) 
        ? ((paidCount / filteredInstallments.length) * 100) 
        : 100,
    };
  }, [filteredInstallments, filteredPayments, installments]);

  // Balance timeline (for chart)
  const balanceTimeline = useMemo(() => {
    const days = differenceInDays(dateRange.end, dateRange.start) + 1;
    const timeline: { date: string; entradas: number; saidas: number; saldo: number }[] = [];
    
    let runningBalance = 0;
    
    for (let i = 0; i < Math.min(days, 31); i++) {
      const date = subDays(dateRange.end, days - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayLabel = format(date, 'dd/MM');
      
      const dayPayments = filteredPayments.filter(p => 
        format(parseISO(p.payment_date), 'yyyy-MM-dd') === dateStr
      );
      const dayIncome = dayPayments.reduce((sum, p) => sum + p.amount, 0);
      
      runningBalance += dayIncome;
      
      timeline.push({
        date: dayLabel,
        entradas: dayIncome,
        saidas: 0, // Would need accounts payable for this
        saldo: runningBalance,
      });
    }
    
    return timeline;
  }, [dateRange, filteredPayments]);

  // Payment methods distribution
  const paymentMethodStats = useMemo(() => {
    const stats = new Map<string, number>();
    filteredPayments.forEach(p => {
      const method = p.payment_method || 'outro';
      stats.set(method, (stats.get(method) || 0) + p.amount);
    });
    
    return Array.from(stats.entries()).map(([method, amount]) => ({
      name: paymentMethodLabels[method] || method,
      value: amount,
    }));
  }, [filteredPayments]);

  // Clients ranking (debtors)
  const topDebtors = useMemo(() => {
    const clientDebt = new Map<string, number>();
    installments.filter(i => i.status === 'overdue').forEach(inst => {
      clientDebt.set(inst.client_id, (clientDebt.get(inst.client_id) || 0) + inst.amount);
    });
    
    return Array.from(clientDebt.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clientId, amount]) => ({
        clientId,
        name: clientMap.get(clientId) || 'Cliente',
        amount,
      }));
  }, [installments, clientMap]);

  // Latest payments
  const latestPayments = filteredPayments.slice(0, 6);

  // Colors for charts
  const chartColors = {
    primary: 'hsl(142.1 76.2% 36.3%)', // emerald
    secondary: 'hsl(221.2 83.2% 53.3%)', // blue
    destructive: 'hsl(0 84.2% 60.2%)', // rose
    warning: 'hsl(45.4 93.4% 47.5%)', // amber
  };

  const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  const isLoading = loadingInstallments || loadingPayments;

  return (
    <div className="space-y-6">
      {/* Period Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={period === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    "text-xs h-8",
                    period === opt.value && "bg-primary text-primary-foreground"
                  )}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {period === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {customDateRange?.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "dd/MM/yy")} - {format(customDateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(customDateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Selecionar datas"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={customDateRange}
                    onSelect={setCustomDateRange}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="ml-auto text-xs text-muted-foreground">
              {format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} até {format(dateRange.end, "dd 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">Recebido</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {formatCurrency(summary.received)}
                  </p>
                )}
                <p className="text-xs text-emerald-600/70 mt-1">{summary.paidCount} pagamentos</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">A Receber</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                    {formatCurrency(summary.pending)}
                  </p>
                )}
                <p className="text-xs text-amber-600/70 mt-1">{summary.pendingCount} parcelas</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border",
          summary.overdueCount > 0 
            ? "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/50 dark:to-rose-900/30 border-rose-200 dark:border-rose-800"
            : "bg-muted/30"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className={cn(
                  "text-xs font-medium mb-1",
                  summary.overdueCount > 0 ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"
                )}>Vencido</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className={cn(
                    "text-2xl font-bold",
                    summary.overdueCount > 0 ? "text-rose-800 dark:text-rose-200" : ""
                  )}>
                    {formatCurrency(summary.overdue)}
                  </p>
                )}
                <p className={cn(
                  "text-xs mt-1",
                  summary.overdueCount > 0 ? "text-rose-600/70" : "text-muted-foreground"
                )}>{summary.overdueCount} parcelas</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg",
                summary.overdueCount > 0 ? "bg-rose-500/10" : "bg-muted"
              )}>
                <AlertCircle className={cn(
                  "h-5 w-5",
                  summary.overdueCount > 0 ? "text-rose-600" : "text-muted-foreground"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Projeção 30d</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {formatCurrency(summary.projectedIncome)}
                  </p>
                )}
                <p className="text-xs text-blue-600/70 mt-1">previsão de entrada</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Timeline Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução do Saldo
            </CardTitle>
            <CardDescription>Entradas e saldo acumulado no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceTimeline}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickFormatter={(v) => formatShortCurrency(v)}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke={chartColors.primary} 
                    fillOpacity={1} 
                    fill="url(#colorSaldo)" 
                    name="Saldo"
                  />
                  <Bar dataKey="entradas" fill={chartColors.secondary} name="Entradas" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Formas de Pagamento
            </CardTitle>
            <CardDescription>Distribuição no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {paymentMethodStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentMethodStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--background))'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Sem pagamentos no período</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Clients & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Análise de Clientes
            </CardTitle>
            <CardDescription>Adimplência e inadimplência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">Adimplentes</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {summary.clientsAdimplentes}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-lg border",
                summary.clientsWithDebt > 0 
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                  : "bg-muted/50"
              )}>
                <div className="flex items-center gap-2">
                  <AlertCircle className={cn(
                    "h-4 w-4",
                    summary.clientsWithDebt > 0 ? "text-rose-600" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs",
                    summary.clientsWithDebt > 0 ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"
                  )}>Inadimplentes</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  summary.clientsWithDebt > 0 ? "text-rose-700 dark:text-rose-300" : ""
                )}>
                  {summary.clientsWithDebt}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Taxa de Adimplência
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(summary.adimplenciaRate, 100)}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  {Math.round(summary.adimplenciaRate)}%
                </span>
              </div>
            </div>

            {topDebtors.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Maiores Devedores</p>
                  <div className="space-y-2">
                    {topDebtors.slice(0, 3).map((debtor, i) => (
                      <div key={debtor.clientId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-medium">
                            {i + 1}
                          </span>
                          <span className="truncate max-w-[120px]">{debtor.name}</span>
                        </div>
                        <span className="font-medium text-rose-600">{formatCurrency(debtor.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Latest Payments */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              Últimos Pagamentos
            </CardTitle>
            <CardDescription>Recebimentos mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-2">
              {latestPayments.length > 0 ? (
                <div className="space-y-3">
                  {latestPayments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                          <Banknote className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{clientMap.get(payment.client_id) || 'Cliente'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(payment.payment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {payment.payment_method && ` • ${paymentMethodLabels[payment.payment_method] || payment.payment_method}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">+{formatCurrency(payment.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum pagamento no período</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-primary" />
            Insights Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.overdueCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-rose-800 dark:text-rose-200">Atenção ao Vencido</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {summary.overdueCount} parcela(s) vencida(s) totalizando {formatCurrency(summary.overdue)}. 
                    Entre em contato com os clientes.
                  </p>
                </div>
              </div>
            )}
            
            {summary.adimplenciaRate >= 80 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Boa Adimplência</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Taxa de {Math.round(summary.adimplenciaRate)}% de pagamentos em dia. Excelente desempenho!
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <TrendingUp className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Previsão</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Expectativa de {formatCurrency(summary.projectedIncome)} nos próximos 30 dias com base nas parcelas pendentes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
