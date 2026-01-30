import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  MessageSquare,
  Mail,
  Eye,
  Trash2,
  Download,
  Upload,
  Filter,
  Flame,
  ThermometerSun,
  Snowflake,
} from 'lucide-react';

// Mock data
const mockLeads = [
  { id: '1', name: 'Maria Silva', phone: '11999887766', email: 'maria@email.com', city: 'São Paulo', state: 'SP', source: 'Instagram', interest_level: 'hot', status: 'new', createdAt: '2025-01-29' },
  { id: '2', name: 'João Santos', phone: '21988776655', email: 'joao@email.com', city: 'Rio de Janeiro', state: 'RJ', source: 'Google Ads', interest_level: 'warm', status: 'contacted', createdAt: '2025-01-28' },
  { id: '3', name: 'Ana Costa', phone: '31977665544', email: 'ana@email.com', city: 'Belo Horizonte', state: 'MG', source: 'Indicação', interest_level: 'hot', status: 'scheduled', createdAt: '2025-01-27' },
  { id: '4', name: 'Carlos Mendes', phone: '41966554433', email: 'carlos@email.com', city: 'Curitiba', state: 'PR', source: 'WhatsApp', interest_level: 'warm', status: 'new', createdAt: '2025-01-26' },
  { id: '5', name: 'Patricia Lima', phone: '51955443322', email: 'patricia@email.com', city: 'Porto Alegre', state: 'RS', source: 'Site', interest_level: 'cold', status: 'contacted', createdAt: '2025-01-25' },
  { id: '6', name: 'Roberto Alves', phone: '61944332211', email: 'roberto@email.com', city: 'Brasília', state: 'DF', source: 'Instagram', interest_level: 'hot', status: 'converted', createdAt: '2025-01-24' },
  { id: '7', name: 'Fernanda Souza', phone: '71933221100', email: 'fernanda@email.com', city: 'Salvador', state: 'BA', source: 'Google Ads', interest_level: 'warm', status: 'lost', createdAt: '2025-01-23' },
];

const statusConfig = {
  new: { label: 'Novo', variant: 'secondary' as const },
  contacted: { label: 'Contatado', variant: 'outline' as const },
  scheduled: { label: 'Agendado', variant: 'default' as const },
  converted: { label: 'Convertido', variant: 'default' as const },
  lost: { label: 'Perdido', variant: 'destructive' as const },
};

const interestConfig = {
  hot: { icon: Flame, color: 'text-red-500', label: 'Quente' },
  warm: { icon: ThermometerSun, color: 'text-amber-500', label: 'Morno' },
  cold: { icon: Snowflake, color: 'text-blue-500', label: 'Frio' },
};

export default function NeoCrmLeads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterInterest, setFilterInterest] = useState<string>('all');

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesInterest = filterInterest === 'all' || lead.interest_level === filterInterest;
    return matchesSearch && matchesStatus && matchesInterest;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Gerencie todos os seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = mockLeads.filter((l) => l.status === key).length;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(key)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="contacted">Contatados</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterInterest} onValueChange={setFilterInterest}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Interesse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="hot">Quente</SelectItem>
                <SelectItem value="warm">Morno</SelectItem>
                <SelectItem value="cold">Frio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const status = statusConfig[lead.status as keyof typeof statusConfig];
                const interest = interestConfig[lead.interest_level as keyof typeof interestConfig];
                const InterestIcon = interest.icon;

                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <InterestIcon className={`h-4 w-4 ${interest.color}`} />
                        <span className="font-medium">{lead.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{lead.phone}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{lead.city}/{lead.state}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={interest.color}>
                        <InterestIcon className="h-3 w-3 mr-1" />
                        {interest.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{lead.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
