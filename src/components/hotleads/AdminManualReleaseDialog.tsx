import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Search,
  Unlock,
  Loader2,
  ArrowUpDown,
  MapPin,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface QueuedLead {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  state: string | null;
  created_at: string;
  tags: string[] | null;
}

interface AdminManualReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadReleased: () => void;
}

const PAGE_SIZE = 15;

export function AdminManualReleaseDialog({ open, onOpenChange, onLeadReleased }: AdminManualReleaseDialogProps) {
  const [leads, setLeads] = useState<QueuedLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [releasingIds, setReleasingIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);

  const fetchQueuedLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, city, state, created_at, tags')
        .in('source', ['planilha', 'n8n'])
        .eq('release_status', 'queued')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;
      setLeads((data || []) as QueuedLead[]);
    } catch (error) {
      console.error('Error fetching queued leads:', error);
      toast.error('Erro ao carregar leads na fila');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchQueuedLeads();
      setPage(1);
    }
  }, [open, fetchQueuedLeads]);

  const handleReleaseLead = useCallback(async (leadId: string) => {
    setReleasingIds(prev => new Set(prev).add(leadId));
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          release_status: 'available',
          available_at: new Date().toISOString(),
          status: 'new',
        })
        .eq('id', leadId)
        .eq('release_status', 'queued');

      if (error) throw error;

      toast.success('Lead liberado com sucesso!');
      setLeads(prev => prev.filter(l => l.id !== leadId));
      onLeadReleased();
    } catch (error) {
      console.error('Error releasing lead:', error);
      toast.error('Erro ao liberar lead');
    } finally {
      setReleasingIds(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  }, [onLeadReleased]);

  // Available states/cities from queued leads
  const availableStates = useMemo(() =>
    [...new Set(leads.map(l => l.state).filter(Boolean))] as string[], [leads]);

  const availableCities = useMemo(() => {
    const filtered = stateFilter !== 'all' ? leads.filter(l => l.state === stateFilter) : leads;
    return [...new Set(filtered.map(l => l.city).filter(Boolean))] as string[];
  }, [leads, stateFilter]);

  // Filtered + sorted
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (
          !lead.name?.toLowerCase().includes(s) &&
          !lead.phone?.toLowerCase().includes(s) &&
          !lead.city?.toLowerCase().includes(s)
        ) return false;
      }
      if (stateFilter !== 'all' && lead.state !== stateFilter) return false;
      if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc': return (a.name || '').localeCompare(b.name || '', 'pt-BR');
        case 'name_desc': return (b.name || '').localeCompare(a.name || '', 'pt-BR');
        case 'city_asc': return (a.city || '').localeCompare(b.city || '', 'pt-BR');
        case 'state_asc': return (a.state || '').localeCompare(b.state || '', 'pt-BR');
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [leads, searchTerm, stateFilter, cityFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchTerm, stateFilter, cityFilter, sortBy]);

  const hasFilters = searchTerm || stateFilter !== 'all' || cityFilter !== 'all' || sortBy !== 'recent';

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('all');
    setCityFilter('all');
    setSortBy('recent');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-orange-500" />
            Liberar Leads Manualmente
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredLeads.length} na fila)
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>

            <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCityFilter('all'); }}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado</SelectItem>
                {availableStates.sort().map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cidade</SelectItem>
                {availableCities.sort().map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="name_asc">Nome A-Z</SelectItem>
                <SelectItem value="name_desc">Nome Z-A</SelectItem>
                <SelectItem value="city_asc">Cidade A-Z</SelectItem>
                <SelectItem value="state_asc">Estado A-Z</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-xs">
                <X className="h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {hasFilters ? 'Nenhum lead encontrado com esses filtros.' : 'Nenhum lead na fila de espera.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Telefone</TableHead>
                  <TableHead className="text-xs">Cidade</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs">Criado em</TableHead>
                  <TableHead className="text-xs text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map(lead => (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="text-sm font-medium py-2">{lead.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2">{lead.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2">{lead.city || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2">{lead.state || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                        disabled={releasingIds.has(lead.id)}
                        onClick={() => handleReleaseLead(lead.id)}
                      >
                        {releasingIds.has(lead.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                        Liberar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
