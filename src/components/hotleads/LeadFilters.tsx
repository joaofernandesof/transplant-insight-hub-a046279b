import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, LayoutGrid, List } from 'lucide-react';
import { PROCEDURES } from './LeadCard';

interface LeadFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  stateFilter: string;
  setStateFilter: (value: string) => void;
  procedureFilter: string;
  setProcedureFilter: (value: string) => void;
  licenseeFilter: string;
  setLicenseeFilter: (value: string) => void;
  viewMode: 'kanban' | 'list';
  setViewMode: (value: 'kanban' | 'list') => void;
  availableStates: string[];
  licensees: { id: string; name: string }[];
  isAdmin: boolean;
  filteredCount: number;
  totalCount: number;
}

export function LeadFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  stateFilter,
  setStateFilter,
  procedureFilter,
  setProcedureFilter,
  licenseeFilter,
  setLicenseeFilter,
  viewMode,
  setViewMode,
  availableStates,
  licensees,
  isAdmin,
  filteredCount,
  totalCount
}: LeadFiltersProps) {
  const hasFilters = searchTerm || statusFilter !== 'all' || stateFilter !== 'all' || 
    procedureFilter !== 'all' || licenseeFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStateFilter('all');
    setProcedureFilter('all');
    setLicenseeFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Selects */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="new">Lead Novo</SelectItem>
            <SelectItem value="contacted">Lead Captado</SelectItem>
            <SelectItem value="scheduled">Consulta Agendada</SelectItem>
            <SelectItem value="converted">Vendido</SelectItem>
            <SelectItem value="lost">Descartado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            {availableStates.sort().map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={procedureFilter} onValueChange={setProcedureFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Procedimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos procedimentos</SelectItem>
            {PROCEDURES.map(proc => (
              <SelectItem key={proc} value={proc}>{proc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && licensees.length > 0 && (
          <Select value={licenseeFilter} onValueChange={setLicenseeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Licenciado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos licenciados</SelectItem>
              {licensees.map(lic => (
                <SelectItem key={lic.id} value={lic.id}>{lic.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Exibindo {filteredCount} de {totalCount} leads
      </p>
    </div>
  );
}
