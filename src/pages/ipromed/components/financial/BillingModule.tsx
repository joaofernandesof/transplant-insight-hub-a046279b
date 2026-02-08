/**
 * IPROMED Financial - Cobranças
 * PIX, boleto, link de pagamento e régua de cobrança - COM PERSISTÊNCIA
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Receipt,
  QrCode,
  Link2,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Calendar,
  RefreshCw,
  Copy,
  ExternalLink,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { useBillings, Billing, BillingInsert } from "../../hooks/useBillings";

// Billing rules (régua de cobrança)
const billingRules = [
  { id: '1', name: '3 dias antes', days: -3, active: true, message: 'Lembrete: Vencimento em 3 dias' },
  { id: '2', name: 'No vencimento', days: 0, active: true, message: 'Seu boleto/PIX vence hoje' },
  { id: '3', name: '3 dias após', days: 3, active: true, message: 'Pendência: 3 dias de atraso' },
  { id: '4', name: '7 dias após', days: 7, active: true, message: 'Cobrança: 7 dias de atraso' },
  { id: '5', name: '15 dias após', days: 15, active: false, message: 'Urgente: 15 dias de atraso' },
];

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
  visualizado: { label: 'Visualizado', color: 'bg-purple-100 text-purple-700', icon: Eye },
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  vencido: { label: 'Vencido', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

const methodConfig = {
  pix: { label: 'PIX', icon: QrCode, color: 'text-teal-600' },
  boleto: { label: 'Boleto', icon: Receipt, color: 'text-blue-600' },
  link: { label: 'Link', icon: Link2, color: 'text-purple-600' },
  manual: { label: 'Manual', icon: Receipt, color: 'text-gray-600' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Mock data for fallback
const mockBillings: Billing[] = [
  { id: 'mock-1', user_id: '', billing_number: 'COB-20260128-0001', client_name: 'Dr. João Silva', amount: 5000, due_date: '2026-02-05', billing_type: 'pix', status: 'enviado', pix_code: '00020126360014BR.GOV.BCB.PIX...', reminder_sent_count: 0, created_at: '', updated_at: '' },
  { id: 'mock-2', user_id: '', billing_number: 'COB-20260128-0002', client_name: 'Hospital XYZ', amount: 8500, due_date: '2026-02-10', billing_type: 'boleto', status: 'pendente', boleto_code: '23793.38128 60800.000013 38000.063305 1 87450000085000', reminder_sent_count: 0, created_at: '', updated_at: '' },
  { id: 'mock-3', user_id: '', billing_number: 'COB-20260128-0003', client_name: 'Clínica ABC', amount: 2500, due_date: '2026-01-25', billing_type: 'link', status: 'vencido', payment_link: 'https://pay.cpgadvocacia.com.br/abc123', reminder_sent_count: 2, created_at: '', updated_at: '' },
  { id: 'mock-4', user_id: '', billing_number: 'COB-20260128-0004', client_name: 'Dra. Maria Santos', amount: 500, due_date: '2026-01-20', billing_type: 'pix', status: 'pago', reminder_sent_count: 0, created_at: '', updated_at: '' },
];

export default function BillingModule() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('billings');
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<BillingInsert>>({
    client_name: '',
    amount: 0,
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
    billing_type: 'pix',
    status: 'pendente',
  });

  const {
    billings: dbBillings,
    isLoading,
    stats: dbStats,
    createBilling,
    sendBilling,
    markAsPaid,
    sendReminder,
    deleteBilling,
    isCreating,
  } = useBillings();

  // Use DB data if available, otherwise fallback to mock
  const billings = dbBillings.length > 0 ? dbBillings : mockBillings;
  const isUsingMock = dbBillings.length === 0;

  const stats = isUsingMock ? {
    total: mockBillings.length,
    pending: mockBillings.filter(b => ['pendente', 'enviado'].includes(b.status)).length,
    overdue: mockBillings.filter(b => b.status === 'vencido').length,
    paid: mockBillings.filter(b => b.status === 'pago').length,
  } : {
    total: dbBillings.length,
    pending: dbStats.pending + dbStats.sent,
    overdue: dbStats.overdue,
    paid: dbStats.paid,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const handleSubmit = async () => {
    if (!formData.client_name || !formData.amount || !formData.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    await createBilling({
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone,
      amount: Number(formData.amount),
      due_date: formData.due_date,
      billing_type: formData.billing_type || 'pix',
      status: 'pendente',
    });
    
    setIsFormOpen(false);
    setFormData({
      client_name: '',
      amount: 0,
      due_date: addDays(new Date(), 30).toISOString().split('T')[0],
      billing_type: 'pix',
      status: 'pendente',
    });
  };

  const handleSend = async (billing: Billing) => {
    if (billing.id.startsWith('mock-')) {
      toast.info('Funcionalidade disponível apenas com dados reais');
      return;
    }
    await sendBilling(billing.id);
  };

  const handleMarkAsPaid = async (billing: Billing) => {
    if (billing.id.startsWith('mock-')) {
      toast.info('Funcionalidade disponível apenas com dados reais');
      return;
    }
    await markAsPaid(billing.id);
  };

  const showCodeDialog = (billing: Billing) => {
    setSelectedBilling(billing);
    setIsCodeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-600" />
            Cobranças
            {isUsingMock && (
              <Badge variant="outline" className="ml-2 text-xs">Demo</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            PIX, boleto, link de pagamento e régua de cobrança amigável
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
              <DialogDescription>
                Gere uma cobrança via PIX, boleto ou link de pagamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Cliente *</Label>
                <Input 
                  placeholder="Nome completo" 
                  value={formData.client_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input 
                    type="email"
                    placeholder="email@cliente.com" 
                    value={formData.client_email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={formData.client_phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                  />
                </div>
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
                <Label>Forma de Cobrança</Label>
                <Select 
                  value={formData.billing_type} 
                  onValueChange={(value: 'pix' | 'boleto' | 'link') => setFormData(prev => ({ ...prev, billing_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto Bancário</SelectItem>
                    <SelectItem value="link">Link de Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Cobrança
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Code Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBilling?.billing_type === 'pix' && 'Código PIX'}
              {selectedBilling?.billing_type === 'boleto' && 'Código do Boleto'}
              {selectedBilling?.billing_type === 'link' && 'Link de Pagamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {selectedBilling && formatCurrency(selectedBilling.amount)}
              </p>
              <p className="text-sm text-muted-foreground">{selectedBilling?.client_name}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs font-mono break-all">
                {selectedBilling?.pix_code || selectedBilling?.boleto_code || selectedBilling?.payment_link || 'Código não disponível'}
              </p>
            </div>
            <Button 
              className="w-full gap-2"
              onClick={() => copyToClipboard(selectedBilling?.pix_code || selectedBilling?.boleto_code || selectedBilling?.payment_link || '')}
            >
              <Copy className="h-4 w-4" />
              Copiar Código
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-amber-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-rose-700">{stats.overdue}</p>
            <p className="text-xs text-rose-600">Vencidos</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.paid}</p>
            <p className="text-xs text-emerald-600">Pagos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="billings">Cobranças</TabsTrigger>
          <TabsTrigger value="rules">Régua de Cobrança</TabsTrigger>
        </TabsList>

        <TabsContent value="billings" className="mt-4">
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
                      <TableHead className="font-semibold">Nº</TableHead>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                      <TableHead className="font-semibold">Vencimento</TableHead>
                      <TableHead className="font-semibold">Método</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[180px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billings.map(billing => {
                      const status = statusConfig[billing.status];
                      const method = methodConfig[billing.billing_type];
                      const StatusIcon = status.icon;
                      const MethodIcon = method.icon;
                      const isMock = billing.id.startsWith('mock-');
                      
                      return (
                        <TableRow key={billing.id}>
                          <TableCell className="font-mono text-xs">{billing.billing_number}</TableCell>
                          <TableCell className="font-medium">{billing.client_name}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(billing.amount)}</TableCell>
                          <TableCell>{format(new Date(billing.due_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${method.color}`}>
                              <MethodIcon className="h-3 w-3" />
                              {method.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`gap-1 ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {billing.status === 'pendente' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleSend(billing)}
                                  title="Enviar cobrança"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(billing.pix_code || billing.boleto_code || billing.payment_link) && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => showCodeDialog(billing)}
                                  title="Ver código"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {billing.status !== 'pago' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleMarkAsPaid(billing)}
                                  title="Marcar como pago"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                </Button>
                              )}
                              {!isMock && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => deleteBilling(billing.id)}
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {billings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma cobrança encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Régua de Cobrança Automática
              </CardTitle>
              <CardDescription>
                Configure lembretes automáticos antes e após o vencimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingRules.map(rule => (
                  <div 
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        rule.days < 0 ? 'bg-blue-100' : rule.days === 0 ? 'bg-amber-100' : 'bg-rose-100'
                      }`}>
                        <Calendar className={`h-5 w-5 ${
                          rule.days < 0 ? 'text-blue-600' : rule.days === 0 ? 'text-amber-600' : 'text-rose-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.message}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={rule.active} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
