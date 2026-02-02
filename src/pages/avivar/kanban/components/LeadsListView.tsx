/**
 * LeadsListView - Visualização em lista dos leads do Kanban
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, User, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}

// Mock data para demonstração - será substituído por dados reais
const mockLeads = [
  { id: '1', name: 'Maria Silva', phone: '(11) 99999-0001', email: 'maria@email.com', createdAt: '2026-01-28', columnId: '' },
  { id: '2', name: 'João Santos', phone: '(11) 99999-0002', email: 'joao@email.com', createdAt: '2026-01-29', columnId: '' },
  { id: '3', name: 'Ana Costa', phone: '(11) 99999-0003', email: 'ana@email.com', createdAt: '2026-01-30', columnId: '' },
];

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

export function LeadsListView({ columns }: LeadsListViewProps) {
  // Associar leads às colunas (por enquanto mock)
  const leadsWithColumns = columns.length > 0 
    ? mockLeads.map((lead, index) => ({
        ...lead,
        columnId: columns[index % columns.length].id,
        column: columns[index % columns.length],
      }))
    : [];

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
    <div className="flex-1 overflow-auto p-4">
      <div className="bg-[hsl(var(--avivar-card))] rounded-xl border border-[hsl(var(--avivar-border))] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[hsl(var(--avivar-border))] hover:bg-transparent">
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
                  className="border-b border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-primary)/0.05)] cursor-pointer transition-colors"
                >
                  <TableCell className="font-medium text-[hsl(var(--avivar-foreground))]">
                    {lead.name}
                  </TableCell>
                  <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                    {lead.phone}
                  </TableCell>
                  <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                    {lead.email}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={`${getColumnColor(lead.column.color)} text-white border-0`}
                    >
                      {lead.column.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
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
                  colSpan={6} 
                  className="h-32 text-center text-[hsl(var(--avivar-muted-foreground))]"
                >
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
