/**
 * CPG Advocacia Médica - Gestão de Parcelas do Contrato
 * Resumo rápido, lista de parcelas, histórico de pagamentos e gráficos
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
  History,
  PieChart,
  Settings,
  MoreVertical,
  Banknote,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isPast, differenceInDays, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, LineChart, Line } from "recharts";

interface ClientContractInstallmentsProps {
  clientId: string;
  clientName: string;
}

interface Installment {
  id: string;
  contract_id: string;
  client_id: string;
  installment_number: number;
  description: string | null;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  late_fee: number;
  interest: number;
  discount: number;
  notes: string | null;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  installment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
}

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  total_value: number | null;
  installment_count: number | null;
  down_payment: number | null;
  payment_due_day: number | null;
  value: number | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
];

export function ClientContractInstallments({ clientId, clientName }: ClientContractInstallmentsProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("parcelas");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Form state for payment registration
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'pix',
    reference: '',
    notes: '',
  });

  // Form state for generating installments
  const [generateForm, setGenerateForm] = useState({
    contractId: '',
    totalValue: '',
    downPayment: '0',
    installmentCount: '12',
    startDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    dueDay: '10',
  });

  // Fetch contracts for this client
  const { data: contracts = [] } = useQuery({
    queryKey: ['client-contracts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_contracts')
        .select('id, contract_number, title, total_value, installment_count, down_payment, payment_due_day, value')
        .or(`client_id.eq.${clientId},partner1_client_id.eq.${clientId},partner2_client_id.eq.${clientId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!clientId,
  });

  // Fetch installments for this client
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['client-installments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_contract_installments')
        .select('*')
        .eq('client_id', clientId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Auto-update overdue status
      const now = new Date();
      return (data || []).map(inst => ({
        ...inst,
        status: inst.status === 'pending' && isPast(new Date(inst.due_date)) 
          ? 'overdue' 
          : inst.status
      })) as Installment[];
    },
    enabled: !!clientId,
  });

  // Fetch payment history
  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['client-payment-history', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_payment_history')
        .select('*')
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as PaymentHistory[];
    },
    enabled: !!clientId,
  });

  // Calculate summary stats
  const summary = {
    total: installments.reduce((sum, inst) => sum + inst.amount, 0),
    paid: installments.filter(i => i.status === 'paid').reduce((sum, inst) => sum + (inst.paid_amount || inst.amount), 0),
    pending: installments.filter(i => i.status === 'pending').reduce((sum, inst) => sum + inst.amount, 0),
    overdue: installments.filter(i => i.status === 'overdue').reduce((sum, inst) => sum + inst.amount + inst.late_fee + inst.interest, 0),
    totalCount: installments.length,
    paidCount: installments.filter(i => i.status === 'paid').length,
    pendingCount: installments.filter(i => i.status === 'pending').length,
    overdueCount: installments.filter(i => i.status === 'overdue').length,
  };

  const paymentProgress = summary.total > 0 ? (summary.paid / summary.total) * 100 : 0;

  // Generate installments mutation
  const generateInstallments = useMutation({
    mutationFn: async () => {
      const total = parseFloat(generateForm.totalValue);
      const down = parseFloat(generateForm.downPayment) || 0;
      const count = parseInt(generateForm.installmentCount);
      const remaining = total - down;
      const perInstallment = remaining / count;
      const startDate = new Date(generateForm.startDate);
      const dueDay = parseInt(generateForm.dueDay);

      const installmentsToCreate = [];

      // Add down payment if exists
      if (down > 0) {
        installmentsToCreate.push({
          contract_id: generateForm.contractId,
          client_id: clientId,
          installment_number: 0,
          description: 'Entrada',
          amount: down,
          due_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'pending',
        });
      }

      // Add regular installments
      for (let i = 0; i < count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(dueDay);

        installmentsToCreate.push({
          contract_id: generateForm.contractId,
          client_id: clientId,
          installment_number: i + 1,
          description: `Parcela ${i + 1}/${count}`,
          amount: Math.round(perInstallment * 100) / 100,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          status: 'pending',
        });
      }

      const { error } = await supabase
        .from('ipromed_contract_installments')
        .insert(installmentsToCreate);

      if (error) throw error;

      // Update contract with total value
      await supabase
        .from('ipromed_contracts')
        .update({
          total_value: total,
          installment_count: count,
          down_payment: down,
          payment_due_day: dueDay,
        })
        .eq('id', generateForm.contractId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-installments'] });
      queryClient.invalidateQueries({ queryKey: ['client-contracts'] });
      setIsGenerateOpen(false);
      toast.success('Parcelas geradas com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao gerar parcelas: ' + error.message);
    },
  });

  // Register payment mutation
  const registerPayment = useMutation({
    mutationFn: async () => {
      if (!selectedInstallment) return;

      const paidAmount = parseFloat(paymentForm.amount);

      // Insert payment history
      const { error: historyError } = await supabase
        .from('ipromed_payment_history')
        .insert({
          installment_id: selectedInstallment.id,
          contract_id: selectedInstallment.contract_id,
          client_id: clientId,
          amount: paidAmount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference: paymentForm.reference || null,
          notes: paymentForm.notes || null,
        });

      if (historyError) throw historyError;

      // Update installment status
      const { error: updateError } = await supabase
        .from('ipromed_contract_installments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_amount: paidAmount,
          payment_method: paymentForm.payment_method,
          payment_reference: paymentForm.reference || null,
        })
        .eq('id', selectedInstallment.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-installments'] });
      queryClient.invalidateQueries({ queryKey: ['client-payment-history'] });
      setIsPaymentOpen(false);
      setSelectedInstallment(null);
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    },
  });

  // Prepare chart data
  const chartData = installments.map(inst => ({
    name: inst.description || `P${inst.installment_number}`,
    valor: inst.amount,
    status: inst.status,
  }));

  const monthlyData = installments.reduce((acc, inst) => {
    const month = format(new Date(inst.due_date), 'MMM/yy', { locale: ptBR });
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.previsto += inst.amount;
      if (inst.status === 'paid') existing.pago += (inst.paid_amount || inst.amount);
    } else {
      acc.push({
        month,
        previsto: inst.amount,
        pago: inst.status === 'paid' ? (inst.paid_amount || inst.amount) : 0,
      });
    }
    return acc;
  }, [] as { month: string; previsto: number; pago: number }[]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Vencida</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const openPaymentModal = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentForm({
      amount: installment.amount.toString(),
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'pix',
      reference: '',
      notes: '',
    });
    setIsPaymentOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
              <CreditCard className="h-4 w-4" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription>Honorários e pagamentos</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {summary.overdueCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {summary.overdueCount} vencida(s)
              </Badge>
            )}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Total Contrato</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(summary.total)}</p>
              <p className="text-xs text-muted-foreground">{summary.totalCount} parcelas</p>
            </div>
            
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Pago</span>
              </div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.paid)}</p>
              <p className="text-xs text-emerald-600/70">{summary.paidCount} parcela(s)</p>
            </div>
            
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Pendente</span>
              </div>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatCurrency(summary.pending)}</p>
              <p className="text-xs text-amber-600/70">{summary.pendingCount} parcela(s)</p>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg border",
              summary.overdueCount > 0 
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                : "bg-muted/50"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-1",
                summary.overdueCount > 0 ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"
              )}>
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Vencido</span>
              </div>
              <p className={cn(
                "text-lg font-bold",
                summary.overdueCount > 0 ? "text-rose-700 dark:text-rose-400" : ""
              )}>{formatCurrency(summary.overdue)}</p>
              <p className={cn(
                "text-xs",
                summary.overdueCount > 0 ? "text-rose-600/70" : "text-muted-foreground"
              )}>{summary.overdueCount} parcela(s)</p>
            </div>
          </div>

          {/* Progress Bar */}
          {summary.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso de Pagamento</span>
                <span className="font-medium">{Math.round(paymentProgress)}%</span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>
          )}

          <Separator />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="parcelas" className="gap-1">
                  <Receipt className="h-3 w-3" />
                  Parcelas
                </TabsTrigger>
                <TabsTrigger value="historico" className="gap-1">
                  <History className="h-3 w-3" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="grafico" className="gap-1">
                  <PieChart className="h-3 w-3" />
                  Gráficos
                </TabsTrigger>
              </TabsList>
              
              <Button size="sm" onClick={() => setIsGenerateOpen(true)} className="gap-1">
                <Plus className="h-3 w-3" />
                Gerar Parcelas
              </Button>
            </div>

            {/* Parcelas Tab */}
            <TabsContent value="parcelas" className="mt-4">
              {installments.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Nº</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installments.map((inst) => {
                        const daysOverdue = inst.status === 'overdue' 
                          ? differenceInDays(new Date(), new Date(inst.due_date))
                          : 0;
                        
                        return (
                          <TableRow 
                            key={inst.id}
                            className={cn(
                              inst.status === 'overdue' && "bg-rose-50/50 dark:bg-rose-950/20"
                            )}
                          >
                            <TableCell className="font-medium">
                              {inst.installment_number === 0 ? 'ENT' : inst.installment_number}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{inst.description || `Parcela ${inst.installment_number}`}</p>
                                {inst.notes && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{inst.notes}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{format(new Date(inst.due_date), "dd/MM/yyyy")}</span>
                                {daysOverdue > 0 && (
                                  <Badge variant="destructive" className="text-[10px] px-1">
                                    {daysOverdue}d
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(inst.amount)}
                              {(inst.late_fee > 0 || inst.interest > 0) && (
                                <div className="text-xs text-rose-600">
                                  +{formatCurrency(inst.late_fee + inst.interest)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(inst.status)}</TableCell>
                            <TableCell>
                              {inst.status !== 'paid' && inst.status !== 'cancelled' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => openPaymentModal(inst)}
                                      >
                                        <Banknote className="h-4 w-4 text-emerald-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Registrar pagamento</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {inst.status === 'paid' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center h-8 w-8">
                                        <Check className="h-4 w-4 text-emerald-600" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Pago em {inst.paid_at ? format(new Date(inst.paid_at), "dd/MM/yyyy") : '-'}
                                      {inst.payment_method && ` via ${paymentMethods.find(m => m.value === inst.payment_method)?.label || inst.payment_method}`}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground mb-2">Nenhuma parcela cadastrada</p>
                  <Button size="sm" onClick={() => setIsGenerateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Parcelas
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Histórico Tab */}
            <TabsContent value="historico" className="mt-4">
              {paymentHistory.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                            <Banknote className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Pagamento recebido
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.payment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              {payment.payment_method && ` • ${paymentMethods.find(m => m.value === payment.payment_method)?.label || payment.payment_method}`}
                            </p>
                            {payment.reference && (
                              <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">
                            +{formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                </div>
              )}
            </TabsContent>

            {/* Gráficos Tab */}
            <TabsContent value="grafico" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Previsão vs Realizado por Mês</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Bar dataKey="previsto" fill="hsl(var(--muted-foreground))" name="Previsto" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pago" fill="hsl(142.1 76.2% 36.3%)" name="Pago" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{Math.round(paymentProgress)}%</p>
                    <p className="text-xs text-muted-foreground">Adimplência</p>
                  </div>
                  <div>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mb-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{summary.pendingCount}</p>
                    <p className="text-xs text-muted-foreground">Parcelas Futuras</p>
                  </div>
                  <div>
                    <div className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-full mb-2",
                      summary.overdueCount > 0 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-400"
                    )}>
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{summary.overdueCount}</p>
                    <p className="text-xs text-muted-foreground">Em Atraso</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}

      {/* Generate Installments Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Parcelas</DialogTitle>
            <DialogDescription>Configure as parcelas do contrato</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Contrato <span className="text-destructive">*</span></Label>
              <Select
                value={generateForm.contractId}
                onValueChange={(v) => setGenerateForm({ ...generateForm, contractId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.contract_number} - {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Total (R$) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={generateForm.totalValue}
                  onChange={(e) => setGenerateForm({ ...generateForm, totalValue: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Entrada (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={generateForm.downPayment}
                  onChange={(e) => setGenerateForm({ ...generateForm, downPayment: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nº de Parcelas <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  value={generateForm.installmentCount}
                  onChange={(e) => setGenerateForm({ ...generateForm, installmentCount: e.target.value })}
                />
              </div>
              <div>
                <Label>Dia de Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={generateForm.dueDay}
                  onChange={(e) => setGenerateForm({ ...generateForm, dueDay: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Início das Parcelas</Label>
              <Input
                type="date"
                value={generateForm.startDate}
                onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
              />
            </div>

            {generateForm.totalValue && generateForm.installmentCount && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="font-medium">Resumo:</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {parseFloat(generateForm.downPayment) > 0 && (
                    <li>• Entrada: {formatCurrency(parseFloat(generateForm.downPayment))}</li>
                  )}
                  <li>
                    • {generateForm.installmentCount}x de{' '}
                    {formatCurrency(
                      (parseFloat(generateForm.totalValue) - (parseFloat(generateForm.downPayment) || 0)) /
                      parseInt(generateForm.installmentCount)
                    )}
                  </li>
                  <li>• Total: {formatCurrency(parseFloat(generateForm.totalValue))}</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => generateInstallments.mutate()}
              disabled={!generateForm.contractId || !generateForm.totalValue || generateInstallments.isPending}
            >
              {generateInstallments.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gerar Parcelas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Registration Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {selectedInstallment && (
                <>Parcela {selectedInstallment.installment_number}: {formatCurrency(selectedInstallment.amount)}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Pago (R$) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Referência/Comprovante</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Nº do comprovante, transação, etc."
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Anotações sobre o pagamento..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => registerPayment.mutate()}
              disabled={!paymentForm.amount || registerPayment.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {registerPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
