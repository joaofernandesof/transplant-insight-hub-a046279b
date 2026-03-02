/**
 * AccountsPage - Contas a Pagar e Receber
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus, ArrowUpRight, ArrowDownLeft, Search,
  DollarSign, Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

type EntryType = 'payable' | 'receivable';

interface FormData {
  description: string;
  category: string;
  amount: string;
  due_date: string;
  supplier_or_client: string;
  branch: string;
  payment_method: string;
  notes: string;
}

const emptyForm: FormData = {
  description: '', category: 'geral', amount: '', due_date: '',
  supplier_or_client: '', branch: '', payment_method: '', notes: '',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function AccountsPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EntryType>('payable');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');

  const tableName = activeTab === 'payable' ? 'neoteam_accounts_payable' : 'neoteam_accounts_receivable';

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['accounts', activeTab, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from(tableName)
        .select('*')
        .order('due_date', { ascending: true });

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const createEntry = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        description: form.description.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        branch: form.branch || null,
        payment_method: form.payment_method || null,
        notes: form.notes || null,
        created_by: user?.authUserId,
      };

      if (activeTab === 'payable') {
        payload.supplier = form.supplier_or_client || null;
      } else {
        payload.client_name = form.supplier_or_client || null;
      }

      const { error } = await supabase.from(tableName).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setDialogOpen(false);
      setForm(emptyForm);
      toast.success(activeTab === 'payable' ? 'Conta a pagar criada' : 'Conta a receber criada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markAsDone = useMutation({
    mutationFn: async (id: string) => {
      const dateField = activeTab === 'payable' ? 'paid_date' : 'received_date';
      const statusValue = activeTab === 'payable' ? 'pago' : 'recebido';
      const { error } = await supabase
        .from(tableName)
        .update({ status: statusValue, [dateField]: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Status atualizado');
    },
  });

  const filtered = entries.filter((e: any) =>
    !search || e.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = filtered
    .filter((e: any) => e.status === 'pendente')
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <GlobalBreadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Contas a Pagar e Receber
          </h1>
          <p className="text-muted-foreground text-sm">Gestão financeira do NeoTeam</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntryType)}>
        <TabsList>
          <TabsTrigger value="payable" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            A Pagar
          </TabsTrigger>
          <TabsTrigger value="receivable" className="gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            A Receber
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value={activeTab === 'payable' ? 'pago' : 'recebido'}>
                {activeTab === 'payable' ? 'Pago' : 'Recebido'}
              </SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <Card className="mt-4 border-0 shadow-sm">
          <CardContent className="p-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filtered.length} registros • Total pendente:
            </span>
            <span className="font-bold text-lg">{formatCurrency(totalPending)}</span>
          </CardContent>
        </Card>

        {/* Table */}
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma conta encontrada
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry: any) => {
                const isPayable = activeTab === 'payable';
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = entry.status === 'pendente' && entry.due_date < today;

                return (
                  <Card key={entry.id} className={`border-0 shadow-sm ${isOverdue ? 'ring-1 ring-red-300 dark:ring-red-800' : ''}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPayable ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                          {isPayable
                            ? <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                            : <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.category} • {format(parseISO(entry.due_date), 'dd/MM/yyyy')}
                            {isOverdue && <span className="text-red-500 ml-1 font-medium">• Vencido</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-semibold ${isPayable ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatCurrency(Number(entry.amount))}
                        </p>
                        {entry.status === 'pendente' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsDone.mutate(entry.id)}
                            disabled={markAsDone.isPending}
                          >
                            {isPayable ? 'Pagar' : 'Receber'}
                          </Button>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          entry.status === 'pago' || entry.status === 'recebido' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nova Conta {activeTab === 'payable' ? 'a Pagar' : 'a Receber'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Aluguel janeiro"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Ex: Aluguel, Fornecedores"
              />
            </div>
            <div>
              <Label>{activeTab === 'payable' ? 'Fornecedor' : 'Cliente'}</Label>
              <Input
                value={form.supplier_or_client}
                onChange={(e) => setForm(f => ({ ...f, supplier_or_client: e.target.value }))}
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input
                value={form.branch}
                onChange={(e) => setForm(f => ({ ...f, branch: e.target.value }))}
                placeholder="Ex: Fortaleza, Juazeiro"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createEntry.mutate()}
              disabled={!form.description || !form.amount || !form.due_date || createEntry.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
