import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2, Filter, X } from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { ChamadoCard, NovoChamadoDialog } from '../components';
import { usePostVenda } from '../hooks/usePostVenda';
import { ETAPA_LABELS, TIPO_DEMANDA_OPTIONS, PRIORIDADE_LABELS } from '../lib/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function ChamadoListPage() {
  const { chamados, isLoading, stats } = usePostVenda();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filters
  const [tipoDemandaFilter, setTipoDemandaFilter] = useState<string>('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');

  // Get unique responsaveis
  const responsaveis = useMemo(() => {
    const set = new Set(chamados.map(c => c.responsavel_nome).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [chamados]);

  // Active filters count
  const activeFiltersCount = [tipoDemandaFilter, prioridadeFilter, responsavelFilter]
    .filter(f => f !== 'all').length;

  const filteredChamados = useMemo(() => {
    return chamados.filter(c => {
      // Text search
      const matchesSearch = !search || 
        c.paciente_nome.toLowerCase().includes(search.toLowerCase()) ||
        c.tipo_demanda.toLowerCase().includes(search.toLowerCase()) ||
        c.numero_chamado?.toString().includes(search);

      // Filters
      const matchesTipo = tipoDemandaFilter === 'all' || c.tipo_demanda === tipoDemandaFilter;
      const matchesPrioridade = prioridadeFilter === 'all' || c.prioridade === prioridadeFilter;
      const matchesResponsavel = responsavelFilter === 'all' || c.responsavel_nome === responsavelFilter;

      return matchesSearch && matchesTipo && matchesPrioridade && matchesResponsavel;
    });
  }, [chamados, search, tipoDemandaFilter, prioridadeFilter, responsavelFilter]);

  const clearFilters = () => {
    setTipoDemandaFilter('all');
    setPrioridadeFilter('all');
    setResponsavelFilter('all');
  };

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <GlobalBreadcrumb />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chamados</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, tipo ou número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
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

              <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {responsaveis.map(resp => (
                    <SelectItem key={resp} value={resp}>{resp}</SelectItem>
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

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {tipoDemandaFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Tipo: {TIPO_DEMANDA_OPTIONS.find(o => o.value === tipoDemandaFilter)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setTipoDemandaFilter('all')} 
                  />
                </Badge>
              )}
              {prioridadeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Prioridade: {PRIORIDADE_LABELS[prioridadeFilter]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setPrioridadeFilter('all')} 
                  />
                </Badge>
              )}
              {responsavelFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Responsável: {responsavelFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setResponsavelFilter('all')} 
                  />
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

      {/* Kanban por Etapa */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {etapas.map(etapa => {
            const etapaChamados = filteredChamados.filter(c => c.etapa_atual === etapa);
            return (
              <div key={etapa} className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="font-medium text-sm">{ETAPA_LABELS[etapa]}</span>
                  <Badge variant="secondary">{etapaChamados.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {etapaChamados.map(chamado => (
                    <ChamadoCard key={chamado.id} chamado={chamado} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovoChamadoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
