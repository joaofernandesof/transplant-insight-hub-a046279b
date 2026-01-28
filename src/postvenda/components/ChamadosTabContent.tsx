import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Gavel, ExternalLink } from 'lucide-react';
import { NovoChamadoDialog } from './NovoChamadoDialog';
import { Chamado, usePostVenda, getSlaStatus } from '../hooks/usePostVenda';
import { ETAPA_LABELS, PRIORIDADE_LABELS, STATUS_LABELS, TIPO_DEMANDA_OPTIONS } from '../lib/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChamadosTabContentProps {
  initialTipoFilter?: string;
}

// Badge color configurations
const PRIORIDADE_COLORS: Record<string, string> = {
  urgente: 'bg-destructive text-destructive-foreground',
  alta: 'bg-orange-500 text-white',
  normal: 'bg-blue-500 text-white',
  baixa: 'bg-muted text-muted-foreground',
};

const ETAPA_COLORS: Record<string, string> = {
  triagem: 'bg-slate-600 text-white',
  atendimento: 'bg-blue-600 text-white',
  resolucao: 'bg-purple-600 text-white',
  validacao_paciente: 'bg-amber-600 text-white',
  nps: 'bg-emerald-600 text-white',
  encerrado: 'bg-gray-400 text-white',
};

const STATUS_COLORS: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-800 border-blue-200',
  em_andamento: 'bg-amber-100 text-amber-800 border-amber-200',
  aguardando_paciente: 'bg-purple-100 text-purple-800 border-purple-200',
  resolvido: 'bg-green-100 text-green-800 border-green-200',
  fechado: 'bg-gray-100 text-gray-800 border-gray-200',
  reaberto: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

const SLA_COLORS = {
  ok: 'text-green-600',
  warning: 'text-amber-600 font-medium',
  danger: 'text-destructive font-bold',
  none: 'text-muted-foreground',
};

export function ChamadosTabContent({ initialTipoFilter }: ChamadosTabContentProps) {
  const { chamados, isLoading } = usePostVenda();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filters
  const [tipoDemandaFilter, setTipoDemandaFilter] = useState<string>(initialTipoFilter || 'all');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [etapaFilter, setEtapaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting
  type SortField = 'created_at' | 'paciente_nome' | 'paciente_telefone' | 'tipo_demanda' | 'prioridade' | 'etapa_atual' | 'status' | 'sla';
  type SortDir = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Get unique responsaveis
  const responsaveis = useMemo(() => {
    const set = new Set(chamados.map(c => c.responsavel_nome).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [chamados]);

  // Active filters count
  const activeFiltersCount = [tipoDemandaFilter, prioridadeFilter, responsavelFilter, etapaFilter, statusFilter]
    .filter(f => f !== 'all').length;

  const filteredChamados = useMemo(() => {
    const res = chamados.filter(c => {
      const matchesSearch = !search || 
        c.paciente_nome.toLowerCase().includes(search.toLowerCase()) ||
        c.tipo_demanda.toLowerCase().includes(search.toLowerCase()) ||
        c.numero_chamado?.toString().includes(search) ||
        c.paciente_telefone?.includes(search);

      const matchesTipo = tipoDemandaFilter === 'all' || c.tipo_demanda === tipoDemandaFilter;
      const matchesPrioridade = prioridadeFilter === 'all' || c.prioridade === prioridadeFilter;
      const matchesResponsavel = responsavelFilter === 'all' || c.responsavel_nome === responsavelFilter;
      const matchesEtapa = etapaFilter === 'all' || c.etapa_atual === etapaFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesTipo && matchesPrioridade && matchesResponsavel && matchesEtapa && matchesStatus;
    });

    const sorted = [...res].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const getSlaValue = (c: Chamado) => {
        if (!c.sla_prazo_fim) return Number.POSITIVE_INFINITY;
        return new Date(c.sla_prazo_fim).getTime();
      };

      let cmp = 0;
      switch (sortField) {
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'paciente_nome':
          cmp = (a.paciente_nome || '').localeCompare(b.paciente_nome || '');
          break;
        case 'paciente_telefone':
          cmp = (a.paciente_telefone || '').localeCompare(b.paciente_telefone || '');
          break;
        case 'tipo_demanda':
          cmp = (a.tipo_demanda || '').localeCompare(b.tipo_demanda || '');
          break;
        case 'prioridade': {
          const order = { urgente: 0, alta: 1, normal: 2, baixa: 3 } as const;
          cmp = (order[a.prioridade] ?? 99) - (order[b.prioridade] ?? 99);
          break;
        }
        case 'etapa_atual':
          cmp = (a.etapa_atual || '').localeCompare(b.etapa_atual || '');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '');
          break;
        case 'sla':
          cmp = getSlaValue(a) - getSlaValue(b);
          break;
      }
      return cmp * dir;
    });

    return sorted;
  }, [chamados, etapaFilter, prioridadeFilter, responsavelFilter, search, sortDir, sortField, statusFilter, tipoDemandaFilter]);

  const clearFilters = () => {
    setTipoDemandaFilter('all');
    setPrioridadeFilter('all');
    setResponsavelFilter('all');
    setEtapaFilter('all');
    setStatusFilter('all');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const pageCount = Math.max(1, Math.ceil(filteredChamados.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginatedChamados = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredChamados.slice(start, start + pageSize);
  }, [filteredChamados, pageSize, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search, tipoDemandaFilter, prioridadeFilter, responsavelFilter, etapaFilter, statusFilter, pageSize, sortField, sortDir]);

  // Header dinâmico baseado no filtro
  const isDistrato = tipoDemandaFilter === 'distrato';

  // Render SLA with color
  const renderSla = (chamado: Chamado) => {
    if (!chamado.sla_prazo_fim) {
      return <span className={SLA_COLORS.none}>Sem SLA</span>;
    }
    
    const slaStatus = getSlaStatus(chamado);
    const prazo = new Date(chamado.sla_prazo_fim);
    const isExpired = prazo < new Date();
    
    return (
      <span className={SLA_COLORS[slaStatus]}>
        {isExpired ? 'Estourado' : formatDistanceToNow(prazo, { locale: ptBR, addSuffix: true })}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">
            {isDistrato ? 'Chamados de Distrato' : 'Lista de Chamados'}
          </h2>
          {isDistrato && (
            <Badge variant="outline" className="border-destructive text-destructive gap-1">
              <Gavel className="h-3 w-3" />
              Filtrado
            </Badge>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {isDistrato ? 'Novo Distrato' : 'Novo Chamado'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, tipo, número ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={etapaFilter} onValueChange={setEtapaFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {Object.entries(ETAPA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tipoDemandaFilter} onValueChange={setTipoDemandaFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Demanda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {TIPO_DEMANDA_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Limpar ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {etapaFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Etapa: {ETAPA_LABELS[etapaFilter]}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setEtapaFilter('all')} />
                </Badge>
              )}
              {tipoDemandaFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {TIPO_DEMANDA_OPTIONS.find(o => o.value === tipoDemandaFilter)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setTipoDemandaFilter('all')} />
                </Badge>
              )}
              {prioridadeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Prioridade: {PRIORIDADE_LABELS[prioridadeFilter]}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setPrioridadeFilter('all')} />
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {STATUS_LABELS[statusFilter]}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredChamados.length} chamado{filteredChamados.length !== 1 ? 's' : ''} encontrado{filteredChamados.length !== 1 ? 's' : ''}
        {activeFiltersCount > 0 && ` (de ${chamados.length} total)`}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap cursor-pointer w-[100px]" onClick={() => toggleSort('created_at')}>
                    <div className="flex items-center gap-2">Criado <SortIcon field="created_at" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('paciente_nome')}>
                    <div className="flex items-center gap-2">Paciente <SortIcon field="paciente_nome" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer w-[130px]" onClick={() => toggleSort('paciente_telefone')}>
                    <div className="flex items-center gap-2">Telefone <SortIcon field="paciente_telefone" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('tipo_demanda')}>
                    <div className="flex items-center gap-2">Tipo <SortIcon field="tipo_demanda" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer w-[100px]" onClick={() => toggleSort('prioridade')}>
                    <div className="flex items-center gap-2">Prioridade <SortIcon field="prioridade" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer w-[140px]" onClick={() => toggleSort('etapa_atual')}>
                    <div className="flex items-center gap-2">Etapa <SortIcon field="etapa_atual" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer w-[140px]" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-2">Status <SortIcon field="status" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer w-[120px]" onClick={() => toggleSort('sla')}>
                    <div className="flex items-center gap-2">SLA <SortIcon field="sla" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedChamados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhum chamado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedChamados.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/neoteam/postvenda/chamados/${c.id}`)}
                    >
                      {/* Criado */}
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">#{String(c.numero_chamado ?? '').padStart(5, '0')}</div>
                      </TableCell>
                      
                      {/* Paciente - Nome com link para perfil */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.paciente_nome}</span>
                          {c.paciente_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-50 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/neoteam/patients/${c.paciente_id}`);
                              }}
                              title="Ver perfil do paciente"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Telefone */}
                      <TableCell className="whitespace-nowrap">
                        <span className="text-muted-foreground text-sm font-mono">
                          {c.paciente_telefone || '-'}
                        </span>
                      </TableCell>
                      
                      {/* Tipo */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {c.tipo_demanda === 'distrato' && (
                            <Gavel className="h-4 w-4 text-destructive" />
                          )}
                          <span>{TIPO_DEMANDA_OPTIONS.find(o => o.value === c.tipo_demanda)?.label || c.tipo_demanda}</span>
                        </div>
                      </TableCell>
                      
                      {/* Prioridade */}
                      <TableCell className="whitespace-nowrap">
                        <Badge className={cn("border-0", PRIORIDADE_COLORS[c.prioridade])}>
                          {PRIORIDADE_LABELS[c.prioridade]}
                        </Badge>
                      </TableCell>
                      
                      {/* Etapa */}
                      <TableCell className="whitespace-nowrap">
                        <Badge className={cn("border-0", ETAPA_COLORS[c.etapa_atual])}>
                          {ETAPA_LABELS[c.etapa_atual]}
                        </Badge>
                      </TableCell>
                      
                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={cn("border", STATUS_COLORS[c.status])}>
                          {STATUS_LABELS[c.status]}
                        </Badge>
                      </TableCell>
                      
                      {/* SLA */}
                      <TableCell className="whitespace-nowrap">
                        {renderSla(c)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {safePage} de {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount}
              onClick={() => setPage(safePage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <NovoChamadoDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        initialTipoDemanda={isDistrato ? 'distrato' : undefined}
      />
    </div>
  );
}
