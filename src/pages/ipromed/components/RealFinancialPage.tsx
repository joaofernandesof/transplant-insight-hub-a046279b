/**
 * IPROMED - Financeiro Real (com banco de dados)
 * Substituindo dados mockados por integração real
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  Loader2,
  FileText,
  QrCode,
} from "lucide-react";
import { format, isPast, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Invoice {
  id: string;
  client_id: string | null;
  case_id: string | null;
  invoice_number: string | null;
  description: string;
  amount: number;
  invoice_type: string;
  category: string | null;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  created_at: string;
  ipromed_legal_clients?: { name: string } | null;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Atrasado', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

const invoiceTypeLabels: Record<string, string> = {
  honorario: 'Honorários',
  despesa: 'Despesa',
  adiantamento: 'Adiantamento',
  reembolso: 'Reembolso',
};

export default function RealFinancialPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    description: '',
    amount: '',
    invoice_type: 'honorario',
    category: '',
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
  });

  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['ipromed-invoices', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_invoices')
        .select(`
          *,
          ipromed_legal_clients(name)
        `)
        .order('due_date', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Auto-update overdue status
      const now = new Date();
      return (data as Invoice[]).map(inv => ({
        ...inv,
        status: inv.status === 'pending' && isPast(new Date(inv.due_date)) && !isToday(new Date(inv.due_date))
          ? 'overdue' as const
          : inv.status,
      }));
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Create invoice
  const createInvoice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ipromed_invoices')
        .insert([{
          client_id: formData.client_id || null,
          description: formData.description,
          amount: parseFloat(formData.amount),
          invoice_type: formData.invoice_type,
          category: formData.category || null,
          due_date: formData.due_date,
          invoice_number: `INV-${Date.now()}`,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-invoices'] });
      toast.success('Fatura criada com sucesso!');
      setIsFormOpen(false);
      setFormData({
        client_id: '',
        description: '',
        amount: '',
        invoice_type: 'honorario',
        category: '',
        due_date: addDays(new Date(), 30).toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar fatura: ' + error.message);
    },
  });

  // Mark as paid
  const markAsPaid = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('ipromed_invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-invoices'] });
      toast.success('Pagamento registrado!');
    },
  });

  // Filter by search
  const filteredInvoices = invoices.filter(inv => 
    inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.ipromed_legal_clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    received: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0),
    pending: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0),
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de honorários e cobranças
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Plus className="h-4 w-4" />
              Nova Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Fatura</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Consulta jurídica preventiva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.invoice_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, invoice_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="honorario">Honorários</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="adiantamento">Adiantamento</SelectItem>
                      <SelectItem value="reembolso">Reembolso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                      <SelectItem value="contencioso">Contencioso</SelectItem>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="contratos">Contratos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => createInvoice.mutate()}
                  disabled={!formData.description || !formData.amount || createInvoice.isPending}
                  className="bg-[#0066CC]"
                >
                  {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Fatura
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Recebido</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats.received)}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">A Receber</div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(stats.pending)}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Atrasados</div>
                <div className="text-2xl font-bold text-rose-600">
                  {formatCurrency(stats.overdue)}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Previsto</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.received + stats.pending)}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#0066CC]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar faturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Nenhuma fatura encontrada</p>
              <p className="text-sm">Crie sua primeira fatura</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">CLIENTE</TableHead>
                  <TableHead className="text-xs font-semibold">DESCRIÇÃO</TableHead>
                  <TableHead className="text-xs font-semibold">VALOR</TableHead>
                  <TableHead className="text-xs font-semibold">VENCIMENTO</TableHead>
                  <TableHead className="text-xs font-semibold">TIPO</TableHead>
                  <TableHead className="text-xs font-semibold">STATUS</TableHead>
                  <TableHead className="text-xs font-semibold w-[120px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={invoice.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {invoice.ipromed_legal_clients?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{invoice.description}</div>
                        {invoice.invoice_number && (
                          <div className="text-xs text-muted-foreground">
                            {invoice.invoice_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(invoice.amount))}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invoiceTypeLabels[invoice.invoice_type] || invoice.invoice_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => markAsPaid.mutate(invoice.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ContaAzul Integration Notice */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Integração ContaAzul
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                A sincronização automática com o ContaAzul está em preparação para importação de notas fiscais e conciliação bancária.
              </p>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Em breve
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
