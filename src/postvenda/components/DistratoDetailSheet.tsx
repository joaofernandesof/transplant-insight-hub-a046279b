import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  FileText,
  History,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DistratoSolicitacao,
  DISTRATO_ETAPA_LABELS,
  DISTRATO_STATUS_LABELS,
  SCRIPTS_PADRAO,
  useDistratoRequests,
  useDistratoSubtarefas,
  useDistratoHistorico,
} from '../hooks/useDistrato';
import { useToast } from '@/hooks/use-toast';

interface DistratoDetailSheetProps {
  solicitacao: DistratoSolicitacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DistratoDetailSheet({ solicitacao, open, onOpenChange }: DistratoDetailSheetProps) {
  const { atualizarSolicitacao, definirParecerGerente } = useDistratoRequests();
  const { subtarefas, concluirSubtarefa } = useDistratoSubtarefas(solicitacao?.id);
  const { historico } = useDistratoHistorico(solicitacao?.id);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);

  if (!solicitacao) return null;

  const prazoEstourado = solicitacao.prazo_atual && isPast(new Date(solicitacao.prazo_atual));

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: 'Copiado!', description: 'Script copiado para a área de transferência' });
  };

  const handleSaveChecklist = async (updates: Partial<DistratoSolicitacao>) => {
    setIsSaving(true);
    try {
      await atualizarSolicitacao(solicitacao.id, {
        ...updates,
        checklist_preenchido: true,
      });
      toast({ title: 'Sucesso', description: 'Checklist salvo' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmarTitular = async (eTitular: boolean) => {
    await atualizarSolicitacao(solicitacao.id, { remetente_e_titular: eTitular });
    toast({ 
      title: eTitular ? 'Titular confirmado' : 'Não é o titular',
      description: eTitular 
        ? 'Use o script padrão para responder'
        : 'Solicite procuração ao remetente'
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitação #{solicitacao.numero_solicitacao}
            {prazoEstourado && (
              <Badge variant="destructive" className="ml-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                SLA Estourado
              </Badge>
            )}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge>{DISTRATO_ETAPA_LABELS[solicitacao.etapa_atual]}</Badge>
            <Badge variant="outline">{DISTRATO_STATUS_LABELS[solicitacao.status_final]}</Badge>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="info" className="gap-1">
              <User className="h-3 w-3" />
              Info
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1">
              <History className="h-3 w-3" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Tab: Informações */}
            <TabsContent value="info" className="m-0 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Dados do Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{solicitacao.paciente_nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail:</span>
                    <span>{solicitacao.paciente_email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{solicitacao.paciente_telefone || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Verificação de Titular */}
              {solicitacao.etapa_atual === 'solicitacao_recebida' && (
                <Card className="border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      Verificação de Remetente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">E-mail remetente:</span>
                      <span className="ml-2 font-mono">{solicitacao.email_remetente || solicitacao.paciente_email}</span>
                    </div>
                    
                    {solicitacao.remetente_e_titular === undefined ? (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmarTitular(true)}
                          className="flex-1"
                        >
                          É o titular
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleConfirmarTitular(false)}
                          className="flex-1"
                        >
                          Não é o titular
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant={solicitacao.remetente_e_titular ? 'default' : 'destructive'}>
                          {solicitacao.remetente_e_titular ? '✓ É o titular' : '✗ Não é o titular'}
                        </Badge>

                        <div className="bg-muted p-3 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Script de Resposta:</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => copyScript(
                                solicitacao.remetente_e_titular 
                                  ? SCRIPTS_PADRAO.resposta_titular 
                                  : SCRIPTS_PADRAO.resposta_nao_titular
                              )}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                            {solicitacao.remetente_e_titular 
                              ? SCRIPTS_PADRAO.resposta_titular 
                              : SCRIPTS_PADRAO.resposta_nao_titular}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Parecer da Gerente */}
              {solicitacao.etapa_atual === 'aguardando_parecer_gerente' && (
                <Card className="border-purple-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      Parecer da Gerente (Jéssica)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Aguardando definição da gerente sobre o caso.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => definirParecerGerente(solicitacao.id, 'devolver')}
                      >
                        Devolver
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        onClick={() => definirParecerGerente(solicitacao.id, 'em_negociacao')}
                      >
                        Negociar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => definirParecerGerente(solicitacao.id, 'nao_devolver')}
                      >
                        Não Devolver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prazos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Prazos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{format(new Date(solicitacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prazo atual:</span>
                    <span className={prazoEstourado ? 'text-destructive font-medium' : ''}>
                      {solicitacao.prazo_atual 
                        ? formatDistanceToNow(new Date(solicitacao.prazo_atual), { addSuffix: true, locale: ptBR })
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Responsável:</span>
                    <span>{solicitacao.responsavel_nome || 'Júlia'}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Checklist */}
            <TabsContent value="checklist" className="m-0">
              <DistratoChecklist 
                solicitacao={solicitacao} 
                onSave={handleSaveChecklist}
                isSaving={isSaving}
              />
            </TabsContent>

            {/* Tab: Tarefas */}
            <TabsContent value="tarefas" className="m-0 space-y-3">
              {subtarefas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma subtarefa pendente
                </div>
              ) : (
                subtarefas.map((subtarefa) => {
                  const atrasada = subtarefa.status === 'atrasada' || 
                    (subtarefa.prazo && isPast(new Date(subtarefa.prazo)) && subtarefa.status !== 'concluida');
                  
                  return (
                    <Card 
                      key={subtarefa.id}
                      className={`${subtarefa.status === 'concluida' ? 'opacity-60' : ''} ${atrasada ? 'border-destructive' : ''}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {subtarefa.status === 'concluida' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : atrasada ? (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-sm">{subtarefa.titulo}</span>
                            </div>
                            {subtarefa.descricao && (
                              <p className="text-xs text-muted-foreground mt-1 ml-6">
                                {subtarefa.descricao}
                              </p>
                            )}
                            {subtarefa.prazo && (
                              <p className={`text-xs mt-1 ml-6 ${atrasada ? 'text-destructive' : 'text-muted-foreground'}`}>
                                Prazo: {format(new Date(subtarefa.prazo), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          {subtarefa.status !== 'concluida' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => concluirSubtarefa(subtarefa.id)}
                            >
                              Concluir
                            </Button>
                          )}
                        </div>

                        {subtarefa.script_padrao && (
                          <div className="mt-2 ml-6 bg-muted p-2 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Script:</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-1"
                                onClick={() => copyScript(subtarefa.script_padrao!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="whitespace-pre-wrap text-muted-foreground">
                              {subtarefa.script_padrao}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="m-0">
              <div className="space-y-3">
                {historico.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      {index < historico.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.acao}</span>
                        <Badge variant="outline" className="text-xs">
                          {DISTRATO_ETAPA_LABELS[item.etapa]}
                        </Badge>
                      </div>
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{item.usuario_nome || 'Sistema'}</span>
                        <span>•</span>
                        <span>{format(new Date(item.data_evento), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// Componente de Checklist separado
function DistratoChecklist({ 
  solicitacao, 
  onSave,
  isSaving 
}: { 
  solicitacao: DistratoSolicitacao; 
  onSave: (updates: Partial<DistratoSolicitacao>) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    checklist_nome_completo: solicitacao.checklist_nome_completo || solicitacao.paciente_nome,
    checklist_email: solicitacao.checklist_email || solicitacao.paciente_email || '',
    checklist_assinou_termo_sinal: solicitacao.checklist_assinou_termo_sinal || false,
    checklist_assinou_contrato: solicitacao.checklist_assinou_contrato || false,
    checklist_procedimento_contratado: solicitacao.checklist_procedimento_contratado || '',
    checklist_valor_total_contrato: solicitacao.checklist_valor_total_contrato || 0,
    checklist_valor_pago: solicitacao.checklist_valor_pago || 0,
    checklist_data_contratacao: solicitacao.checklist_data_contratacao || '',
    checklist_status_procedimento: solicitacao.checklist_status_procedimento || '',
    checklist_observacoes: solicitacao.checklist_observacoes || '',
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Checklist Obrigatório
          {solicitacao.checklist_preenchido && (
            <Badge variant="default" className="ml-2">Preenchido</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Nome completo do paciente</Label>
            <Input
              value={formData.checklist_nome_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_nome_completo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail do paciente</Label>
            <Input
              type="email"
              value={formData.checklist_email}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Data da contratação</Label>
            <Input
              type="date"
              value={formData.checklist_data_contratacao}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_data_contratacao: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="termo_sinal"
              checked={formData.checklist_assinou_termo_sinal}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, checklist_assinou_termo_sinal: !!checked }))
              }
            />
            <Label htmlFor="termo_sinal" className="text-sm">Assinou termo de sinal?</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="contrato"
              checked={formData.checklist_assinou_contrato}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, checklist_assinou_contrato: !!checked }))
              }
            />
            <Label htmlFor="contrato" className="text-sm">Assinou contrato?</Label>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Procedimento contratado</Label>
            <Input
              value={formData.checklist_procedimento_contratado}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_procedimento_contratado: e.target.value }))}
              placeholder="Ex: Transplante Capilar FUE"
            />
          </div>

          <div className="space-y-2">
            <Label>Valor total do contrato (R$)</Label>
            <Input
              type="number"
              value={formData.checklist_valor_total_contrato}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_valor_total_contrato: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Valor pago até o momento (R$)</Label>
            <Input
              type="number"
              value={formData.checklist_valor_pago}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_valor_pago: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Status atual do procedimento</Label>
            <Input
              value={formData.checklist_status_procedimento}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_status_procedimento: e.target.value }))}
              placeholder="Ex: Aguardando agendamento, Realizado, Cancelado..."
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Observações relevantes</Label>
            <Textarea
              value={formData.checklist_observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, checklist_observacoes: e.target.value }))}
              placeholder="Informações adicionais importantes para o caso..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Checklist'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
