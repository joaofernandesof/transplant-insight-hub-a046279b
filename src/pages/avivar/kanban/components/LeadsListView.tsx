/**
 * LeadsListView - Visualização em lista dos leads do Kanban
 * Com checkboxes para seleção, ações em massa, e filtros
 */

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, User, Phone, Mail, Calendar, Search, Plus, Filter, RefreshCw, Trash2, Users, ArrowRight, Tags, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { KanbanLead } from '../hooks/useKanbanLeads';

interface KanbanColumnData {
  id: string;
  kanban_id: string;
  name: string;
  color: string;
  order_index: number;
  ai_instruction?: string | null;
}

interface LeadsListViewProps {
  columns: KanbanColumnData[];
  leads: KanbanLead[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddLead: () => void;
  onRefresh: () => void;
  kanbanId: string;
}

const getColumnColor = (color: string) => {
  const colorMap: Record<string, string> = {
    'from-amber-500 to-orange-600': 'bg-amber-500',
    'from-emerald-500 to-teal-600': 'bg-emerald-500',
    'from-rose-500 to-pink-600': 'bg-rose-500',
    'from-blue-500 to-indigo-600': 'bg-blue-500',
    'from-purple-500 to-violet-600': 'bg-purple-500',
    'from-cyan-500 to-sky-600': 'bg-cyan-500',
    'from-lime-500 to-green-600': 'bg-lime-500',
    'from-fuchsia-500 to-pink-600': 'bg-fuchsia-500',
    'from-yellow-500 to-amber-600': 'bg-yellow-500',
    'from-red-500 to-rose-600': 'bg-red-500',
    'from-indigo-500 to-purple-600': 'bg-indigo-500',
    'from-teal-500 to-emerald-600': 'bg-teal-500',
  };
  return colorMap[color] || 'bg-gray-500';
};

// Source indicator colors
const sourceColors: Record<string, string> = {
  'whatsapp': 'bg-green-500',
  'instagram': 'bg-gradient-to-br from-purple-500 to-pink-500',
  'facebook': 'bg-blue-600',
  'google': 'bg-red-500',
  'site': 'bg-cyan-500',
  'indicacao': 'bg-amber-500',
  'manual': 'bg-gray-500',
  'default': 'bg-violet-500',
};

const getSourceColor = (source: string | null) => {
  if (!source) return sourceColors.default;
  const normalized = source.toLowerCase().trim();
  return sourceColors[normalized] || sourceColors.default;
};

export function LeadsListView({ columns, leads, searchQuery, onSearchChange, onAddLead, onRefresh, kanbanId }: LeadsListViewProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      lead.source?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  // Get column info for each lead
  const leadsWithColumns = filteredLeads.map(lead => {
    const column = columns.find(c => c.id === lead.column_id);
    return { ...lead, column };
  });

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelect = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const clearSelection = () => setSelectedLeads([]);

  const hasSelection = selectedLeads.length > 0;

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Crie colunas para visualizar os leads
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="sticky top-0 z-10 bg-[hsl(var(--avivar-primary))] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">{selectedLeads.length} selecionado(s)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-white hover:bg-white/20"
            >
              Limpar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Users className="h-4 w-4 mr-1" />
              Unir Leads
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <ArrowRight className="h-4 w-4 mr-1" />
              Mover Etapa
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Tags className="h-4 w-4 mr-1" />
              Tags
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Edit className="h-4 w-4 mr-1" />
              Responsável
            </Button>
            <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-[hsl(var(--avivar-card))] rounded-xl border border-[hsl(var(--avivar-border))] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[hsl(var(--avivar-border))] hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] font-semibold">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome
                  </div>
                </TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] font-semibold">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </div>
                </TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] font-semibold">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] font-semibold">
                  Fonte
                </TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] font-semibold">
                  Etapa
                </TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Criado em
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsWithColumns.length > 0 ? (
                leadsWithColumns.map((lead) => (
                  <TableRow 
                    key={lead.id}
                    className={cn(
                      "border-b border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-primary)/0.05)] cursor-pointer transition-colors",
                      selectedLeads.includes(lead.id) && "bg-[hsl(var(--avivar-primary)/0.1)]"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Source indicator */}
                        <div 
                          className={cn("w-2 h-2 rounded-full flex-shrink-0", getSourceColor(lead.source))}
                          title={lead.source || 'Desconhecido'}
                        />
                        <span className="font-medium text-[hsl(var(--avivar-foreground))]">
                          {lead.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                      {lead.phone || '-'}
                    </TableCell>
                    <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                      {lead.email || '-'}
                    </TableCell>
                    <TableCell>
                      {lead.source && (
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.column && (
                        <Badge 
                          variant="secondary"
                          className={`${getColumnColor(lead.column.color)} text-white border-0`}
                        >
                          {lead.column.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
                        >
                          <DropdownMenuItem className="cursor-pointer">
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            Mover para...
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={8} 
                    className="h-32 text-center text-[hsl(var(--avivar-muted-foreground))]"
                  >
                    {searchQuery ? 'Nenhum lead encontrado para esta busca' : 'Nenhum lead cadastrado'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
