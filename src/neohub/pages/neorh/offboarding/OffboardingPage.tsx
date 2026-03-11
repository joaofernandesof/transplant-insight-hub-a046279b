import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, Clock, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import CreateOffboardingDialog from './components/CreateOffboardingDialog';

interface OffboardingProcess {
  id: string;
  colaborador_nome: string;
  cargo: string | null;
  setor: string | null;
  tipo_desligamento: string;
  data_desligamento: string;
  responsavel_nome: string | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  aberto: { label: 'Aberto', variant: 'outline' },
  em_execucao: { label: 'Em Execução', variant: 'default' },
  aguardando_validacao: { label: 'Aguardando Validação', variant: 'secondary' },
  concluido: { label: 'Concluído', variant: 'default' },
};

const TIPO_LABELS: Record<string, string> = {
  demissao: 'Demissão',
  pedido_demissao: 'Pedido de Demissão',
  fim_contrato: 'Fim de Contrato',
  acordo_mutuo: 'Acordo Mútuo',
  justa_causa: 'Justa Causa',
};

export default function OffboardingPage() {
  const [processes, setProcesses] = useState<OffboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await supabase
      .from('rh_offboarding_processes')
      .select('*')
      .order('created_at', { ascending: false });
    setProcesses((data || []) as OffboardingProcess[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const abertos = processes.filter(p => p.status === 'aberto').length;
    const emExecucao = processes.filter(p => p.status === 'em_execucao').length;
    const aguardando = processes.filter(p => p.status === 'aguardando_validacao').length;
    const concluidos = processes.filter(p => p.status === 'concluido').length;
    return { abertos, emExecucao, aguardando, concluidos };
  }, [processes]);

  const filtered = useMemo(() => {
    return processes.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!p.colaborador_nome.toLowerCase().includes(s) && !(p.cargo || '').toLowerCase().includes(s) && !(p.setor || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [processes, filterStatus, search]);

  const dashCards = [
    { label: 'Abertos', value: stats.abertos, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Em Execução', value: stats.emExecucao, icon: Clock, color: 'text-blue-500' },
    { label: 'Aguardando Validação', value: stats.aguardando, icon: Users, color: 'text-purple-500' },
    { label: 'Concluídos', value: stats.concluidos, icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Offboarding de Colaboradores</h1>
          <p className="text-muted-foreground">Controle de processos de desligamento</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Offboarding
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashCards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar colaborador, cargo ou setor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_execucao">Em Execução</SelectItem>
            <SelectItem value="aguardando_validacao">Aguardando Validação</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Desligamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum processo de offboarding encontrado
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.aberto;
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/neoteam/rh/offboarding/${p.id}`)}>
                    <TableCell className="font-medium">{p.colaborador_nome}</TableCell>
                    <TableCell>{p.cargo || '—'}</TableCell>
                    <TableCell>{p.setor || '—'}</TableCell>
                    <TableCell>{TIPO_LABELS[p.tipo_desligamento] || p.tipo_desligamento}</TableCell>
                    <TableCell>{format(new Date(p.data_desligamento), 'dd/MM/yyyy')}</TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); navigate(`/neoteam/rh/offboarding/${p.id}`); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateOffboardingDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
    </div>
  );
}
