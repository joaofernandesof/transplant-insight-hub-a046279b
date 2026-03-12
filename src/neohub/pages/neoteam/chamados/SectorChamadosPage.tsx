import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Plus, Clock, CheckCircle, AlertCircle, Loader2, Settings,
} from 'lucide-react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useSectorTickets, SECTOR_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from '@/neohub/hooks/useSectorTickets';
import { NewSectorTicketDialog } from './NewSectorTicketDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  sectorCode: string;
  sectorSlug: string;
}

export default function SectorChamadosPage({ sectorCode, sectorSlug }: Props) {
  const navigate = useNavigate();
  const { tickets, ticketTypes, isLoading } = useSectorTickets(sectorCode);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filtered = tickets.filter(t => {
    const matchSearch = !search || 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      `#${String(t.ticket_number).padStart(5, '0')}`.includes(search);
    const matchType = filterType === 'all' || t.ticket_type_id === filterType;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchType && matchStatus && matchPriority;
  });

  const stats = {
    total: tickets.length,
    aberto: tickets.filter(t => t.status === 'aberto').length,
    em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
    resolvido: tickets.filter(t => t.status === 'resolvido').length,
  };

  const sectorLabel = SECTOR_LABELS[sectorCode] || sectorCode;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <NeoTeamBreadcrumb />
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chamados — {sectorLabel}</h1>
          <p className="text-muted-foreground">
            Gerencie fluxos e processos do setor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(`/neoteam/${sectorSlug}/chamados/config`)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button className="gap-2" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><AlertCircle className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.aberto}</p><p className="text-xs text-muted-foreground">Abertos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Loader2 className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.em_andamento}</p><p className="text-xs text-muted-foreground">Em Andamento</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{stats.resolvido}</p><p className="text-xs text-muted-foreground">Resolvidos</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por título, número ou solicitante..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                {ticketTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Solicitante</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {tickets.length === 0 ? 'Nenhum chamado criado ainda' : 'Nenhum chamado encontrado com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(ticket => {
                  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
                  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.aberto;
                  return (
                    <TableRow 
                      key={ticket.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/neoteam/${sectorSlug}/chamados/${ticket.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        #{String(ticket.ticket_number).padStart(5, '0')}
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ticket.ticket_type?.name || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {ticket.current_stage?.name || 'Aberto'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${priority.color}`}>{priority.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {ticket.requester_name}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {format(new Date(ticket.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewSectorTicketDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        sectorCode={sectorCode}
      />
    </div>
  );
}
