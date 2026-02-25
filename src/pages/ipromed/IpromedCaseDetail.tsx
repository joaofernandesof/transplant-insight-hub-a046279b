/**
 * CPG Advocacia - Página de Detalhes do Processo
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Gavel,
  User,
  Clock,
  DollarSign,
  MapPin,
  FileText,
  AlertTriangle,
  Loader2,
  Edit,
  Scale,
  Calendar,
  Building2,
  Target,
  Shield,
  Briefcase,
  TrendingUp,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProcessCaseForm, { type ProcessCaseData } from "./components/ProcessCaseForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  if (!situacao) return null;
  const c = config[situacao] || { label: situacao, className: 'bg-gray-100 text-gray-700' };
  return <Badge className={c.className}>{c.label}</Badge>;
};

const getImpactoBadge = (impacto: string | null) => {
  if (!impacto) return null;
  const config: Record<string, string> = {
    'Baixo': 'bg-emerald-100 text-emerald-700',
    'Médio': 'bg-amber-100 text-amber-700',
    'Alto': 'bg-orange-100 text-orange-700',
    'Crítico': 'bg-rose-100 text-rose-700',
  };
  return <Badge className={config[impacto] || 'bg-gray-100 text-gray-700'}>{impacto}</Badge>;
};

const getProbabilidadeBadge = (prob: string | null) => {
  if (!prob) return null;
  const config: Record<string, string> = {
    'Alta': 'bg-emerald-100 text-emerald-700',
    'Média': 'bg-amber-100 text-amber-700',
    'Baixa': 'bg-rose-100 text-rose-700',
    'Incerta': 'bg-slate-100 text-slate-700',
  };
  return <Badge className={config[prob] || 'bg-gray-100 text-gray-700'}>{prob}</Badge>;
};

const formatCurrency = (value: number | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
};

function InfoItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="font-medium text-sm mt-0.5">{value || '-'}</p>
    </div>
  );
}

export default function IpromedCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: processCase, isLoading } = useQuery({
    queryKey: ['process-case', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_cases')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateCase = useMutation({
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
      const { error } = await supabase.from('process_cases').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-case', id] });
      queryClient.invalidateQueries({ queryKey: ['process-cases'] });
      toast.success('Processo atualizado!');
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!processCase) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processo não encontrado</h2>
            <p className="text-muted-foreground mb-4">O processo solicitado não existe ou foi removido.</p>
            <Button onClick={() => navigate('/cpg/cases')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const c = processCase;

  const getEditInitialData = (): Partial<ProcessCaseData> => ({
    ...c,
    id: c.id,
    numero_processo: c.numero_processo || '',
    natureza_acao: c.natureza_acao || '',
    cliente_representado: c.cliente_representado || '',
    situacao_atual: c.situacao_atual || '',
    valor_causa: c.valor_causa?.toString() || '',
    valor_risco: c.valor_risco?.toString() || '',
    valor_honorarios: c.valor_honorarios?.toString() || '',
    valor_acordo: c.valor_acordo?.toString() || '',
    data_distribuicao: c.data_distribuicao ? new Date(c.data_distribuicao) : null,
    data_citacao: c.data_citacao ? new Date(c.data_citacao) : null,
    data_ultima_movimentacao: c.data_ultima_movimentacao ? new Date(c.data_ultima_movimentacao) : null,
    proximo_prazo: c.proximo_prazo ? new Date(c.proximo_prazo) : null,
    data_audiencia: c.data_audiencia ? new Date(c.data_audiencia) : null,
    data_encerramento: c.data_encerramento ? new Date(c.data_encerramento) : null,
  } as any);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cpg/cases')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Processos
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium truncate max-w-[300px]">
          {c.numero_processo || 'Sem número'}
        </span>
      </div>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-600/5 to-blue-800/10 border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <Gavel className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{c.numero_processo || 'Sem número'}</h1>
                  {getSituacaoBadge(c.situacao_atual)}
                  {getImpactoBadge(c.impacto_financeiro)}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {c.natureza_acao && (
                    <span className="flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      {c.natureza_acao}
                    </span>
                  )}
                  {c.tipo_acao && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {c.tipo_acao}
                    </span>
                  )}
                  {c.fase_processual && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {c.fase_processual}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.probabilidade_exito && getProbabilidadeBadge(c.probabilidade_exito)}
                  {c.polo_processo && (
                    <Badge variant="outline">
                      {c.polo_processo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Processo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <User className="h-4 w-4" />
                  Partes do Processo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Cliente Representado" value={c.cliente_representado} icon={User} />
                  <InfoItem label="CPF/CNPJ Cliente" value={c.cpf_cnpj_cliente} />
                  <InfoItem label="Parte Contrária" value={c.parte_contraria} icon={Shield} />
                  <InfoItem label="CPF/CNPJ Parte Contrária" value={c.cpf_cnpj_parte_contraria} />
                  <InfoItem label="Polo no Processo" value={c.polo_processo} />
                </div>
              </CardContent>
            </Card>

            {/* Responsáveis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <Briefcase className="h-4 w-4" />
                  Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Advogado Responsável" value={c.advogado_responsavel} icon={User} />
                  <InfoItem label="Escritório" value={c.escritorio_responsavel} icon={Building2} />
                  <InfoItem label="Área Jurídica" value={c.area_juridica} />
                  <InfoItem label="Responsável Prazo" value={c.responsavel_prazo} />
                </div>
              </CardContent>
            </Card>

            {/* Localização / Tribunal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <Building2 className="h-4 w-4" />
                  Tribunal e Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Órgão/Vara" value={c.orgao_vara} icon={Gavel} />
                  <InfoItem label="Tribunal" value={c.tribunal} />
                  <InfoItem label="Cidade" value={c.cidade} icon={MapPin} />
                  <InfoItem label="Estado/UF" value={c.estado_uf} />
                  <InfoItem label="Sistema/Plataforma" value={c.sistema_plataforma} />
                </div>
              </CardContent>
            </Card>

            {/* Prazos e Datas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <Calendar className="h-4 w-4" />
                  Prazos e Datas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Data Distribuição" value={formatDate(c.data_distribuicao)} icon={Calendar} />
                  <InfoItem label="Data Citação" value={formatDate(c.data_citacao)} />
                  <InfoItem label="Última Movimentação" value={formatDate(c.data_ultima_movimentacao)} />
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Próximo Prazo
                    </p>
                    <p className={`font-medium text-sm mt-0.5 ${c.proximo_prazo ? 'text-amber-600 font-semibold' : ''}`}>
                      {formatDate(c.proximo_prazo)}
                    </p>
                  </div>
                  <InfoItem label="Tipo de Prazo" value={c.tipo_prazo} />
                </div>

                {c.possui_audiencia === 'Sim' && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Data Audiência" value={formatDate(c.data_audiencia)} icon={Calendar} />
                      <InfoItem label="Tipo Audiência" value={c.tipo_audiencia} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Valores */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <DollarSign className="h-4 w-4" />
                  Valores do Processo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor da Causa</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(c.valor_causa)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor de Risco</p>
                    <p className="text-lg font-bold text-rose-600">{formatCurrency(c.valor_risco)}</p>
                  </div>
                  <InfoItem label="Probabilidade de Êxito" value={getProbabilidadeBadge(c.probabilidade_exito)} />
                  <InfoItem label="Impacto Financeiro" value={getImpactoBadge(c.impacto_financeiro)} />
                </div>
              </CardContent>
            </Card>

            {/* Honorários */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <DollarSign className="h-4 w-4" />
                  Honorários e Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Tipo de Honorário" value={c.tipo_honorario} />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Honorários</p>
                    <p className="text-lg font-bold">{formatCurrency(c.valor_honorarios)}</p>
                  </div>
                  <InfoItem label="Status Financeiro" value={c.status_financeiro} />
                </div>
              </CardContent>
            </Card>

            {/* Acordo */}
            {c.possui_acordo === 'Sim' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                    <CheckCircle className="h-4 w-4" />
                    Acordo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor do Acordo</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(c.valor_acordo)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Objeto e Resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                  <FileText className="h-4 w-4" />
                  Objeto e Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {c.objeto_processo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Objeto do Processo</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{c.objeto_processo}</p>
                  </div>
                )}
                {c.resumo_caso && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Resumo do Caso</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{c.resumo_caso}</p>
                  </div>
                )}
                {c.estrategia_juridica && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estratégia Jurídica</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{c.estrategia_juridica}</p>
                  </div>
                )}
                {c.observacoes_gerais && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações Gerais</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{c.observacoes_gerais}</p>
                  </div>
                )}
                {!c.objeto_processo && !c.resumo_caso && !c.estrategia_juridica && !c.observacoes_gerais && (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum detalhe registrado</p>
                )}
              </CardContent>
            </Card>

            {/* Documentos e Encerramento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                    <FileText className="h-4 w-4" />
                    Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <InfoItem label="Documentos Anexados" value={c.documentos_anexados} />
                    {c.link_documentos && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Link dos Documentos</p>
                        <a
                          href={c.link_documentos}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Acessar documentos
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {(c.data_encerramento || c.motivo_encerramento) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                      <Target className="h-4 w-4" />
                      Encerramento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Data Encerramento" value={formatDate(c.data_encerramento)} icon={Calendar} />
                      <InfoItem label="Motivo" value={c.motivo_encerramento} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Editar Processo
            </DialogTitle>
          </DialogHeader>
          <ProcessCaseForm
            initialData={getEditInitialData()}
            onSubmit={(data) => updateCase.mutate(data)}
            onCancel={() => setIsEditOpen(false)}
            isPending={updateCase.isPending}
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
