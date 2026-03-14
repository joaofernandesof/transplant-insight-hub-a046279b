// ====================================
// KommoFiltersBar - Barra de Filtros Globais
// ====================================

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Filter, X, RefreshCw } from 'lucide-react';
import { useKommoFilters, DatePreset } from '../contexts/KommoFiltersContext';
import { useKommoPipelines, useKommoUsers, useKommoSync } from '../hooks/useKommoData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'custom', label: 'Personalizado' },
];

export default function KommoFiltersBar() {
  const {
    filters,
    setDatePreset,
    setCustomDateRange,
    setPipelines,
    setResponsibles,
    resetFilters,
    activeFilterCount,
  } = useKommoFilters();

  const { data: pipelines = [] } = useKommoPipelines();
  const { data: users = [] } = useKommoUsers();
  const syncMutation = useKommoSync();

  const [showCustomDate, setShowCustomDate] = useState(false);

  const activeUsers = useMemo(() => users.filter(u => u.is_active), [users]);

  const handleDatePreset = (value: string) => {
    if (value === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      setDatePreset(value as DatePreset);
    }
  };

  const togglePipeline = (kommoId: number) => {
    const current = filters.pipelineKommoIds;
    setPipelines(
      current.includes(kommoId)
        ? current.filter(id => id !== kommoId)
        : [...current, kommoId]
    );
  };

  const toggleResponsible = (kommoId: number) => {
    const current = filters.responsibleUserKommoIds;
    setResponsibles(
      current.includes(kommoId)
        ? current.filter(id => id !== kommoId)
        : [...current, kommoId]
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Date Preset */}
      <Select value={filters.datePreset} onValueChange={handleDatePreset}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map(p => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date range */}
      {showCustomDate && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              {format(filters.dateFrom, 'dd/MM', { locale: ptBR })} - {format(filters.dateTo, 'dd/MM', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: filters.dateFrom, to: filters.dateTo }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setCustomDateRange(range.from, range.to);
                }
              }}
              locale={ptBR}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Pipeline Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            Funis
            {filters.pipelineKommoIds.length > 0 && (
              <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {filters.pipelineKommoIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <ScrollArea className="max-h-48">
            <div className="space-y-1">
              {pipelines.map(p => (
                <label key={p.kommo_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs">
                  <Checkbox
                    checked={filters.pipelineKommoIds.includes(p.kommo_id)}
                    onCheckedChange={() => togglePipeline(p.kommo_id)}
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
              {pipelines.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">Sincronize para ver funis</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Responsible Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            Responsável
            {filters.responsibleUserKommoIds.length > 0 && (
              <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {filters.responsibleUserKommoIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <ScrollArea className="max-h-48">
            <div className="space-y-1">
              {activeUsers.map(u => (
                <label key={u.kommo_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs">
                  <Checkbox
                    checked={filters.responsibleUserKommoIds.includes(u.kommo_id)}
                    onCheckedChange={() => toggleResponsible(u.kommo_id)}
                  />
                  <span className="truncate">{u.name}</span>
                </label>
              ))}
              {activeUsers.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">Sincronize para ver usuários</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Active filter count + reset */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={resetFilters}>
          <X className="h-3 w-3" />
          Limpar ({activeFilterCount})
        </Button>
      )}

      {/* Sync button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={() => syncMutation.mutate({})}
        disabled={syncMutation.isPending}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
        Sync
      </Button>
    </div>
  );
}
