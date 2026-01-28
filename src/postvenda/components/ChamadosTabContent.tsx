import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { NovoChamadoDialog } from './NovoChamadoDialog';
import { Chamado, usePostVenda } from '../hooks/usePostVenda';
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

export function ChamadosTabContent() {
  const { chamados, isLoading } = usePostVenda();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filters
  const [tipoDemandaFilter, setTipoDemandaFilter] = useState<string>('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [etapaFilter, setEtapaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting
  type SortField = 'created_at' | 'paciente_nome' | 'tipo_demanda' | 'prioridade' | 'etapa_atual' | 'status' | 'responsavel_nome' | 'sla';
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
        c.numero_chamado?.toString().includes(search);

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
        case 'responsavel_nome':
          cmp = (a.responsavel_nome || '').localeCompare(b.responsavel_nome || '');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lista de Chamados</h2>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, tipo ou número..."
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
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('created_at')}>
                    <div className="flex items-center gap-2">Criado <SortIcon field="created_at" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('paciente_nome')}>
                    <div className="flex items-center gap-2">Paciente <SortIcon field="paciente_nome" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('tipo_demanda')}>
                    <div className="flex items-center gap-2">Tipo <SortIcon field="tipo_demanda" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('prioridade')}>
                    <div className="flex items-center gap-2">Prioridade <SortIcon field="prioridade" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('etapa_atual')}>
                    <div className="flex items-center gap-2">Etapa <SortIcon field="etapa_atual" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-2">Status <SortIcon field="status" /></div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort('sla')}>
                    <div className="flex items-center gap-2">SLA <SortIcon field="sla" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedChamados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
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
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(c.created_at), { locale: ptBR, addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">#{String(c.numero_chamado ?? '').padStart(5, '0')}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{c.paciente_nome}</div>
                        <div className="text-xs text-muted-foreground">{c.paciente_telefone || ''}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {TIPO_DEMANDA_OPTIONS.find(o => o.value === c.tipo_demanda)?.label || c.tipo_demanda}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">{PRIORIDADE_LABELS[c.prioridade]}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary">{ETAPA_LABELS[c.etapa_atual]}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">{STATUS_LABELS[c.status]}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {c.sla_prazo_fim ? (
                          <span className={c.sla_estourado ? 'text-destructive font-medium' : ''}>
                            {new Date(c.sla_prazo_fim) < new Date() ? 'Estourado' : formatDistanceToNow(new Date(c.sla_prazo_fim), { locale: ptBR, addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sem SLA</span>
                        )}
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

      <NovoChamadoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
