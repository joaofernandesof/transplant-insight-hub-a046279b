/**
 * AvivarPipeline - Kanban de leads com visual roxo/violeta IA
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  Flame,
  ThermometerSun,
  Snowflake,
  ArrowRight,
  Zap,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mock data
const mockLeads = [
  { id: '1', name: 'Maria Silva', phone: '11999887766', email: 'maria@email.com', city: 'São Paulo', state: 'SP', source: 'Instagram', interest_level: 'hot', status: 'new', procedure: 'Transplante FUE', value: 15000 },
  { id: '2', name: 'João Santos', phone: '21988776655', email: 'joao@email.com', city: 'Rio de Janeiro', state: 'RJ', source: 'Google Ads', interest_level: 'warm', status: 'new', procedure: 'Tratamento Capilar', value: 2500 },
  { id: '3', name: 'Ana Costa', phone: '31977665544', email: 'ana@email.com', city: 'Belo Horizonte', state: 'MG', source: 'Indicação', interest_level: 'hot', status: 'contacted', procedure: 'Transplante FUE', value: 18000 },
  { id: '4', name: 'Carlos Mendes', phone: '41966554433', email: 'carlos@email.com', city: 'Curitiba', state: 'PR', source: 'WhatsApp', interest_level: 'warm', status: 'contacted', procedure: 'Micropigmentação', value: 3500 },
  { id: '5', name: 'Patricia Lima', phone: '51955443322', email: 'patricia@email.com', city: 'Porto Alegre', state: 'RS', source: 'Site', interest_level: 'cold', status: 'scheduled', procedure: 'Consulta', value: 250 },
  { id: '6', name: 'Roberto Alves', phone: '61944332211', email: 'roberto@email.com', city: 'Brasília', state: 'DF', source: 'Instagram', interest_level: 'hot', status: 'scheduled', procedure: 'Transplante FUE', value: 22000 },
  { id: '7', name: 'Fernanda Souza', phone: '71933221100', email: 'fernanda@email.com', city: 'Salvador', state: 'BA', source: 'Google Ads', interest_level: 'warm', status: 'converted', procedure: 'Transplante FUE', value: 16500 },
  { id: '8', name: 'Ricardo Oliveira', phone: '81922110099', email: 'ricardo@email.com', city: 'Recife', state: 'PE', source: 'Indicação', interest_level: 'cold', status: 'lost', procedure: 'Tratamento', value: 0 },
];

const columns = [
  { id: 'new', title: 'Novos', color: 'from-slate-800/90 to-slate-900/90 border-purple-500/30' },
  { id: 'contacted', title: 'Contatados', color: 'from-slate-800/90 to-slate-900/90 border-violet-500/30' },
  { id: 'scheduled', title: 'Agendados', color: 'from-slate-800/90 to-slate-900/90 border-indigo-500/30' },
  { id: 'converted', title: 'Convertidos', color: 'from-slate-800/90 to-slate-900/90 border-green-500/30' },
  { id: 'lost', title: 'Perdidos', color: 'from-slate-800/90 to-slate-900/90 border-slate-500/30' },
];

const interestConfig = {
  hot: { icon: Flame, color: 'text-red-400', label: 'Quente' },
  warm: { icon: ThermometerSun, color: 'text-amber-400', label: 'Morno' },
  cold: { icon: Snowflake, color: 'text-blue-400', label: 'Frio' },
};

export default function AvivarPipeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getLeadsByStatus = (status: string) => {
    return mockLeads.filter(lead => {
      const matchesStatus = lead.status === status;
      const matchesSearch = searchTerm === '' || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  };

  const getColumnTotal = (status: string) => {
    return getLeadsByStatus(status).reduce((sum, lead) => sum + lead.value, 0);
  };

  const handleMoveToNext = (lead: typeof mockLeads[0]) => {
    const statusOrder = ['new', 'contacted', 'scheduled', 'converted'];
    const currentIndex = statusOrder.indexOf(lead.status);
    if (currentIndex < statusOrder.length - 1) {
      toast.success(`Lead movido para ${columns[currentIndex + 1].title}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Pipeline de Vendas
            <Sparkles className="h-5 w-5 text-purple-400" />
          </h1>
          <p className="text-slate-400">Gerencie seus leads no formato Kanban</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400/60" />
            <Input
              placeholder="Buscar leads..."
              className="pl-10 w-64 bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400/40 focus:border-purple-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {columns.map((column) => {
          const leads = getLeadsByStatus(column.id);
          const total = getColumnTotal(column.id);

          return (
            <Card key={column.id} className={cn(
              'min-h-[600px] border-t-2 bg-gradient-to-b',
              column.color
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">{column.title}</CardTitle>
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-500/40">{leads.length}</Badge>
                </div>
                <p className="text-xs text-slate-400">{formatCurrency(total)}</p>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 pr-2">
                    {leads.map((lead) => {
                      const Interest = interestConfig[lead.interest_level as keyof typeof interestConfig];
                      const InterestIcon = Interest.icon;

                      return (
                        <div
                          key={lead.id}
                          className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/50 shadow-sm cursor-pointer hover:shadow-lg hover:border-purple-500/40 transition-all group"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <InterestIcon className={`h-4 w-4 ${Interest.color}`} />
                              <span className="font-medium text-sm text-white">{lead.name}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-purple-500/20">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveToNext(lead); }} className="text-slate-200 focus:bg-purple-500/20 focus:text-white">
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Avançar Etapa
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-slate-200 focus:bg-purple-500/20 focus:text-white">
                                  <Phone className="h-4 w-4 mr-2" />
                                  Ligar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-slate-200 focus:bg-purple-500/20 focus:text-white">
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  WhatsApp
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{lead.procedure}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" />
                              {lead.city}/{lead.state}
                            </div>
                            <span className="text-xs font-medium text-slate-300">
                              {formatCurrency(lead.value)}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                            <Badge className="text-xs bg-purple-500/20 text-purple-200 border-purple-500/30">
                              {lead.source}
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-purple-500/20" onClick={(e) => e.stopPropagation()}>
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-purple-500/20" onClick={(e) => e.stopPropagation()}>
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {selectedLead && (
                <>
                  {React.createElement(interestConfig[selectedLead.interest_level as keyof typeof interestConfig].icon, {
                    className: `h-5 w-5 ${interestConfig[selectedLead.interest_level as keyof typeof interestConfig].color}`
                  })}
                  {selectedLead.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">Detalhes do lead</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Telefone</p>
                  <p className="font-medium text-white">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">E-mail</p>
                  <p className="font-medium text-white">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Cidade</p>
                  <p className="font-medium text-white">{selectedLead.city}/{selectedLead.state}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Fonte</p>
                  <p className="font-medium text-white">{selectedLead.source}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Procedimento</p>
                  <p className="font-medium text-white">{selectedLead.procedure}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Valor Estimado</p>
                  <p className="font-medium text-slate-300">{formatCurrency(selectedLead.value)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
