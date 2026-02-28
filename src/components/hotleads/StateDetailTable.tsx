import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, ChevronDown, ChevronRight, Search, ArrowUp, ArrowDown, ArrowUpDown, Filter, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AllLeadStats } from '@/hooks/useAllLeadStats';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#f43f5e'];

type SortField = 'state' | 'total' | 'queued' | 'available' | 'claimed' | 'pct';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'with_available' | 'with_claimed' | 'no_claimed';

interface CityData {
  city: string;
  total: number;
  queued: number;
  available: number;
  claimed: number;
}

interface StateDetailTableProps {
  stats: AllLeadStats;
  COLORS: string[];
  fetchDrillDownLeads: (type: string, filter: string, title: string) => void;
}

export function StateDetailTable({ stats, fetchDrillDownLeads }: StateDetailTableProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [cityData, setCityData] = useState<Record<string, CityData[]>>({});
  const [loadingCities, setLoadingCities] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchCitiesForState = useCallback(async (state: string) => {
    if (cityData[state]) return;
    setLoadingCities(prev => new Set(prev).add(state));
    try {
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await supabase
          .from('leads')
          .select('city, release_status, claimed_by')
          .eq('state', state)
          .in('source', ['planilha', 'n8n'])
          .range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      // Aggregate by city
      const cityMap: Record<string, CityData> = {};
      allData.forEach((lead: any) => {
        const city = lead.city || 'N/A';
        if (!cityMap[city]) cityMap[city] = { city, total: 0, queued: 0, available: 0, claimed: 0 };
        cityMap[city].total++;
        if (lead.release_status === 'queued') cityMap[city].queued++;
        else if (lead.release_status === 'available' && !lead.claimed_by) cityMap[city].available++;
        if (lead.claimed_by) cityMap[city].claimed++;
      });
      const cities = Object.values(cityMap).sort((a, b) => b.total - a.total);
      setCityData(prev => ({ ...prev, [state]: cities }));
    } catch (e) {
      console.error('Error fetching cities for', state, e);
    } finally {
      setLoadingCities(prev => {
        const next = new Set(prev);
        next.delete(state);
        return next;
      });
    }
  }, [cityData]);

  const toggleState = useCallback((state: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
        fetchCitiesForState(state);
      }
      return next;
    });
  }, [fetchCitiesForState]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'state' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const filteredAndSortedStates = useMemo(() => {
    let data = [...stats.byState];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => s.state.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter === 'with_available') data = data.filter(s => s.available > 0);
    else if (statusFilter === 'with_claimed') data = data.filter(s => s.claimed > 0);
    else if (statusFilter === 'no_claimed') data = data.filter(s => s.claimed === 0);

    // Sort
    data.sort((a, b) => {
      let aVal: number | string, bVal: number | string;
      if (sortField === 'state') { aVal = a.state; bVal = b.state; }
      else if (sortField === 'pct') { aVal = a.total / (stats.total || 1); bVal = b.total / (stats.total || 1); }
      else { aVal = a[sortField]; bVal = b[sortField]; }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return data;
  }, [stats.byState, searchQuery, statusFilter, sortField, sortDir, stats.total]);

  const maxTotal = stats.byState[0]?.total || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              Todos os Estados — Detalhamento Completo
              <Badge variant="outline" className="font-normal text-[10px]">{filteredAndSortedStates.length} estados</Badge>
            </CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar estado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="with_available">Com disponíveis</SelectItem>
                <SelectItem value="with_claimed">Com adquiridos</SelectItem>
                <SelectItem value="no_claimed">Sem aquisições</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 gap-1"
              onClick={() => {
                const allStates = filteredAndSortedStates.map(s => s.state);
                if (expandedStates.size >= allStates.length) {
                  setExpandedStates(new Set());
                } else {
                  const newSet = new Set(allStates);
                  allStates.forEach(s => fetchCitiesForState(s));
                  setExpandedStates(newSet);
                }
              }}
            >
              {expandedStates.size >= filteredAndSortedStates.length && filteredAndSortedStates.length > 0
                ? <><ChevronDown className="h-3.5 w-3.5" /> Recolher todos</>
                : <><ChevronRight className="h-3.5 w-3.5" /> Expandir todos</>
              }
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-8 py-2.5 px-2"></th>
                {[
                  { field: 'state' as SortField, label: 'Estado', align: 'left' },
                  { field: 'total' as SortField, label: 'Volume', align: 'left', minW: 'min-w-[200px]' },
                  { field: 'total' as SortField, label: 'Total', align: 'right' },
                  { field: 'queued' as SortField, label: 'Na Fila', align: 'right' },
                  { field: 'available' as SortField, label: 'Disponíveis', align: 'right' },
                  { field: 'claimed' as SortField, label: 'Adquiridos', align: 'right' },
                  { field: 'pct' as SortField, label: '%', align: 'right' },
                ].map((col, idx) => (
                  <th
                    key={idx}
                    className={`py-2.5 px-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.minW || ''}`}
                    onClick={() => col.field !== 'total' || col.label !== 'Volume' ? handleSort(col.field) : handleSort('total')}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.label !== 'Volume' && <SortIcon field={col.field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStates.map((s, i) => {
                const pct = stats.total > 0 ? ((s.total / stats.total) * 100) : 0;
                const barWidth = (s.total / maxTotal) * 100;
                const queuedWidth = s.total > 0 ? (s.queued / s.total) * barWidth : 0;
                const availableWidth = s.total > 0 ? (s.available / s.total) * barWidth : 0;
                const claimedWidth = s.total > 0 ? (s.claimed / s.total) * barWidth : 0;
                const isExpanded = expandedStates.has(s.state);
                const isLoadingCity = loadingCities.has(s.state);
                const cities = cityData[s.state] || [];

                return (
                  <>
                    <tr
                      key={s.state}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                      onClick={() => toggleState(s.state)}
                    >
                      <td className="py-2.5 px-2 text-center">
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground mx-auto" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto" />
                        }
                      </td>
                      <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {s.state}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted/50">
                          {queuedWidth > 0 && (
                            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${queuedWidth}%` }} title={`Na Fila: ${s.queued.toLocaleString('pt-BR')}`} />
                          )}
                          {availableWidth > 0 && (
                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${availableWidth}%` }} title={`Disponíveis: ${s.available.toLocaleString('pt-BR')}`} />
                          )}
                          {claimedWidth > 0 && (
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${claimedWidth}%` }} title={`Adquiridos: ${s.claimed.toLocaleString('pt-BR')}`} />
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2.5 px-3 font-bold">{s.total.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3 text-amber-600 font-medium">{s.queued.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3 text-green-600 font-medium">{s.available.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3 text-blue-600 font-medium">{s.claimed.toLocaleString('pt-BR')}</td>
                      <td className="text-right py-2.5 px-3">
                        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${s.state}-cities`}>
                        <td colSpan={8} className="p-0">
                          <div className="bg-muted/10 border-t">
                            {isLoadingCity ? (
                              <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground text-xs">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Carregando cidades...
                              </div>
                            ) : cities.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-xs">Nenhuma cidade encontrada</div>
                            ) : (
                              <div className="max-h-[300px] overflow-auto">
                                <table className="w-full text-xs">
                                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                                    <tr>
                                      <th className="w-8 py-1.5 px-2"></th>
                                      <th className="text-left py-1.5 px-3 font-medium text-muted-foreground">Cidade</th>
                                      <th className="text-left py-1.5 px-3 font-medium text-muted-foreground min-w-[140px]">Volume</th>
                                      <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Total</th>
                                      <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Na Fila</th>
                                      <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Disponíveis</th>
                                      <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">Adquiridos</th>
                                      <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">%</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cities.map((city, ci) => {
                                      const cityPct = s.total > 0 ? ((city.total / s.total) * 100) : 0;
                                      const cityMaxTotal = cities[0]?.total || 1;
                                      const cityBarWidth = (city.total / cityMaxTotal) * 100;
                                      const cqw = city.total > 0 ? (city.queued / city.total) * cityBarWidth : 0;
                                      const caw = city.total > 0 ? (city.available / city.total) * cityBarWidth : 0;
                                      const ccw = city.total > 0 ? (city.claimed / city.total) * cityBarWidth : 0;
                                      return (
                                        <tr key={city.city} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                          <td className="py-1.5 px-2"></td>
                                          <td className="py-1.5 px-3 font-medium text-muted-foreground flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                            {city.city}
                                          </td>
                                          <td className="py-1.5 px-3">
                                            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted/50">
                                              {cqw > 0 && <div className="h-full bg-amber-400" style={{ width: `${cqw}%` }} />}
                                              {caw > 0 && <div className="h-full bg-green-500" style={{ width: `${caw}%` }} />}
                                              {ccw > 0 && <div className="h-full bg-blue-500" style={{ width: `${ccw}%` }} />}
                                            </div>
                                          </td>
                                          <td className="text-right py-1.5 px-3 font-semibold">{city.total.toLocaleString('pt-BR')}</td>
                                          <td className="text-right py-1.5 px-3 text-amber-600">{city.queued.toLocaleString('pt-BR')}</td>
                                          <td className="text-right py-1.5 px-3 text-green-600">{city.available.toLocaleString('pt-BR')}</td>
                                          <td className="text-right py-1.5 px-3 text-blue-600">{city.claimed.toLocaleString('pt-BR')}</td>
                                          <td className="text-right py-1.5 px-3 text-muted-foreground">{cityPct.toFixed(1)}%</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30">
                <td className="py-2.5 px-2"></td>
                <td className="py-2.5 px-3 font-bold">TOTAL</td>
                <td className="py-2.5 px-3"></td>
                <td className="text-right py-2.5 px-3 font-bold">{stats.total.toLocaleString('pt-BR')}</td>
                <td className="text-right py-2.5 px-3 font-bold text-amber-600">{stats.queued.toLocaleString('pt-BR')}</td>
                <td className="text-right py-2.5 px-3 font-bold text-green-600">{stats.available.toLocaleString('pt-BR')}</td>
                <td className="text-right py-2.5 px-3 font-bold text-blue-600">{stats.claimed.toLocaleString('pt-BR')}</td>
                <td className="text-right py-2.5 px-3 font-bold">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
