/**
 * CPG Advocacia Médica Financial - Notas Fiscais
 * Emissão de NFS-e para honorários e serviços
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Plus,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string;
  client: string;
  description: string;
  amount: number;
  issueDate: string;
  status: 'issued' | 'pending' | 'cancelled';
  municipality: string;
}

const mockInvoices: Invoice[] = [
  { id: '1', number: 'NFS-e 2026/001', client: 'Dr. João Silva', description: 'Honorários Advocatícios - Defesa Administrativa', amount: 5000, issueDate: '2026-01-28', status: 'issued', municipality: 'São Paulo' },
  { id: '2', number: 'NFS-e 2026/002', client: 'Hospital XYZ', description: 'Consultoria Jurídica Mensal', amount: 8500, issueDate: '2026-01-25', status: 'issued', municipality: 'São Paulo' },
  { id: '3', number: 'NFS-e 2026/003', client: 'Clínica ABC', description: 'Parecer Jurídico', amount: 2500, issueDate: '2026-01-20', status: 'issued', municipality: 'Campinas' },
  { id: '4', number: '-', client: 'Dra. Maria Santos', description: 'Consulta Jurídica', amount: 500, issueDate: '-', status: 'pending', municipality: 'São Paulo' },
];

const statusConfig = {
  issued: { label: 'Emitida', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  cancelled: { label: 'Cancelada', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function InvoicesModule() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const stats = {
    total: mockInvoices.length,
    issued: mockInvoices.filter(i => i.status === 'issued').length,
    pending: mockInvoices.filter(i => i.status === 'pending').length,
    totalValue: mockInvoices.filter(i => i.status === 'issued').reduce((sum, i) => sum + i.amount, 0),
  };

  const handleEmit = () => {
    toast.success('Nota fiscal emitida com sucesso!');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Notas Fiscais
          </h2>
          <p className="text-sm text-muted-foreground">
            Emissão de NFS-e para honorários, consultas e serviços jurídicos
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Emitir NFS-e
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Emitir Nota Fiscal de Serviço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente / Tomador *</Label>
                <Input placeholder="Selecione o cliente" />
              </div>
              <div className="space-y-2">
                <Label>Descrição do Serviço *</Label>
                <Input placeholder="Ex: Honorários Advocatícios - Consultoria Jurídica" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Município *</Label>
                  <Select defaultValue="sao-paulo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sao-paulo">São Paulo</SelectItem>
                      <SelectItem value="campinas">Campinas</SelectItem>
                      <SelectItem value="rio-janeiro">Rio de Janeiro</SelectItem>
                      <SelectItem value="belo-horizonte">Belo Horizonte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código do Serviço</Label>
                  <Select defaultValue="1702">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1702">17.02 - Advocacia</SelectItem>
                      <SelectItem value="1703">17.03 - Consultoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ISS Retido</Label>
                  <Select defaultValue="nao">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEmit} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Emitir NFS-e
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
            <p className="text-xs text-muted-foreground">Total de Notas</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.issued}</p>
            <p className="text-xs text-emerald-600">Emitidas</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-amber-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-blue-700">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-blue-600">Valor Emitido</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Número</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Município</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map(invoice => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                    <TableCell className="font-medium">{invoice.client}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{invoice.description}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      {invoice.issueDate !== '-' 
                        ? format(new Date(invoice.issueDate), "dd/MM/yyyy")
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{invoice.municipality}</TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {invoice.status === 'issued' && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {invoice.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            Emitir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configuration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Configuração Pendente</p>
              <p className="text-sm text-amber-700">
                A emissão de NFS-e requer certificado digital A1 ou A3 e credenciamento na prefeitura do município. 
                Entre em contato com o suporte para configurar a integração com a prefeitura.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
