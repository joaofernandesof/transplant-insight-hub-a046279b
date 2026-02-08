/**
 * IPROMED Financial - Contas a Pagar
 * Gestão de despesas do escritório jurídico - COM PERSISTÊNCIA
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
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
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  Briefcase,
  FileText,
  Percent,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePayables, Payable, PayableInsert } from "../../hooks/usePayables";

const categories = [
  { value: 'prolabore', label: 'Pró-labore', icon: Users },
  { value: 'folha', label: 'Folha de Pagamento', icon: Users },
  { value: 'estagiarios', label: 'Estagiários', icon: Briefcase },
  { value: 'correspondente', label: 'Correspondente Jurídico', icon: Building },
  { value: 'perito', label: 'Peritos', icon: FileText },
  { value: 'custas', label: 'Custas Processuais', icon: FileText },
  { value: 'diligencias', label: 'Diligências', icon: Briefcase },
  { value: 'marketing', label: 'Marketing', icon: Percent },
  { value: 'software', label: 'Softwares Jurídicos', icon: FileText },
  { value: 'aluguel', label: 'Aluguel', icon: Building },
  { value: 'impostos', label: 'Impostos', icon: FileText },
  { value: 'outros', label: 'Outros', icon: FileText },
];

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  vencido: { label: 'Vencido', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Mock data for fallback when DB is empty
const mockPayables: Payable[] = [
  { id: 'mock-1', user_id: '', description: 'Pró-labore - Janeiro', supplier: 'Sócio 1', amount: 15000, due_date: '2026-01-30', status: 'pendente', category: 'prolabore', created_at: '', updated_at: '' },
  { id: 'mock-2', user_id: '', description: 'Perito - Processo 001', supplier: 'Dr. Carlos Mendes', amount: 3500, due_date: '2026-02-05', status: 'pendente', category: 'perito', created_at: '', updated_at: '' },
  { id: 'mock-3', user_id: '', description: 'Custas - TRT', supplier: 'TRT-15', amount: 850, due_date: '2026-01-25', status: 'vencido', category: 'custas', created_at: '', updated_at: '' },
  { id: 'mock-4', user_id: '', description: 'Software Jurídico - Mensal', supplier: 'Astrea', amount: 450, due_date: '2026-01-15', status: 'pago', payment_date: '2026-01-14', category: 'software', created_at: '', updated_at: '' },
];

export default function AccountsPayable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<PayableInsert>>({
    description: '',
    supplier: '',
    amount: 0,
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
    category: 'outros',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');

  const { 
    payables: dbPayables, 
    isLoading, 
    stats: dbStats,
    createPayable, 
    markAsPaid,
    deletePayable,
    isCreating,
    isUpdating,
  } = usePayables();

  // Use DB data if available, otherwise fallback to mock
  const payables = dbPayables.length > 0 ? dbPayables : mockPayables;
  const isUsingMock = dbPayables.length === 0;

  // Apply status updates for overdue items
  const processedPayables = payables.map(p => ({
    ...p,
    status: p.status === 'pendente' && isPast(new Date(p.due_date)) ? 'vencido' as const : p.status,
  }));

  const filteredPayables = processedPayables.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = isUsingMock ? {
    total: mockPayables.reduce((sum, p) => sum + p.amount, 0),
    pending: mockPayables.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.amount, 0),
    overdue: mockPayables.filter(p => p.status === 'vencido').reduce((sum, p) => sum + p.amount, 0),
    paid: mockPayables.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.amount, 0),
  } : {
    total: dbStats.totalPending + dbStats.totalPaid,
    pending: dbStats.totalPending,
    overdue: processedPayables.filter(p => p.status === 'vencido').reduce((sum, p) => sum + Number(p.amount), 0),
    paid: dbStats.totalPaid,
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.due_date) {
      return;
    }
    
    await createPayable({
      description: formData.description,
      supplier: formData.supplier,
      amount: Number(formData.amount),
      due_date: formData.due_date,
      category: formData.category || 'outros',
      notes: formData.notes,
      status: 'pendente',
    });
    
    setIsFormOpen(false);
    setFormData({
      description: '',
      supplier: '',
      amount: 0,
      due_date: addDays(new Date(), 30).toISOString().split('T')[0],
      category: 'outros',
      notes: '',
    });
  };

  const handlePay = async () => {
    if (!selectedPayable) return;
    
    await markAsPaid({
      id: selectedPayable.id,
      payment_method: paymentMethod,
    });
    
    setIsPayDialogOpen(false);
    setSelectedPayable(null);
    setPaymentMethod('');
  };

  const openPayDialog = (payable: Payable) => {
    setSelectedPayable(payable);
    setIsPayDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-rose-600" />
            Contas a Pagar
            {isUsingMock && (
              <Badge variant="outline" className="ml-2 text-xs">Demo</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Pró-labore, folha, estagiários, correspondentes, peritos e custas
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
              <DialogDescription>
                Cadastre uma nova conta a pagar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input 
                  placeholder="Ex: Custas processuais - Processo 001" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor / Beneficiário</Label>
                <Input 
                  placeholder="Nome do fornecedor" 
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento *</Label>
                  <Input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea 
                  placeholder="Notas adicionais..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cadastrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pay Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o pagamento de {selectedPayable?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">
                {selectedPayable && formatCurrency(selectedPayable.amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Vencimento: {selectedPayable && format(new Date(selectedPayable.due_date), "dd/MM/yyyy")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="ted">TED</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePay} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700">Pendente</p>
            <p className="text-xl font-bold text-amber-800">{formatCurrency(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4">
            <p className="text-sm text-rose-700">Vencido</p>
            <p className="text-xl font-bold text-rose-800">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-700">Pago</p>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(stats.paid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar despesas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Fornecedor</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Vencimento</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map(payable => {
                  const status = statusConfig[payable.status];
                  const StatusIcon = status.icon;
                  const category = categories.find(c => c.value === payable.category);
                  const isMock = payable.id.startsWith('mock-');
                  
                  return (
                    <TableRow key={payable.id}>
                      <TableCell className="font-medium">{payable.description}</TableCell>
                      <TableCell>{payable.supplier || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {category?.label || payable.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payable.amount)}</TableCell>
                      <TableCell>
                        {format(new Date(payable.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {payable.status !== 'pago' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => !isMock && openPayDialog(payable)}
                              disabled={isMock}
                            >
                              Pagar
                            </Button>
                          )}
                          {!isMock && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deletePayable(payable.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPayables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
