/**
 * IPROMED - Astrea-style Financial Page
 * Gestão financeira com emissão de boletos e PIX
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  DollarSign,
  Receipt,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  client: string;
  description: string;
  value: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  type: 'boleto' | 'pix';
  caseNumber?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    client: 'Dr. João Silva',
    description: 'Honorários - Defesa Administrativa',
    value: 5000.00,
    dueDate: '2026-02-05',
    status: 'pending',
    type: 'boleto',
    caseNumber: '0001234-56.2025',
  },
  {
    id: '2',
    client: 'Dra. Maria Santos',
    description: 'Consulta jurídica preventiva',
    value: 500.00,
    dueDate: '2026-01-20',
    status: 'paid',
    type: 'pix',
  },
  {
    id: '3',
    client: 'Dr. Carlos Oliveira',
    description: 'Elaboração de contrato',
    value: 1500.00,
    dueDate: '2026-01-15',
    status: 'overdue',
    type: 'boleto',
  },
  {
    id: '4',
    client: 'Dra. Ana Costa',
    description: 'Acompanhamento processual mensal',
    value: 2000.00,
    dueDate: '2026-02-10',
    status: 'pending',
    type: 'boleto',
  },
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Atrasado', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

export default function AstreaFinancialPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    description: '',
    value: '',
    documentNumber: '',
    classification: 'expense',
    account: '',
    recurring: false,
  });

  const filteredInvoices = mockInvoices.filter(inv => {
    const matchesSearch = inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    received: mockInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.value, 0),
    pending: mockInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.value, 0),
    overdue: mockInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.value, 0),
  };

  const handleGenerateBoleto = () => {
    toast.success('Boleto gerado com sucesso!');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de honorários, boletos e cobranças
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Plus className="h-4 w-4" />
              Emitir Boleto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Emitir Boleto com PIX</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recebido de*</Label>
                  <div className="relative">
                    <Input
                      placeholder="Leonardo Signoretti"
                      value={formData.client}
                      onChange={e => setFormData(prev => ({ ...prev, client: e.target.value }))}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição*</Label>
                  <Input
                    placeholder="Consulta"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor*</Label>
                  <Input
                    placeholder="500,00"
                    value={formData.value}
                    onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número do documento</Label>
                  <Input
                    placeholder="Digite o número da nota fiscal ou comprovante"
                    value={formData.documentNumber}
                    onChange={e => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Classificação*</Label>
                    <Select 
                      value={formData.classification} 
                      onValueChange={v => setFormData(prev => ({ ...prev, classification: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Despesa do cliente</SelectItem>
                        <SelectItem value="fee">Honorários</SelectItem>
                        <SelectItem value="advance">Adiantamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Select defaultValue="civil">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="civil">Cível</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="admin">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conta*</Label>
                  <Select 
                    value={formData.account} 
                    onValueChange={v => setFormData(prev => ({ ...prev, account: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Conta padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Conta padrão</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                  <a href="#" className="text-xs text-[#0066CC] hover:underline">
                    Credencie esta conta para emitir boletos nas configurações
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.recurring}
                    onCheckedChange={v => setFormData(prev => ({ ...prev, recurring: !!v }))}
                  />
                  <Label className="text-sm">Repetir lançamento mensalmente</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                    CANCELAR
                  </Button>
                  <Button className="bg-[#0066CC]" onClick={handleGenerateBoleto}>
                    SALVAR E EMITIR BOLETO
                  </Button>
                </div>
              </div>

              {/* Boleto Preview */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="bg-white rounded border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">237-2</span>
                    <div className="text-xs font-mono">
                      23790.12301 90000.012311 74003.923074 9 42400001448
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Local de pagamento</span>
                      <span>PAGÁVEL EM QUALQUER BANCO</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Vencimento</span>
                      <span className="font-medium">05/02/2026</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Valor do documento</span>
                      <span className="font-medium">R$ 500,00</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Sacado</div>
                    <div className="text-xs">CLIENTE DE TESTE NF 12345678</div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">PIX</div>
                      <QrCode className="h-16 w-16" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">R$ 500,00</div>
                    </div>
                  </div>
                </div>
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
                <div className="text-sm text-muted-foreground">Recebido este mês</div>
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {stats.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <div className="text-sm text-muted-foreground">A receber</div>
                <div className="text-2xl font-bold text-amber-600">
                  R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {stats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <div className="text-sm text-muted-foreground">Saldo previsto</div>
                <div className="text-2xl font-bold">
                  R$ {(stats.received + stats.pending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#0066CC]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cobranças</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {filteredInvoices.map(invoice => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{invoice.client}</TableCell>
                    <TableCell>
                      <div className="text-sm">{invoice.description}</div>
                      {invoice.caseNumber && (
                        <div className="text-xs text-muted-foreground">
                          Processo: {invoice.caseNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {invoice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {invoice.type === 'pix' ? (
                          <QrCode className="h-3 w-3" />
                        ) : (
                          <Receipt className="h-3 w-3" />
                        )}
                        {invoice.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
