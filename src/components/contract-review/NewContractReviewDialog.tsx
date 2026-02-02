/**
 * Dialog de nova solicitação de conferência contratual
 * Formulário com 7 blocos obrigatórios
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useCreateContractReview, 
  useSubmitContractReview,
  useUploadContractReviewAttachment,
  CONTRACT_TYPES, 
  CONTRACT_CLASSIFICATIONS,
  AREAS_EMPRESA 
} from "@/hooks/useContractReview";
import { Loader2, ChevronLeft, ChevronRight, Send, Save } from "lucide-react";

// Bloco components
import { Bloco1Identificacao } from "./form-blocks/Bloco1Identificacao";
import { Bloco2Objetivo } from "./form-blocks/Bloco2Objetivo";
import { Bloco3Negociacao } from "./form-blocks/Bloco3Negociacao";
import { Bloco4Comercial } from "./form-blocks/Bloco4Comercial";
import { Bloco5Riscos } from "./form-blocks/Bloco5Riscos";
import { Bloco6Urgencia } from "./form-blocks/Bloco6Urgencia";
import { Bloco7Anexos } from "./form-blocks/Bloco7Anexos";

// Schema de validação
const contractReviewSchema = z.object({
  // Bloco 1
  area_empresa: z.string().min(1, "Selecione a área/empresa"),
  tipo_contrato: z.enum(['locacao', 'prestacao_servicos', 'parceria', 'cessao_espaco', 'outro']),
  tipo_contrato_outro: z.string().optional(),
  nome_outra_parte: z.string().min(1, "Nome da outra parte é obrigatório"),
  data_assinatura_prevista: z.string().min(1, "Data de assinatura é obrigatória"),
  data_inicio_vigencia: z.string().min(1, "Data de início é obrigatória"),
  prazo_total_contrato: z.string().min(1, "Prazo do contrato é obrigatório"),
  
  // Bloco 2
  objetivo_pratico: z.string().min(10, "Descreva o objetivo do contrato"),
  beneficio_esperado: z.string().min(10, "Descreva o benefício esperado"),
  classificacao: z.enum(['estrategico', 'operacional']),
  
  // Bloco 3
  origem_negociacao: z.string().min(5, "Descreva como a negociação surgiu"),
  houve_negociacao: z.boolean(),
  pedido_inicial: z.string().optional(),
  ajustes_realizados: z.string().optional(),
  acordos_informais: z.string().optional(),
  
  // Bloco 4
  valor_total: z.number().optional(),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  datas_pagamento: z.string().optional(),
  multas_previstas: z.string().optional(),
  penalidades_cancelamento: z.string().optional(),
  condicoes_credito: z.string().optional(),
  existe_acordo_fora_contrato: z.boolean(),
  descricao_acordo_fora_contrato: z.string().optional(),
  
  // Bloco 5
  risco_clausula_especifica: z.boolean(),
  risco_financeiro: z.boolean(),
  risco_operacional: z.boolean(),
  risco_juridico: z.boolean(),
  risco_imagem: z.boolean(),
  foco_atencao_juridico: z.string().min(10, "Descreva o foco de atenção"),
  
  // Bloco 6
  prazo_maximo_retorno: z.string().min(1, "Prazo máximo é obrigatório"),
  impacto_atraso: z.string().min(10, "Descreva o impacto do atraso"),
  possui_dependencia_externa: z.boolean(),
  descricao_dependencia_externa: z.string().optional(),
});

type ContractReviewFormData = z.infer<typeof contractReviewSchema>;

interface NewContractReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { id: 1, title: "Identificação", description: "Dados básicos do contrato" },
  { id: 2, title: "Objetivo", description: "Contexto de negócio" },
  { id: 3, title: "Negociação", description: "Histórico da negociação" },
  { id: 4, title: "Comercial", description: "Condições comerciais" },
  { id: 5, title: "Riscos", description: "Pontos sensíveis" },
  { id: 6, title: "Urgência", description: "Prazos e impactos" },
  { id: 7, title: "Anexos", description: "Documentos obrigatórios" },
];

export function NewContractReviewDialog({ open, onOpenChange }: NewContractReviewDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<{ file: File; tipo: string }[]>([]);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  
  const createRequest = useCreateContractReview();
  const submitRequest = useSubmitContractReview();
  const uploadAttachment = useUploadContractReviewAttachment();

  const form = useForm<ContractReviewFormData>({
    resolver: zodResolver(contractReviewSchema),
    defaultValues: {
      tipo_contrato: 'prestacao_servicos',
      classificacao: 'operacional',
      houve_negociacao: false,
      existe_acordo_fora_contrato: false,
      risco_clausula_especifica: false,
      risco_financeiro: false,
      risco_operacional: false,
      risco_juridico: false,
      risco_imagem: false,
      possui_dependencia_externa: false,
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const validateCurrentStep = async () => {
    const fieldsToValidate: Record<number, (keyof ContractReviewFormData)[]> = {
      1: ['area_empresa', 'tipo_contrato', 'nome_outra_parte', 'data_assinatura_prevista', 'data_inicio_vigencia', 'prazo_total_contrato'],
      2: ['objetivo_pratico', 'beneficio_esperado', 'classificacao'],
      3: ['origem_negociacao', 'houve_negociacao'],
      4: ['forma_pagamento', 'existe_acordo_fora_contrato'],
      5: ['foco_atencao_juridico'],
      6: ['prazo_maximo_retorno', 'impacto_atraso', 'possui_dependencia_externa'],
      7: [],
    };

    const result = await form.trigger(fieldsToValidate[currentStep]);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    const data = form.getValues();
    const result = await createRequest.mutateAsync(data as any);
    setCreatedRequestId(result.id);
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = async () => {
    // Valida se tem PDF do contrato
    const hasPdf = files.some(f => f.tipo === 'contrato_pdf');
    if (!hasPdf) {
      form.setError('root', { message: 'O PDF do contrato é obrigatório' });
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    
    // Cria a solicitação
    const result = await createRequest.mutateAsync(data as any);
    
    // Faz upload dos anexos
    for (const { file, tipo } of files) {
      await uploadAttachment.mutateAsync({
        requestId: result.id,
        file,
        tipo,
      });
    }
    
    // Envia para análise
    await submitRequest.mutateAsync(result.id);
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    form.reset();
    setCurrentStep(1);
    setFiles([]);
    setCreatedRequestId(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Bloco1Identificacao form={form} areas={AREAS_EMPRESA} tipos={CONTRACT_TYPES} />;
      case 2:
        return <Bloco2Objetivo form={form} classificacoes={CONTRACT_CLASSIFICATIONS} />;
      case 3:
        return <Bloco3Negociacao form={form} />;
      case 4:
        return <Bloco4Comercial form={form} />;
      case 5:
        return <Bloco5Riscos form={form} />;
      case 6:
        return <Bloco6Urgencia form={form} />;
      case 7:
        return <Bloco7Anexos files={files} setFiles={setFiles} />;
      default:
        return null;
    }
  };

  const isLoading = createRequest.isPending || submitRequest.isPending || uploadAttachment.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Conferência Contratual</DialogTitle>
          <DialogDescription>
            Preencha todos os blocos para enviar ao Jurídico
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Etapa {currentStep} de {STEPS.length}</span>
            <span>{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center ${
                step.id === currentStep 
                  ? 'text-primary' 
                  : step.id < currentStep 
                    ? 'text-green-600' 
                    : 'text-muted-foreground'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                step.id === currentStep 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : step.id < currentStep 
                    ? 'border-green-600 bg-green-600 text-white' 
                    : 'border-muted'
              }`}>
                {step.id < currentStep ? '✓' : step.id}
              </div>
            </div>
          ))}
        </div>

        {/* Form content */}
        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4 py-4">
            <h3 className="font-semibold">{STEPS[currentStep - 1].title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {STEPS[currentStep - 1].description}
            </p>
            {renderStep()}
            
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrev} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSaveDraft} disabled={isLoading}>
              <Save className="h-4 w-4 mr-1" />
              Salvar Rascunho
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={isLoading}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Enviar para Análise
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
