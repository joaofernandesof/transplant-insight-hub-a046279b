/**
 * IPROMED Financial - Cobranças
 * PIX, boleto, link de pagamento e régua de cobrança
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
  CreditCard,
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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Billing {
  id: string;
  client: string;
  description: string;
  amount: number;
  dueDate: string;
  method: 'pix' | 'boleto' | 'link';
  status: 'pending' | 'paid' | 'overdue' | 'sent';
  recurrent?: boolean;
  pixCode?: string;
  boletoNumber?: string;
}

const mockBillings: Billing[] = [
  { id: '1', client: 'Dr. João Silva', description: 'Honorários - Janeiro', amount: 5000, dueDate: '2026-02-05', method: 'pix', status: 'sent', pixCode: '00020126360014BR.GOV.BCB.PIX...' },
  { id: '2', client: 'Hospital XYZ', description: 'Mensalidade Consultivo', amount: 8500, dueDate: '2026-02-10', method: 'boleto', status: 'pending', recurrent: true, boletoNumber: '23793.38128 60800.000013 38000.063305 1 87450000085000' },
  { id: '3', client: 'Clínica ABC', description: 'Parecer Jurídico', amount: 2500, dueDate: '2026-01-25', method: 'link', status: 'overdue' },
  { id: '4', client: 'Dra. Maria Santos', description: 'Consulta', amount: 500, dueDate: '2026-01-20', method: 'pix', status: 'paid' },
];

// Billing rules (régua de cobrança)
const billingRules = [
  { id: '1', name: '3 dias antes', days: -3, active: true, message: 'Lembrete: Vencimento em 3 dias' },
  { id: '2', name: 'No vencimento', days: 0, active: true, message: 'Seu boleto/PIX vence hoje' },
  { id: '3', name: '3 dias após', days: 3, active: true, message: 'Pendência: 3 dias de atraso' },
  { id: '4', name: '7 dias após', days: 7, active: true, message: 'Cobrança: 7 dias de atraso' },
  { id: '5', name: '15 dias após', days: 15, active: false, message: 'Urgente: 15 dias de atraso' },
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Send },
  paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Vencido', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
};

const methodConfig = {
  pix: { label: 'PIX', icon: QrCode, color: 'text-teal-600' },
  boleto: { label: 'Boleto', icon: Receipt, color: 'text-blue-600' },
  link: { label: 'Link', icon: Link2, color: 'text-purple-600' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BillingModule() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('billings');

  const stats = {
    total: mockBillings.length,
    pending: mockBillings.filter(b => b.status === 'pending' || b.status === 'sent').length,
    overdue: mockBillings.filter(b => b.status === 'overdue').length,
    recurrent: mockBillings.filter(b => b.recurrent).length,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-600" />
            Cobranças
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
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input placeholder="Selecione ou digite" />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input placeholder="Ex: Honorários - Janeiro/2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento *</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Forma de Cobrança</Label>
                <Select defaultValue="pix">
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
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Cobrança Recorrente</p>
                  <p className="text-xs text-muted-foreground">Repetir mensalmente</p>
                </div>
                <Switch />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsFormOpen(false)}>
                  Gerar Cobrança
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.recurrent}</p>
            <p className="text-xs text-blue-600">Recorrentes</p>
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Vencimento</TableHead>
                    <TableHead className="font-semibold">Método</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBillings.map(billing => {
                    const status = statusConfig[billing.status];
                    const method = methodConfig[billing.method];
                    const StatusIcon = status.icon;
                    const MethodIcon = method.icon;
                    
                    return (
                      <TableRow key={billing.id}>
                        <TableCell className="font-medium">
                          {billing.client}
                          {billing.recurrent && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              <RefreshCw className="h-2.5 w-2.5 mr-1" />
                              Recorrente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{billing.description}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(billing.amount)}</TableCell>
                        <TableCell>{format(new Date(billing.dueDate), "dd/MM/yyyy")}</TableCell>
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
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            {(billing.pixCode || billing.boletoNumber) && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0"
                                onClick={() => copyToClipboard(billing.pixCode || billing.boletoNumber || '')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ExternalLink className="h-3.5 w-3.5" />
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
