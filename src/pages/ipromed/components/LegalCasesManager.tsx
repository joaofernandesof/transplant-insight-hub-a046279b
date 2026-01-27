/**
 * IPROMED Legal Hub - Gestão de Processos (Contencioso)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Gavel,
  Search,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  client: string;
  status: 'active' | 'pending' | 'closed' | 'archived' | 'suspended';
  caseType: string;
  court: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue: number;
  nextDeadline?: Date;
  responsibleLawyer: string;
}

const mockCases: LegalCase[] = [
  {
    id: '1',
    caseNumber: '0001234-56.2024.8.26.0100',
    title: 'Ação de Indenização por Erro Médico',
    client: 'Maria Santos',
    status: 'active',
    caseType: 'Erro Médico',
    court: 'TJ-SP',
    riskLevel: 'high',
    estimatedValue: 150000,
    nextDeadline: new Date('2024-02-15'),
    responsibleLawyer: 'Dr. Carlos Mendes',
  },
  {
    id: '2',
    caseNumber: '0005678-12.2024.8.26.0100',
    title: 'Rescisão Contratual - Plano de Saúde',
    client: 'João Oliveira',
    status: 'pending',
    caseType: 'Contratual',
    court: 'TJ-SP',
    riskLevel: 'medium',
    estimatedValue: 45000,
    nextDeadline: new Date('2024-02-20'),
    responsibleLawyer: 'Dra. Ana Paula',
  },
  {
    id: '3',
    caseNumber: '0009999-00.2023.8.26.0100',
    title: 'Cobrança de Honorários Médicos',
    client: 'Clínica Saúde Total',
    status: 'active',
    caseType: 'Cobrança',
    court: 'TJ-SP',
    riskLevel: 'low',
    estimatedValue: 25000,
    responsibleLawyer: 'Dr. Carlos Mendes',
  },
];

const getStatusBadge = (status: LegalCase['status']) => {
  const config = {
    active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    closed: { label: 'Encerrado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    archived: { label: 'Arquivado', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
    suspended: { label: 'Suspenso', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  return <Badge className={config[status].className}>{config[status].label}</Badge>;
};

const getRiskBadge = (risk: LegalCase['riskLevel']) => {
  const config = {
    low: { label: 'Baixo', className: 'bg-emerald-100 text-emerald-700' },
    medium: { label: 'Médio', className: 'bg-amber-100 text-amber-700' },
    high: { label: 'Alto', className: 'bg-orange-100 text-orange-700' },
    critical: { label: 'Crítico', className: 'bg-rose-100 text-rose-700' },
  };
  return <Badge className={config[risk].className}>{config[risk].label}</Badge>;
};

export default function LegalCasesManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  const filteredCases = mockCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.includes(searchTerm) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-600" />
            Gestão de Processos
          </h2>
          <p className="text-muted-foreground">Contencioso e andamentos processuais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Gerar Peça com IA
          </Button>
          <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Processo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número do Processo</Label>
                    <Input placeholder="0000000-00.0000.0.00.0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo do Processo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erro_medico">Erro Médico</SelectItem>
                        <SelectItem value="contratual">Contratual</SelectItem>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="cobranca">Cobrança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Título / Descrição</Label>
                  <Input placeholder="Título do processo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Maria Santos</SelectItem>
                        <SelectItem value="2">João Oliveira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tribunal</Label>
                    <Input placeholder="Ex: TJ-SP" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Estimado</Label>
                    <Input type="number" placeholder="R$ 0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Risco</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea placeholder="Detalhes adicionais..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewCaseOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsNewCaseOpen(false)}>Salvar Processo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="closed">Encerrados</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Valor Est.</TableHead>
                <TableHead>Próx. Prazo</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{caseItem.caseNumber}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {caseItem.title}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{caseItem.client}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{caseItem.caseType}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>{getRiskBadge(caseItem.riskLevel)}</TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(caseItem.estimatedValue)}
                  </TableCell>
                  <TableCell>
                    {caseItem.nextDeadline ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-amber-600" />
                        {format(caseItem.nextDeadline, 'dd/MM/yy', { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
