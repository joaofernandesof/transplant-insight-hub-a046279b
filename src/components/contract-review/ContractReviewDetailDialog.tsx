/**
 * Dialog de detalhes da solicitação de conferência contratual
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ContractReviewRequest, 
  CONTRACT_TYPES, 
  CONTRACT_CLASSIFICATIONS,
  CONTRACT_STATUS_CONFIG,
  useContractReviewHistory,
  useUpdateContractReview
} from "@/hooks/useContractReview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Paperclip,
  History,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

interface ContractReviewDetailDialogProps {
  request: ContractReviewRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractReviewDetailDialog({ 
  request, 
  open, 
  onOpenChange 
}: ContractReviewDetailDialogProps) {
  const { isAdmin } = useUnifiedAuth();
  const { data: history } = useContractReviewHistory(request.id);
  const updateRequest = useUpdateContractReview();
  
  const [parecer, setParecer] = useState(request.parecer_juridico || "");
  const [ajustes, setAjustes] = useState(request.ajustes_necessarios || "");

  const typeLabel = CONTRACT_TYPES.find(t => t.value === request.tipo_contrato)?.label || request.tipo_contrato;
  const classLabel = CONTRACT_CLASSIFICATIONS.find(c => c.value === request.classificacao)?.label;
  const statusConfig = CONTRACT_STATUS_CONFIG[request.status];

  const handleStatusChange = async (newStatus: 'aprovado' | 'reprovado' | 'aguardando_ajustes' | 'em_analise') => {
    if (newStatus !== 'em_analise' && !parecer.trim()) {
      toast.error('Parecer jurídico é obrigatório');
      return;
    }
    
    await updateRequest.mutateAsync({
      id: request.id,
      data: {
        status: newStatus,
        parecer_juridico: parecer,
        ajustes_necessarios: ajustes,
        completed_at: ['aprovado', 'reprovado'].includes(newStatus) ? new Date().toISOString() : undefined,
      }
    });
    
    onOpenChange(false);
  };

  const InfoItem = ({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) => (
    value ? (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {icon}
          {label}
        </p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {request.request_number}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {request.nome_outra_parte}
              </p>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="mt-4">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="anexos">
              Anexos ({request.attachments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            {isAdmin && <TabsTrigger value="analise">Análise Jurídica</TabsTrigger>}
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="detalhes" className="space-y-6 pr-4">
              {/* Bloco 1: Identificação */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4" />
                  Identificação do Contrato
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoItem label="Área/Empresa" value={request.area_empresa} />
                  <InfoItem label="Tipo de Contrato" value={typeLabel} />
                  <InfoItem label="Classificação" value={classLabel} />
                  <InfoItem 
                    label="Data de Assinatura" 
                    value={format(new Date(request.data_assinatura_prevista), 'dd/MM/yyyy')} 
                    icon={<Calendar className="h-3 w-3" />}
                  />
                  <InfoItem 
                    label="Início da Vigência" 
                    value={format(new Date(request.data_inicio_vigencia), 'dd/MM/yyyy')} 
                  />
                  <InfoItem label="Prazo Total" value={request.prazo_total_contrato} />
                </div>
              </div>

              <Separator />

              {/* Bloco 2: Objetivo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Objetivo do Contrato</h3>
                <div className="space-y-3">
                  <InfoItem label="Objetivo Prático" value={request.objetivo_pratico} />
                  <InfoItem label="Benefício Esperado" value={request.beneficio_esperado} />
                </div>
              </div>

              <Separator />

              {/* Bloco 3: Contexto da Negociação */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Contexto da Negociação</h3>
                <div className="space-y-3">
                  <InfoItem label="Como a negociação surgiu" value={request.origem_negociacao} />
                  <InfoItem 
                    label="Houve negociação?" 
                    value={request.houve_negociacao ? 'Sim' : 'Não'} 
                  />
                  {request.houve_negociacao && (
                    <>
                      <InfoItem label="Pedido inicial da outra parte" value={request.pedido_inicial} />
                      <InfoItem label="Ajustes realizados" value={request.ajustes_realizados} />
                    </>
                  )}
                  {request.acordos_informais && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">
                        ⚠️ Acordos Informais
                      </p>
                      <p className="text-sm">{request.acordos_informais}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Bloco 4: Condições Comerciais */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  Condições Comerciais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem 
                    label="Valor Total" 
                    value={request.valor_total ? `R$ ${request.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined} 
                  />
                  <InfoItem label="Forma de Pagamento" value={request.forma_pagamento} />
                  <InfoItem label="Datas de Pagamento" value={request.datas_pagamento} />
                  <InfoItem label="Multas Previstas" value={request.multas_previstas} />
                  <InfoItem label="Penalidades de Cancelamento" value={request.penalidades_cancelamento} />
                  <InfoItem label="Condições de Crédito" value={request.condicoes_credito} />
                </div>
                {request.existe_acordo_fora_contrato && request.descricao_acordo_fora_contrato && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md">
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">
                      ⚠️ Acordo fora do contrato
                    </p>
                    <p className="text-sm">{request.descricao_acordo_fora_contrato}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Bloco 5: Pontos Sensíveis */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Pontos Sensíveis
                </h3>
                <div className="flex flex-wrap gap-2">
                  {request.risco_clausula_especifica && <Badge variant="outline">Dúvida sobre cláusula</Badge>}
                  {request.risco_financeiro && <Badge variant="destructive">Risco Financeiro</Badge>}
                  {request.risco_operacional && <Badge variant="secondary">Risco Operacional</Badge>}
                  {request.risco_juridico && <Badge variant="destructive">Risco Jurídico</Badge>}
                  {request.risco_imagem && <Badge variant="outline">Risco de Imagem</Badge>}
                </div>
                <InfoItem label="Foco de Atenção do Jurídico" value={request.foco_atencao_juridico} />
              </div>

              <Separator />

              {/* Bloco 6: Urgência */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Urgência e Impacto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem 
                    label="Prazo Máximo para Retorno" 
                    value={format(new Date(request.prazo_maximo_retorno), 'dd/MM/yyyy')} 
                  />
                  <InfoItem 
                    label="SLA Calculado" 
                    value={request.sla_horas ? `${request.sla_horas}h` : undefined} 
                  />
                </div>
                <InfoItem label="Impacto do Atraso" value={request.impacto_atraso} />
                {request.possui_dependencia_externa && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                      📅 Dependência Externa
                    </p>
                    <p className="text-sm">{request.descricao_dependencia_externa}</p>
                  </div>
                )}
              </div>

              {/* Parecer (se houver) */}
              {request.parecer_juridico && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Parecer Jurídico</h3>
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{request.parecer_juridico}</p>
                    </div>
                    {request.ajustes_necessarios && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ajustes Necessários</p>
                        <p className="text-sm whitespace-pre-wrap">{request.ajustes_necessarios}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="anexos" className="space-y-4 pr-4">
              {request.attachments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum anexo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {request.attachments?.map((att) => (
                    <div 
                      key={att.id} 
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{att.nome_arquivo}</p>
                          <p className="text-xs text-muted-foreground">
                            {att.tipo} • {att.tamanho_bytes ? `${(att.tamanho_bytes / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={att.url_arquivo} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 pr-4">
              {!history?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum histórico</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">{item.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.creator?.full_name} • {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                        {item.comment && (
                          <p className="text-sm mt-1 text-muted-foreground">{item.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="analise" className="space-y-4 pr-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Parecer Jurídico *</label>
                    <Textarea
                      value={parecer}
                      onChange={(e) => setParecer(e.target.value)}
                      placeholder="Digite o parecer jurídico..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Ajustes Necessários</label>
                    <Textarea
                      value={ajustes}
                      onChange={(e) => setAjustes(e.target.value)}
                      placeholder="Liste os ajustes que precisam ser feitos..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    {request.status === 'aguardando_validacao' && (
                      <Button 
                        onClick={() => handleStatusChange('em_analise')}
                        disabled={updateRequest.isPending}
                      >
                        Iniciar Análise
                      </Button>
                    )}
                    
                    {['em_analise', 'aguardando_ajustes'].includes(request.status) && (
                      <>
                        <Button 
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange('aprovado')}
                          disabled={updateRequest.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusChange('aguardando_ajustes')}
                          disabled={updateRequest.isPending}
                        >
                          Solicitar Ajustes
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleStatusChange('reprovado')}
                          disabled={updateRequest.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reprovar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
