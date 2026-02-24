/**
 * Push Jurídico - Publicações (Astrea Style)
 * Visualização de publicações estilo Astrea com tabela expandível
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  AlertTriangle,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Check,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Printer,
  Download,
  RefreshCw,
  Scale,
  Gavel,
  Archive,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Types
interface Publication {
  id: string;
  type: 'intimation' | 'sentence' | 'dispatch' | 'publication' | 'decision';
  publishDate: string;
  availableDate: string;
  processNumber: string;
  court: string;
  organ: string;
  parties: string;
  responsible: string;
  searchedName: string;
  status: 'pending' | 'treated' | 'discarded';
  content: string;
  communicationType: string;
  sourceUrl: string;
}

// Mock data
const mockPublications: Publication[] = [
  {
    id: '1',
    type: 'intimation',
    publishDate: '2026-02-03',
    availableDate: '2026-02-04',
    processNumber: '0050445-06.2014.8.06.0158',
    court: 'TJCEDJN',
    organ: '1A VARA CIVEL RUSSAS',
    parties: 'Thiago Valdemir Rocha Carolino x Josianne Menezes de Sa',
    responsible: 'CAROLINE',
    searchedName: 'JOSE MAURO MENDES GIFONI',
    status: 'treated',
    content: 'Publicação Processo: 0050445-06.2014.8.06.0158 Órgão: 1ª Vara Cível da Comarca de Russas Data de disponibilização: 03/02/2026 Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico. INTIMO as partes para audiência de conciliação a ser realizada no dia 15/02/2026, às 14h00, na sala 305.',
    communicationType: 'Intimação',
    sourceUrl: 'https://dje.tjce.jus.br/exemplo',
  },
  {
    id: '2',
    type: 'sentence',
    publishDate: '2026-02-03',
    availableDate: '2026-02-03',
    processNumber: '0001234-56.2024.8.26.0100',
    court: 'TJSP',
    organ: '3ª Vara Cível - São Paulo',
    parties: 'João da Silva x Maria Oliveira Santos',
    responsible: 'DR. CARLOS',
    searchedName: 'JOÃO DA SILVA',
    status: 'pending',
    content: 'SENTENÇA - Vistos. JULGO PROCEDENTE o pedido formulado pelo autor para condenar a ré ao pagamento de R$ 25.000,00 a título de danos morais, corrigidos monetariamente desde a data desta sentença.',
    communicationType: 'Sentença',
    sourceUrl: 'https://esaj.tjsp.jus.br/exemplo',
  },
  {
    id: '3',
    type: 'dispatch',
    publishDate: '2026-02-02',
    availableDate: '2026-02-03',
    processNumber: '0009876-54.2023.5.02.0001',
    court: 'TRT-2',
    organ: '15ª Vara do Trabalho',
    parties: 'Hospital XYZ Ltda x Funcionário Reclamante',
    responsible: 'MARIA',
    searchedName: 'HOSPITAL XYZ',
    status: 'pending',
    content: 'DESPACHO - Vista ao autor para manifestação sobre a contestação apresentada, no prazo de 15 (quinze) dias. Após, voltem conclusos para saneamento do feito.',
    communicationType: 'Despacho',
    sourceUrl: 'https://pje.trt2.jus.br/exemplo',
  },
  {
    id: '4',
    type: 'decision',
    publishDate: '2026-02-02',
    availableDate: '2026-02-02',
    processNumber: '0005555-11.2025.4.03.6100',
    court: 'TRF-3',
    organ: '1ª Vara Federal',
    parties: 'Clínica ABC ME x União Federal',
    responsible: 'PEDRO',
    searchedName: 'CLÍNICA ABC',
    status: 'discarded',
    content: 'DECISÃO INTERLOCUTÓRIA - DEFIRO a tutela de urgência requerida para determinar a suspensão da exigibilidade do crédito tributário. Cite-se o réu.',
    communicationType: 'Decisão',
    sourceUrl: 'https://pje.trf3.jus.br/exemplo',
  },
  {
    id: '5',
    type: 'publication',
    publishDate: '2026-02-01',
    availableDate: '2026-02-01',
    processNumber: '0002222-33.2024.8.26.0001',
    court: 'TJSP',
    organ: 'DJE SP',
    parties: 'Maria Santos x Parte Contrária',
    responsible: 'ANA',
    searchedName: 'MARIA SANTOS',
    status: 'treated',
    content: 'Fl. 125: Recebidos os autos do cartório. Fl. 127: Juntada de petição intermediária. Conclusos ao MM. Juiz para apreciação do requerimento de fls. 127.',
    communicationType: 'Publicação',
    sourceUrl: 'https://dje.tjsp.jus.br/exemplo2',
  },
];

// Mini bar chart data for the week
const weeklyData = [
  { day: 'T', value: 3 },
  { day: 'Q', value: 5 },
  { day: 'Q', value: 2 },
  { day: 'S', value: 8 },
  { day: 'S', value: 4 },
  { day: 'D', value: 1 },
  { day: 'S', value: 0 },
];

// Type config
const typeConfig = {
  intimation: { label: 'Intimação', icon: AlertCircle, color: 'text-rose-600' },
  sentence: { label: 'Sentença', icon: Gavel, color: 'text-amber-600' },
  dispatch: { label: 'Despacho', icon: FileText, color: 'text-blue-600' },
  publication: { label: 'Publicação', icon: Eye, color: 'text-emerald-600' },
  decision: { label: 'Decisão', icon: Scale, color: 'text-purple-600' },
};

const statusConfig = {
  pending: { label: 'NÃO TRATADA', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  treated: { label: 'TRATADA', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  discarded: { label: 'DESCARTADA', color: 'bg-slate-100 text-slate-600 border-slate-300' },
};

// Brazilian states
const brazilianStates = [
  { value: 'all', label: 'Todos os Estados' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'CE', label: 'Ceará' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'PR', label: 'Paraná' },
  { value: 'BA', label: 'Bahia' },
];

export default function AstreaPublicationsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(['treated', 'today']);

  // Calculate stats
  const today = format(new Date(), 'yyyy-MM-dd');
  const stats = {
    pendingToday: mockPublications.filter(p => p.status === 'pending' && p.publishDate === today).length,
    treatedToday: mockPublications.filter(p => p.status === 'treated' && p.publishDate === today).length,
    discardedToday: mockPublications.filter(p => p.status === 'discarded' && p.publishDate === today).length,
    pendingTotal: mockPublications.filter(p => p.status === 'pending').length,
  };

  // System alert (mock)
  const hasSystemAlert = true;
  const systemAlertNames = 4;

  // Filter publications
  const filteredPublications = mockPublications.filter(p => {
    const matchesSearch = 
      p.processNumber.includes(searchTerm) ||
      p.searchedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.parties.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredPublications.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPublications.map(p => p.id));
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  };

  const expandAll = () => {
    setExpandedRows(filteredPublications.map(p => p.id));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-semibold">Publicações</h2>

      {/* Stats Bar - Astrea Style */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-stretch divide-x">
            {/* Pending Today */}
            <div className="flex-1 p-4 text-center">
              <span className="text-2xl font-bold text-slate-800">{stats.pendingToday}</span>
              <span className="text-sm text-muted-foreground ml-2">NÃO TRATADAS DE HOJE</span>
            </div>

            {/* Treated Today */}
            <div className="flex-1 p-4 text-center">
              <span className="text-2xl font-bold text-blue-600">{stats.treatedToday}</span>
              <span className="text-sm text-muted-foreground ml-2">TRATADAS HOJE</span>
            </div>

            {/* Discarded Today */}
            <div className="flex-1 p-4 text-center">
              <span className="text-2xl font-bold text-rose-600">{stats.discardedToday}</span>
              <span className="text-sm text-muted-foreground ml-2">DESCARTADAS HOJE</span>
            </div>

            {/* Pending Total */}
            <div className="flex-1 p-4 text-center">
              <span className="text-2xl font-bold text-slate-800">{stats.pendingTotal}</span>
              <span className="text-sm text-muted-foreground ml-2">NÃO TRATADAS</span>
            </div>

            {/* Mini Week Chart */}
            <div className="w-40 p-2">
              <ResponsiveContainer width="100%" height={50}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === weeklyData.length - 1 ? '#ef4444' : '#3b82f6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alert - Astrea Style */}
      {hasSystemAlert && (
        <Card className="border-rose-300 bg-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-700">Instabilidade na Captura de Informações</p>
                  <p className="text-sm text-rose-600">
                    Identificamos que {systemAlertNames} nomes cadastrados não estão sendo monitorados. 
                    Verifique a causa da instabilidade e, em caso de dúvida, entre em contato com nosso suporte.
                  </p>
                </div>
              </div>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                VERIFICAR INSTABILIDADE
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters - Astrea Style */}
      <div className="flex items-center gap-4">
        <Select defaultValue="process">
          <SelectTrigger className="w-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="process">Processo</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Digite o processo ou termo pesquisado"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ESTADOS" />
          </SelectTrigger>
          <SelectContent>
            {brazilianStates.map(state => (
              <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="STATUS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Não Tratadas</SelectItem>
            <SelectItem value="treated">Tratadas</SelectItem>
            <SelectItem value="discarded">Descartadas</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Icons */}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          {activeFilters.includes('treated') && (
            <Badge 
              className="bg-emerald-600 text-white cursor-pointer flex items-center gap-1"
              onClick={() => removeFilter('treated')}
            >
              STATUS: TRATADA
              <X className="h-3 w-3" />
            </Badge>
          )}
          {activeFilters.includes('today') && (
            <Badge 
              className="bg-emerald-600 text-white cursor-pointer flex items-center gap-1"
              onClick={() => removeFilter('today')}
            >
              TRATADAS: HOJE
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count & Expand All */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Mostrando {filteredPublications.length} publicações
        </span>
        <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={expandAll}>
          Expandir todos
        </Button>
      </div>

      {/* Publications Table - Astrea Style */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-[32px_90px_1fr_minmax(0,160px)_90px_70px] gap-1 items-center px-3 py-2.5 bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase">
            <div>
              <Checkbox 
                checked={selectedItems.length === filteredPublications.length && filteredPublications.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </div>
            <div className="flex items-center gap-1">
              Data
              <ChevronDown className="h-3 w-3" />
            </div>
            <div>Processo / Diário</div>
            <div>Pesquisado</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Rows */}
          {filteredPublications.map(pub => {
            const type = typeConfig[pub.type];
            const status = statusConfig[pub.status];
            const TypeIcon = type.icon;
            const isExpanded = expandedRows.includes(pub.id);

            return (
              <Collapsible key={pub.id} open={isExpanded}>
                <div className="border-b last:border-b-0">
                  {/* Main Row */}
                  <div 
                    className={`grid grid-cols-[32px_90px_1fr_minmax(0,160px)_90px_70px] gap-1 items-center px-3 py-2.5 hover:bg-muted/30 transition-colors ${
                      pub.status === 'pending' ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <div>
                      <Checkbox 
                        checked={selectedItems.includes(pub.id)}
                        onCheckedChange={() => toggleSelect(pub.id)}
                      />
                    </div>
                    
                    <div className="text-xs">
                      <div>{format(new Date(pub.publishDate), 'dd/MM/yy')}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <TypeIcon className={`h-3 w-3 ${type.color}`} />
                        {pub.type === 'sentence' ? 'Dec' : pub.type === 'dispatch' ? 'Des' : pub.type === 'intimation' ? 'Int' : 'Pub'}
                      </div>
                    </div>
                    
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-medium truncate">{pub.processNumber}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {pub.court} · {pub.organ}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {pub.parties}
                      </div>
                    </div>
                    
                    <div className="text-xs truncate">{pub.searchedName}</div>
                    
                    <div>
                      <Badge className={`text-[10px] font-semibold ${status.color}`}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Plus className="h-4 w-4 mr-2" />
                            Vincular
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Tratada
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Descartar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="h-7 bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2"
                          onClick={() => toggleRow(pub.id)}
                        >
                          {isExpanded ? '✕' : 'Ver'}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <div className="px-4 py-4 bg-slate-50 border-t">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed text-slate-700">
                            {pub.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Ver Fonte Original
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Processo:</span> {pub.processNumber}
                        </div>
                        <div>
                          <span className="font-medium">Órgão:</span> {pub.organ}
                        </div>
                        <div>
                          <span className="font-medium">Data de disponibilização:</span> {format(new Date(pub.publishDate), 'dd/MM/yyyy')}
                        </div>
                        <div>
                          <span className="font-medium">Tipo de comunicação:</span> {pub.communicationType}
                        </div>
                        <div>
                          <span className="font-medium">Meio:</span> Diário de Justiça Eletrônico
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 border-primary/20 bg-background shadow-lg z-50">
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedItems.length} selecionado(s)</span>
            <Button size="sm" variant="outline" className="gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Marcar como Tratada
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <Archive className="h-4 w-4" />
              Descartar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedItems([])}>
              Limpar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
