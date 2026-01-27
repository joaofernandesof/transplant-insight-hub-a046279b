/**
 * IPROMED - Astrea-style Publications Panel
 * Painel de publicações com tabela expansível inspirado no Astrea
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Rss,
  Eye,
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
}

const mockPublications: Publication[] = [
  {
    id: '1',
    publishedDate: '24/09/2024',
    receivedDate: '25/09/2024',
    type: 'Decisão',
    caseNumber: '0001234-56.2024',
    court: 'TJPRDJ',
    division: '6A CAMARA CIVEL CURITIBA',
    searchTerm: 'Processo Teste',
    responsible: 'Leonardo Signoretti',
    status: 'treated',
    content: 'Publicação Processo: 6ª Câmara Cível Data de disponibilização: 24/09/2024 Tipo de comunicação: Decisão Interlocutória',
  },
  {
    id: '2',
    publishedDate: '24/09/2024',
    receivedDate: '25/09/2024',
    type: 'Intimação',
    caseNumber: '0005678-12.2024',
    court: 'TJSP',
    division: '19O GRUPO - 38A CAMARA DIREITO PRIVADO - PATEO DO COLEGIO',
    searchTerm: 'Processo Teste',
    responsible: 'Leonardo Signoretti',
    status: 'treated',
    content: 'Processamento 19O Grupo - 38A CAMARA DIREITO PRIVADO - PATEO DO COLEGIO',
  },
  {
    id: '3',
    publishedDate: '23/09/2024',
    receivedDate: '24/09/2024',
    type: 'Despacho',
    caseNumber: '0009876-54.2024',
    court: 'TJRJ',
    division: '2A VARA CIVEL',
    searchTerm: 'Cliente ABC',
    responsible: 'Ana Paula Costa',
    status: 'untreated',
  },
];

const statusConfig = {
  treated: { label: 'TRATADA', color: 'bg-emerald-100 text-emerald-700' },
  untreated: { label: 'NÃO TRATADA', color: 'bg-amber-100 text-amber-700' },
  discarded: { label: 'DESCARTADA', color: 'bg-gray-100 text-gray-700' },
};

export default function AstreaStylePublications() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRow = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const stats = {
    received: mockPublications.length,
    treated: mockPublications.filter(p => p.status === 'treated').length,
    discarded: mockPublications.filter(p => p.status === 'discarded').length,
    untreated: mockPublications.filter(p => p.status === 'untreated').length,
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-0 px-4 pt-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#0066CC]" />
          Publicações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-600">{stats.received}</span>
            <span className="text-xs text-muted-foreground uppercase">Recebidas hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-600">{stats.treated}</span>
            <span className="text-xs text-muted-foreground uppercase">Tratadas hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-rose-600">{stats.discarded}</span>
            <span className="text-xs text-muted-foreground uppercase">Descartadas hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-600">{stats.untreated}</span>
            <span className="text-xs text-muted-foreground uppercase">Não tratadas</span>
          </div>
          
          {/* Mini Chart */}
          <div className="ml-auto flex items-end gap-0.5 h-8">
            {[3, 5, 2, 6, 4, 3, 5].map((h, i) => (
              <div
                key={i}
                className="w-2 bg-[#0066CC] rounded-t"
                style={{ height: `${h * 5}px` }}
              />
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground flex gap-0.5">
            {['T', 'Q', 'Q', 'S', 'S', 'D', 'S'].map((d, i) => (
              <span key={i} className="w-2 text-center">{d}</span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o processo ou termo pesquisado"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px] h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Estados</SelectItem>
              <SelectItem value="sp">SP</SelectItem>
              <SelectItem value="rj">RJ</SelectItem>
              <SelectItem value="pr">PR</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px] h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status</SelectItem>
              <SelectItem value="treated">Tratadas</SelectItem>
              <SelectItem value="untreated">Não tratadas</SelectItem>
              <SelectItem value="discarded">Descartadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Counter */}
        <div className="px-4 py-2 border-b bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {mockPublications.length} de {mockPublications.length} publicações
          </span>
          <Button variant="ghost" size="sm" className="text-xs">
            Expandir todos
          </Button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-xs font-semibold">DIVULGADO EM</TableHead>
              <TableHead className="text-xs font-semibold">TIPO</TableHead>
              <TableHead className="text-xs font-semibold">PROCESSO</TableHead>
              <TableHead className="text-xs font-semibold">DIÁRIO</TableHead>
              <TableHead className="text-xs font-semibold">NOME PESQUISADO</TableHead>
              <TableHead className="text-xs font-semibold">STATUS</TableHead>
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
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{pub.publishedDate}</div>
                      <div className="text-xs text-muted-foreground">
                        Publicado em: {pub.receivedDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {pub.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-300 hover:text-amber-500 cursor-pointer" />
                        <Rss className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div className="text-sm font-medium text-[#0066CC]">{pub.searchTerm}</div>
                          <div className="text-xs text-muted-foreground">
                            Responsável: {pub.responsible}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{pub.court}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {pub.division}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{pub.responsible}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${status.color}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  
                  <CollapsibleContent asChild>
                    <TableRow className="bg-gray-50/50">
                      <TableCell colSpan={8} className="p-4">
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2">{pub.content}</p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver completo
                            </Button>
                            <Button size="sm" className="text-xs bg-[#0066CC]">
                              Acessar publicação
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
