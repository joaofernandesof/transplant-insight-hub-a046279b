/**
 * AvivarLeads - Lista de leads com visual IA roxo/violeta
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
  hot: { icon: Flame, color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Quente' },
  warm: { icon: ThermometerSun, color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Morno' },
  cold: { icon: Snowflake, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Frio' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  contacted: { label: 'Contatado', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  scheduled: { label: 'Agendado', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  converted: { label: 'Convertido', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  lost: { label: 'Perdido', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Leads
            <Sparkles className="h-5 w-5 text-purple-400" />
          </h1>
          <p className="text-slate-400">Gerencie todos os seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400/60" />
            <Input
              placeholder="Buscar leads..."
              className="pl-10 w-64 bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400/40 focus:border-purple-400"
            />
          </div>
          <Button variant="outline" className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/90 border-slate-700/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Nome</TableHead>
                <TableHead className="text-slate-300">Interesse</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Procedimento</TableHead>
                <TableHead className="text-slate-300">Cidade</TableHead>
                <TableHead className="text-slate-300">Fonte</TableHead>
                <TableHead className="text-slate-300 text-right">Valor</TableHead>
                <TableHead className="text-slate-300 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => {
                const interest = interestConfig[lead.interest_level as keyof typeof interestConfig];
                const status = statusConfig[lead.status];
                const InterestIcon = interest.icon;

                return (
                  <TableRow key={lead.id} className="border-slate-700/50 hover:bg-slate-800/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="text-xs text-slate-400">{lead.email}</p>
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
                    <TableCell className="text-slate-200">{lead.procedure}</TableCell>
                    <TableCell className="text-slate-400">{lead.city}</TableCell>
                    <TableCell className="text-slate-400">{lead.source}</TableCell>
                    <TableCell className="text-right text-slate-200 font-medium">{formatCurrency(lead.value)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-purple-500/20">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-purple-500/20">
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
