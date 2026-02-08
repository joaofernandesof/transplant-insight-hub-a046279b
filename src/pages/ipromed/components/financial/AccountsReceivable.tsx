/**
 * IPROMED Financial - Contas a Receber
 * Gestão de honorários e recebíveis - COM PERSISTÊNCIA
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
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Loader2,
  Trash2,
} from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReceivables, Receivable, ReceivableInsert } from "../../hooks/useReceivables";

const categories = [
  { value: 'honorarios', label: 'Honorários Contratuais' },
  { value: 'exito', label: 'Honorários de Êxito' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'parecer', label: 'Parecer' },
  { value: 'mensalidade', label: 'Mensalidade' },
  { value: 'recorrencia', label: 'Recorrência (PJ)' },
];

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  recebido: { label: 'Recebido', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  vencido: { label: 'Atrasado', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700', icon: Clock },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Mock data for fallback
const mockReceivables: Receivable[] = [
  { id: 'mock-1', user_id: '', description: 'Honorários - Defesa Administrativa', category: 'honorarios', amount: 5000, due_date: '2026-02-05', status: 'pendente', created_at: '', updated_at: '' },
  { id: 'mock-2', user_id: '', description: 'Consulta jurídica preventiva', category: 'consulta', amount: 500, due_date: '2026-01-20', status: 'recebido', received_date: '2026-01-19', created_at: '', updated_at: '' },
  { id: 'mock-3', user_id: '', description: 'Mensalidade - Consultivo', category: 'mensalidade', amount: 3500, due_date: '2026-01-15', status: 'vencido', created_at: '', updated_at: '' },
  { id: 'mock-4', user_id: '', description: 'Parecer jurídico', category: 'parecer', amount: 2500, due_date: '2026-02-10', status: 'pendente', created_at: '', updated_at: '' },
  { id: 'mock-5', user_id: '', description: 'Honorários de êxito - Proc. 001', category: 'exito', amount: 25000, due_date: '2026-03-01', status: 'pendente', created_at: '', updated_at: '' },
];

export default function AccountsReceivable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ReceivableInsert>>({
    description: '',
    amount: 0,
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
    category: 'honorarios',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');

  const { 
    receivables: dbReceivables, 
    isLoading, 
    stats: dbStats,
    createReceivable, 
    markAsReceived,
    deleteReceivable,
    isCreating,
    isUpdating,
  } = useReceivables();

  // Use DB data if available, otherwise fallback to mock
  const receivables = dbReceivables.length > 0 ? dbReceivables : mockReceivables;
  const isUsingMock = dbReceivables.length === 0;

  // Apply status updates for overdue items
  const processedReceivables = receivables.map(r => ({
    ...r,
    status: r.status === 'pendente' && isPast(new Date(r.due_date)) ? 'vencido' as const : r.status,
  }));

  const filteredReceivables = processedReceivables.filter(r => {
    const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = isUsingMock ? {
    total: mockReceivables.reduce((sum, r) => sum + r.amount, 0),
    pending: mockReceivables.filter(r => r.status === 'pendente').reduce((sum, r) => sum + r.amount, 0),
    overdue: mockReceivables.filter(r => r.status === 'vencido').reduce((sum, r) => sum + r.amount, 0),
    received: mockReceivables.filter(r => r.status === 'recebido').reduce((sum, r) => sum + r.amount, 0),
  } : {
    total: dbStats.totalPending + dbStats.totalReceived,
    pending: dbStats.totalPending,
    overdue: processedReceivables.filter(r => r.status === 'vencido').reduce((sum, r) => sum + Number(r.amount), 0),
    received: dbStats.totalReceived,
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.due_date) {
      return;
    }
    
    await createReceivable({
      description: formData.description,
      amount: Number(formData.amount),
      due_date: formData.due_date,
      category: formData.category || 'honorarios',
      notes: formData.notes,
      status: 'pendente',
    });
    
    setIsFormOpen(false);
    setFormData({
      description: '',
      amount: 0,
      due_date: addDays(new Date(), 30).toISOString().split('T')[0],
      category: 'honorarios',
      notes: '',
    });
  };

  const handleReceive = async () => {
    if (!selectedReceivable) return;
    
    await markAsReceived({
      id: selectedReceivable.id,
      payment_method: paymentMethod,
    });
    
    setIsReceiveDialogOpen(false);
    setSelectedReceivable(null);
    setPaymentMethod('');
  };

  const openReceiveDialog = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setIsReceiveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            Contas a Receber
            {isUsingMock && (
              <Badge variant="outline" className="ml-2 text-xs">Demo</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Honorários, consultas, pareceres e mensalidades
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Recebível
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Recebível</DialogTitle>
              <DialogDescription>
                Cadastre uma nova conta a receber
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input 
                  placeholder="Ex: Honorários - Processo 001" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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

      {/* Receive Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
            <DialogDescription>
              Confirme o recebimento de {selectedReceivable?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {selectedReceivable && formatCurrency(selectedReceivable.amount)}
              </p>
              <p className="text-sm text-muted-foreground">
                Vencimento: {selectedReceivable && format(new Date(selectedReceivable.due_date), "dd/MM/yyyy")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Forma de Recebimento</Label>
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
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReceive} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Recebimento
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
            <p className="text-sm text-rose-700">Atrasado</p>
            <p className="text-xl font-bold text-rose-800">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-700">Recebido</p>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(stats.received)}</p>
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
                placeholder="Buscar por descrição..."
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
                <SelectItem value="vencido">Atrasados</SelectItem>
                <SelectItem value="recebido">Recebidos</SelectItem>
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
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Vencimento</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map(receivable => {
                  const status = statusConfig[receivable.status];
                  const StatusIcon = status.icon;
                  const category = categories.find(c => c.value === receivable.category);
                  const isMock = receivable.id.startsWith('mock-');
                  
                  return (
                    <TableRow key={receivable.id}>
                      <TableCell className="font-medium">{receivable.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {category?.label || receivable.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(receivable.amount)}</TableCell>
                      <TableCell>
                        {format(new Date(receivable.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {receivable.status !== 'recebido' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => !isMock && openReceiveDialog(receivable)}
                              disabled={isMock}
                            >
                              Receber
                            </Button>
                          )}
                          {!isMock && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteReceivable(receivable.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredReceivables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum recebível encontrado
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
