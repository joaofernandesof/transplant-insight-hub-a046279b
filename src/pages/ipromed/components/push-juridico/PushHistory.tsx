/**
 * Push Jurídico - Histórico
 * Histórico de alertas e publicações
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Search,
  Download,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Scale,
  Gavel,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryItem {
  id: string;
  type: 'intimation' | 'sentence' | 'dispatch' | 'publication' | 'decision';
  title: string;
  court: string;
  date: string;
  client: string;
  processNumber: string;
  read: boolean;
  starred: boolean;
}

const mockHistory: HistoryItem[] = [
  { id: '1', type: 'intimation', title: 'Intimação para Audiência', court: 'TJSP - 3ª Vara Cível', date: '2026-01-29T10:30:00', client: 'Dr. João Silva', processNumber: '0001234-56.2024.8.26.0100', read: true, starred: false },
  { id: '2', type: 'sentence', title: 'Sentença Publicada', court: 'TRT-2 - 15ª Vara do Trabalho', date: '2026-01-29T09:15:00', client: 'Hospital XYZ', processNumber: '0009876-54.2023.5.02.0001', read: true, starred: true },
  { id: '3', type: 'dispatch', title: 'Despacho - Vista ao Autor', court: 'TRF-3 - 1ª Vara Federal', date: '2026-01-28T16:45:00', client: 'Clínica ABC', processNumber: '0005555-11.2025.4.03.6100', read: true, starred: false },
  { id: '4', type: 'publication', title: 'Publicação no DJE/SP', court: 'Diário da Justiça Eletrônico - SP', date: '2026-01-28T08:00:00', client: 'Dra. Maria Santos', processNumber: '0002222-33.2024.8.26.0001', read: true, starred: false },
  { id: '5', type: 'decision', title: 'Tutela Deferida', court: 'TJSP - 5ª Vara da Fazenda', date: '2026-01-27T14:20:00', client: 'Dr. Carlos Médico', processNumber: '0003333-44.2025.8.26.0053', read: true, starred: true },
  { id: '6', type: 'intimation', title: 'Intimação para Manifestação', court: 'TJRJ - 2ª Vara Cível', date: '2026-01-26T11:00:00', client: 'Dr. João Silva', processNumber: '0004444-55.2024.8.19.0001', read: true, starred: false },
  { id: '7', type: 'dispatch', title: 'Despacho Ordinatório', court: 'TJMG - 1ª Vara Criminal', date: '2026-01-25T09:30:00', client: 'Hospital XYZ', processNumber: '0006666-77.2024.8.13.0024', read: true, starred: false },
  { id: '8', type: 'sentence', title: 'Sentença - Improcedente', court: 'TRT-15 - Campinas', date: '2026-01-24T15:45:00', client: 'Clínica ABC', processNumber: '0007777-88.2023.5.15.0001', read: true, starred: false },
];

const typeConfig = {
  intimation: { label: 'Intimação', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  sentence: { label: 'Sentença', color: 'bg-amber-100 text-amber-700', icon: Gavel },
  dispatch: { label: 'Despacho', color: 'bg-blue-100 text-blue-700', icon: FileText },
  publication: { label: 'Publicação', color: 'bg-emerald-100 text-emerald-700', icon: Eye },
  decision: { label: 'Decisão', color: 'bg-purple-100 text-purple-700', icon: Scale },
};

export default function PushHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30days');

  const filteredHistory = mockHistory.filter(h => {
    const matchesSearch = 
      h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.processNumber.includes(searchTerm) ||
      h.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || h.type === typeFilter;
    const matchesClient = clientFilter === 'all' || h.client === clientFilter;
    return matchesSearch && matchesType && matchesClient;
  });

  const uniqueClients = Array.from(new Set(mockHistory.map(h => h.client)));

  const stats = {
    total: mockHistory.length,
    byType: Object.entries(typeConfig).map(([key, config]) => ({
      type: key,
      label: config.label,
      count: mockHistory.filter(h => h.type === key).length,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            Histórico de Alertas
          </h2>
          <p className="text-sm text-muted-foreground">
            Todas as publicações identificadas pelo monitoramento
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total de Alertas</p>
          </CardContent>
        </Card>
        {stats.byType.slice(0, 4).map(item => (
          <Card key={item.type} className="flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="intimation">Intimações</SelectItem>
                <SelectItem value="sentence">Sentenças</SelectItem>
                <SelectItem value="dispatch">Despachos</SelectItem>
                <SelectItem value="decision">Decisões</SelectItem>
                <SelectItem value="publication">Publicações</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Título</TableHead>
                <TableHead className="font-semibold">Tribunal</TableHead>
                <TableHead className="font-semibold">Processo</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map(item => {
                const type = typeConfig[item.type];
                const TypeIcon = type.icon;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.date), "dd/MM/yyyy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${type.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {item.court}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.processNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {item.client}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Exibindo {filteredHistory.length} de {mockHistory.length} registros
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Anterior</Button>
          <Button variant="outline" size="sm">Próxima</Button>
        </div>
      </div>
    </div>
  );
}
