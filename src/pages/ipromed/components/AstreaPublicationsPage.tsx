/**
 * CPG Advocacia Médica - Astrea-style Publications Page
 * Página completa de publicações inspirada no Astrea
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  MoreVertical,
  RefreshCw,
  Trash2,
  Archive,
} from "lucide-react";

interface Publication {
  id: string;
  publishedDate: string;
  receivedDate: string;
  type: string;
  caseNumber: string;
  court: string;
  division: string;
  searchTerm: string;
  responsible: string;
  status: 'treated' | 'untreated' | 'discarded';
  content?: string;
  hasProcess: boolean;
}

const mockPublications: Publication[] = [
  {
    id: '1',
    publishedDate: '13/08/2025',
    receivedDate: '14/08/2025',
    type: 'Intimação',
    caseNumber: '',
    court: 'TJPRDJN',
    division: 'VARA CRIMINAL BOCAIUVA DO SUL',
    searchTerm: 'GUILHERME',
    responsible: 'Guilherme',
    status: 'untreated',
    hasProcess: false,
    content: 'Órgão: Vara Criminal de Bocaiuva do Sul Data de disponibilização: 13/08/2025 Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico Nacional Inteiro teor: ...',
  },
  {
    id: '2',
    publishedDate: '13/08/2025',
    receivedDate: '14/08/2025',
    type: 'Intimação',
    caseNumber: '',
    court: 'TJPRDJN',
    division: '27A VARA DE FALENCIAS E RECUPERACAO JUDICIAL CURITIBA',
    searchTerm: 'GUILHERME',
    responsible: 'Guilherme',
    status: 'untreated',
    hasProcess: false,
    content: 'Processamento 27ª Vara de Falências e Recuperação Judicial de Curitiba Data de disponibilização: 13/08/2025 Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico Nacional Inteiro teor: https://projudi.tjpr.jus.br/projud...',
  },
  {
    id: '3',
    publishedDate: '13/08/2025',
    receivedDate: '14/08/2025',
    type: 'Intimação',
    caseNumber: '',
    court: 'TJPRDJN',
    division: '9A VARA CIVEL CURITIBA',
    searchTerm: 'GUILHERME',
    responsible: 'Guilherme',
    status: 'untreated',
    hasProcess: false,
    content: 'Órgão: 9ª Vara Cível de Curitiba Data de disponibilização: 13/08/2025...',
  },
];

const statusConfig = {
  treated: { label: 'TRATADA', color: 'bg-emerald-100 text-emerald-700' },
  untreated: { label: 'NÃO TRATADA', color: 'bg-rose-100 text-rose-700' },
  discarded: { label: 'DESCARTADA', color: 'bg-gray-100 text-gray-700' },
};

export default function AstreaPublicationsPage() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('untreated');

  const toggleRow = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const stats = {
    untreatedToday: 6,
    treatedToday: 14,
    discardedToday: 1,
    totalUntreated: 515,
  };

  // Mini chart data - days of week
  const chartData = [3, 5, 4, 6, 5, 4, 7];
  const chartDays = ['q', 'q', 's', 's', 'd', 's', 't'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Publicações</h1>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-8 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-600">{stats.untreatedToday}</span>
          <span className="text-sm text-muted-foreground uppercase">Não tratadas de hoje</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-emerald-600">{stats.treatedToday}</span>
          <span className="text-sm text-muted-foreground uppercase">Tratadas hoje</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-400">{stats.discardedToday}</span>
          <span className="text-sm text-muted-foreground uppercase">Descartadas hoje</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-emerald-500">{stats.totalUntreated}</span>
          <span className="text-sm text-muted-foreground uppercase">Não tratadas</span>
        </div>

        {/* Mini Chart */}
        <div className="ml-auto flex flex-col items-center">
          <div className="flex items-end gap-0.5 h-10">
            {chartData.map((h, i) => (
              <div
                key={i}
                className="w-2 bg-amber-400 rounded-t"
                style={{ height: `${h * 5}px` }}
              />
            ))}
          </div>
          <div className="flex gap-0.5 text-[10px] text-muted-foreground mt-1">
            {chartDays.map((d, i) => (
              <span key={i} className="w-2 text-center">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o processo ou termo pesquisado"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white"
              />
            </div>
            <Badge 
              variant={statusFilter === 'untreated' ? 'default' : 'outline'}
              className={`cursor-pointer ${statusFilter === 'untreated' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : ''}`}
              onClick={() => setStatusFilter('untreated')}
            >
              STATUS: NÃO TRATADA
            </Badge>
            <span className="text-sm text-muted-foreground">
              Mostrando 30 de 99+ publicações
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Expandir todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Publications Table */}
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-xs font-semibold">DIVULGADO EM</TableHead>
              <TableHead className="text-xs font-semibold">TIPO</TableHead>
              <TableHead className="text-xs font-semibold">PROCESSO</TableHead>
              <TableHead className="text-xs font-semibold">DIÁRIO / ÓRGÃO</TableHead>
              <TableHead className="text-xs font-semibold">NOME PESQUISADO</TableHead>
              <TableHead className="text-xs font-semibold">STATUS</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPublications.map(pub => {
              const isExpanded = expandedRows.includes(pub.id);
              const status = statusConfig[pub.status];
              
              return (
                <Collapsible key={pub.id} open={isExpanded} onOpenChange={() => toggleRow(pub.id)}>
                  <TableRow className="hover:bg-gray-50 cursor-pointer">
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{pub.publishedDate}</div>
                      <div className="text-xs text-muted-foreground">
                        Publicado em: {pub.receivedDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {pub.hasProcess ? (
                        <a href="#" className="text-sm text-[#0066CC] hover:underline">
                          {pub.caseNumber}
                        </a>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Processo não encontrado</span>
                          <a href="#" className="block text-xs text-[#0066CC] hover:underline">
                            Iniciar busca de processo
                          </a>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{pub.court}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {pub.division}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{pub.searchTerm}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${status.color}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  <CollapsibleContent asChild>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableCell colSpan={8} className="p-4">
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-3">{pub.content}</p>
                          <div className="flex items-center gap-2">
                            <a href="#" className="text-xs text-[#0066CC] hover:underline">
                              Ler mais
                            </a>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="ghost" size="sm" className="text-xs text-[#0066CC]">
                            TRATAR PUBLICAÇÃO
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                            DESCARTAR PUBLICAÇÃO
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs text-[#0066CC]">
                              EXPANDIR
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button className="bg-[#0066CC] hover:bg-[#0055AA]">
                            ACESSAR PUBLICAÇÃO
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
