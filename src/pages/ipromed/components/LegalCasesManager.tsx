/**
 * CPG Advocacia - Gestão de Processos com tabela process_cases
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gavel, Search, Plus, Clock, Sparkles, Loader2, AlertCircle, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import ProcessCaseForm, { type ProcessCaseData } from "./ProcessCaseForm";

interface ProcessCase {
  id: string;
  numero_processo: string | null;
  natureza_acao: string | null;
  tipo_acao: string | null;
  cliente_representado: string | null;
  situacao_atual: string | null;
  probabilidade_exito: string | null;
  impacto_financeiro: string | null;
  valor_causa: number | null;
  valor_risco: number | null;
  proximo_prazo: string | null;
  advogado_responsavel: string | null;
  estado_uf: string | null;
  fase_processual: string | null;
  created_at: string;
  [key: string]: any;
}

const getSituacaoBadge = (situacao: string | null) => {
  const config: Record<string, { label: string; className: string }> = {
    'Em andamento': { label: 'Em andamento', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'Aguardando citação': { label: 'Aguardando citação', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'Aguardando decisão': { label: 'Aguardando decisão', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    'Aguardando prazo': { label: 'Aguardando prazo', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    'Em recurso': { label: 'Em recurso', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'Suspenso': { label: 'Suspenso', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
    'Arquivado': { label: 'Arquivado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    'Encerrado': { label: 'Encerrado', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };
  if (!situacao) return <span className="text-muted-foreground">-</span>;
  const c = config[situacao] || { label: situacao, className: 'bg-gray-100 text-gray-700' };
  return <Badge className={c.className}>{c.label}</Badge>;
};

const getImpactoBadge = (impacto: string | null) => {
  if (!impacto) return <span className="text-muted-foreground">-</span>;
  const config: Record<string, string> = {
    'Baixo': 'bg-emerald-100 text-emerald-700',
    'Médio': 'bg-amber-100 text-amber-700',
    'Alto': 'bg-orange-100 text-orange-700',
    'Crítico': 'bg-rose-100 text-rose-700',
  };
  return <Badge className={config[impacto] || 'bg-gray-100 text-gray-700'}>{impacto}</Badge>;
};

export default function LegalCasesManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [editCase, setEditCase] = useState<ProcessCase | null>(null);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ['process-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProcessCase[];
    },
  });

  const createCase = useMutation({
    mutationFn: async (formData: ProcessCaseData) => {
      const payload = {
        numero_processo: formData.numero_processo || null,
        natureza_acao: formData.natureza_acao || null,
        tipo_acao: formData.tipo_acao || null,
        polo_processo: formData.polo_processo || null,
        cliente_representado: formData.cliente_representado || null,
        cpf_cnpj_cliente: formData.cpf_cnpj_cliente || null,
        parte_contraria: formData.parte_contraria || null,
        cpf_cnpj_parte_contraria: formData.cpf_cnpj_parte_contraria || null,
        advogado_responsavel: formData.advogado_responsavel || null,
        escritorio_responsavel: formData.escritorio_responsavel || null,
        area_juridica: formData.area_juridica || null,
        orgao_vara: formData.orgao_vara || null,
        tribunal: formData.tribunal || null,
        estado_uf: formData.estado_uf || null,
        cidade: formData.cidade || null,
        sistema_plataforma: formData.sistema_plataforma || null,
        fase_processual: formData.fase_processual || null,
        situacao_atual: formData.situacao_atual || null,
        data_distribuicao: formData.data_distribuicao ? format(formData.data_distribuicao, 'yyyy-MM-dd') : null,
        data_citacao: formData.data_citacao ? format(formData.data_citacao, 'yyyy-MM-dd') : null,
        data_ultima_movimentacao: formData.data_ultima_movimentacao ? format(formData.data_ultima_movimentacao, 'yyyy-MM-dd') : null,
        proximo_prazo: formData.proximo_prazo ? format(formData.proximo_prazo, 'yyyy-MM-dd') : null,
        tipo_prazo: formData.tipo_prazo || null,
        responsavel_prazo: formData.responsavel_prazo || null,
        valor_causa: formData.valor_causa ? parseFloat(formData.valor_causa) : null,
        valor_risco: formData.valor_risco ? parseFloat(formData.valor_risco) : null,
        probabilidade_exito: formData.probabilidade_exito || null,
        impacto_financeiro: formData.impacto_financeiro || null,
        status_financeiro: formData.status_financeiro || null,
        tipo_honorario: formData.tipo_honorario || null,
        valor_honorarios: formData.valor_honorarios ? parseFloat(formData.valor_honorarios) : null,
        objeto_processo: formData.objeto_processo || null,
        resumo_caso: formData.resumo_caso || null,
        estrategia_juridica: formData.estrategia_juridica || null,
        observacoes_gerais: formData.observacoes_gerais || null,
        possui_audiencia: formData.possui_audiencia || 'Não',
        data_audiencia: formData.data_audiencia ? format(formData.data_audiencia, 'yyyy-MM-dd') : null,
        tipo_audiencia: formData.tipo_audiencia || null,
        possui_acordo: formData.possui_acordo || 'Não',
        valor_acordo: formData.valor_acordo ? parseFloat(formData.valor_acordo) : null,
        documentos_anexados: formData.documentos_anexados || 'Não',
        link_documentos: formData.link_documentos || null,
        data_encerramento: formData.data_encerramento ? format(formData.data_encerramento, 'yyyy-MM-dd') : null,
        motivo_encerramento: formData.motivo_encerramento || null,
      };

      if (formData.id) {
        const { error } = await supabase.from('process_cases').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('process_cases').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-cases'] });
      toast.success(editCase ? 'Processo atualizado!' : 'Processo cadastrado!');
      setIsNewCaseOpen(false);
      setEditCase(null);
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const filteredCases = cases.filter((c) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (c.numero_processo?.toLowerCase().includes(search) ?? false) ||
      (c.cliente_representado?.toLowerCase().includes(search) ?? false) ||
      (c.natureza_acao?.toLowerCase().includes(search) ?? false);
    const matchesStatus = statusFilter === 'all' || c.situacao_atual === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (caseItem: ProcessCase) => {
    setEditCase(caseItem);
    setIsNewCaseOpen(true);
  };

  const getEditInitialData = (): Partial<ProcessCaseData> | undefined => {
    if (!editCase) return undefined;
    return {
      ...editCase,
      id: editCase.id,
      numero_processo: editCase.numero_processo || '',
      natureza_acao: editCase.natureza_acao || '',
      cliente_representado: editCase.cliente_representado || '',
      situacao_atual: editCase.situacao_atual || '',
      valor_causa: editCase.valor_causa?.toString() || '',
      valor_risco: editCase.valor_risco?.toString() || '',
      valor_honorarios: editCase.valor_honorarios?.toString() || '',
      valor_acordo: editCase.valor_acordo?.toString() || '',
      data_distribuicao: editCase.data_distribuicao ? new Date(editCase.data_distribuicao) : null,
      data_citacao: editCase.data_citacao ? new Date(editCase.data_citacao) : null,
      data_ultima_movimentacao: editCase.data_ultima_movimentacao ? new Date(editCase.data_ultima_movimentacao) : null,
      proximo_prazo: editCase.proximo_prazo ? new Date(editCase.proximo_prazo) : null,
      data_audiencia: editCase.data_audiencia ? new Date(editCase.data_audiencia) : null,
      data_encerramento: editCase.data_encerramento ? new Date(editCase.data_encerramento) : null,
    } as any;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-rose-600 gap-2">
        <AlertCircle className="h-5 w-5" />
        Erro ao carregar processos: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-600" />
            Gestão de Processos
          </h2>
          <p className="text-muted-foreground">Contencioso e andamentos processuais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info('IA Jurídica em breve')}>
            <Sparkles className="h-4 w-4" />
            Gerar Peça com IA
          </Button>
          <Dialog open={isNewCaseOpen} onOpenChange={(open) => { setIsNewCaseOpen(open); if (!open) setEditCase(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  {editCase ? 'Editar Processo' : 'Novo Processo'}
                </DialogTitle>
              </DialogHeader>
              <ProcessCaseForm
                initialData={getEditInitialData()}
                onSubmit={(data) => createCase.mutate(data)}
                onCancel={() => { setIsNewCaseOpen(false); setEditCase(null); }}
                isPending={createCase.isPending}
                isEdit={!!editCase}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Aguardando citação">Aguardando citação</SelectItem>
                <SelectItem value="Aguardando decisão">Aguardando decisão</SelectItem>
                <SelectItem value="Aguardando prazo">Aguardando prazo</SelectItem>
                <SelectItem value="Em recurso">Em recurso</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
                <SelectItem value="Encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Gavel className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum processo encontrado</p>
              <p className="text-sm">Clique em "Novo Processo" para cadastrar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Natureza</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Impacto</TableHead>
                  <TableHead>Valor Causa</TableHead>
                  <TableHead>Próx. Prazo</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(c)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.numero_processo || 'Sem número'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {c.tipo_acao || c.natureza_acao || ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.cliente_representado || '-'}</TableCell>
                    <TableCell>
                      {c.natureza_acao ? <Badge variant="outline" className="whitespace-nowrap">{c.natureza_acao}</Badge> : '-'}
                    </TableCell>
                    <TableCell>{getSituacaoBadge(c.situacao_atual)}</TableCell>
                    <TableCell>{getImpactoBadge(c.impacto_financeiro)}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {c.valor_causa ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor_causa) : '-'}
                    </TableCell>
                    <TableCell>
                      {c.proximo_prazo ? (
                        <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <Clock className="h-3 w-3 text-amber-600" />
                          {format(new Date(c.proximo_prazo), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
