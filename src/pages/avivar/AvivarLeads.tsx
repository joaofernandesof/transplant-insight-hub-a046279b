/**
 * AvivarLeads - Lista de leads com suporte a tema claro/escuro
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Filter, Flame, ThermometerSun, Snowflake, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockLeads = [
  { id: '1', name: 'Maria Silva', phone: '11999887766', email: 'maria@email.com', city: 'São Paulo', source: 'Instagram', interest_level: 'hot', status: 'new', procedure: 'Transplante FUE', value: 15000, created_at: '2025-01-28' },
  { id: '2', name: 'João Santos', phone: '21988776655', email: 'joao@email.com', city: 'Rio de Janeiro', source: 'Google Ads', interest_level: 'warm', status: 'contacted', procedure: 'Tratamento Capilar', value: 2500, created_at: '2025-01-27' },
  { id: '3', name: 'Ana Costa', phone: '31977665544', email: 'ana@email.com', city: 'Belo Horizonte', source: 'Indicação', interest_level: 'hot', status: 'scheduled', procedure: 'Transplante FUE', value: 18000, created_at: '2025-01-26' },
  { id: '4', name: 'Carlos Mendes', phone: '41966554433', email: 'carlos@email.com', city: 'Curitiba', source: 'WhatsApp', interest_level: 'warm', status: 'contacted', procedure: 'Micropigmentação', value: 3500, created_at: '2025-01-25' },
  { id: '5', name: 'Patricia Lima', phone: '51955443322', email: 'patricia@email.com', city: 'Porto Alegre', source: 'Site', interest_level: 'cold', status: 'new', procedure: 'Consulta', value: 250, created_at: '2025-01-24' },
];

const interestConfig = {
  hot: { icon: Flame, color: 'text-red-500', bgColor: 'bg-red-500/15', label: 'Quente' },
  warm: { icon: ThermometerSun, color: 'text-amber-500', bgColor: 'bg-amber-500/15', label: 'Morno' },
  cold: { icon: Snowflake, color: 'text-blue-500', bgColor: 'bg-blue-500/15', label: 'Frio' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]' },
  contacted: { label: 'Contatado', color: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30' },
  scheduled: { label: 'Agendado', color: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  converted: { label: 'Convertido', color: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' },
  lost: { label: 'Perdido', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30' },
};

export default function AvivarLeads() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Leads
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Gerencie todos os seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input
              placeholder="Buscar leads..."
              className="pl-10 w-64 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] focus:border-[hsl(var(--avivar-primary))]"
            />
          </div>
          <Button variant="outline" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.25)]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-secondary))]">
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Nome</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Interesse</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Status</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Procedimento</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Cidade</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Fonte</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] text-right">Valor</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => {
                const interest = interestConfig[lead.interest_level as keyof typeof interestConfig];
                const status = statusConfig[lead.status];
                const InterestIcon = interest.icon;

                return (
                  <TableRow key={lead.id} className="border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-secondary))]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">{lead.name}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn('flex items-center gap-2 px-2 py-1 rounded-lg w-fit', interest.bgColor)}>
                        <InterestIcon className={cn('h-4 w-4', interest.color)} />
                        <span className={cn('text-xs', interest.color)}>{interest.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-[hsl(var(--avivar-foreground))]">{lead.procedure}</TableCell>
                    <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">{lead.city}</TableCell>
                    <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">{lead.source}</TableCell>
                    <TableCell className="text-right text-[hsl(var(--avivar-foreground))] font-medium">{formatCurrency(lead.value)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
