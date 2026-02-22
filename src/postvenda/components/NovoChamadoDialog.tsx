import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Gavel, AlertCircle, Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { usePostVenda, NovoChamado, ChamadoPrioridade } from '../hooks/usePostVenda';
import { TIPO_DEMANDA_OPTIONS, CANAL_ORIGEM_OPTIONS, PRIORIDADE_LABELS, BRANCH_OPTIONS } from '../lib/permissions';
import { PatientAutocomplete } from '@/neohub/components/PatientAutocomplete';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface NovoChamadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTipoDemanda?: string;
}

// Status options for required fields with "Não Encontrado" option
type TriStateValue = 'sim' | 'nao' | 'nao_encontrado' | undefined;

export function NovoChamadoDialog({ open, onOpenChange, initialTipoDemanda }: NovoChamadoDialogProps) {
  const { createChamado } = usePostVenda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; full_name: string } | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<NovoChamado>({
    paciente_nome: '',
    paciente_telefone: '',
    paciente_email: '',
    tipo_demanda: initialTipoDemanda || '',
    prioridade: 'normal',
    canal_origem: 'whatsapp',
    motivo_abertura: '',
    branch: '',
    // Campos Distrato
    distrato_valor_pago: undefined,
    distrato_data_pagamento_sinal: '',
    distrato_termo_sinal_assinado: undefined,
    distrato_termo_sinal_anexo: undefined,
    distrato_contrato_assinado: undefined,
    distrato_contrato_anexo: undefined,
  });

  // Tri-state values for required fields
  const [triStateFields, setTriStateFields] = useState<{
    termo_sinal_assinado: TriStateValue;
    termo_sinal_anexo: TriStateValue;
    contrato_assinado: TriStateValue;
    contrato_anexo: TriStateValue;
  }>({
    termo_sinal_assinado: undefined,
    termo_sinal_anexo: undefined,
    contrato_assinado: undefined,
    contrato_anexo: undefined,
  });

  const isDistrato = formData.tipo_demanda === 'distrato';

  // Validate all required distrato fields
  const isDistratoValid = () => {
    if (!isDistrato) return true;
    
    return (
      selectedPatient !== null &&
      formData.branch &&
      formData.distrato_valor_pago !== undefined &&
      formData.distrato_data_pagamento_sinal &&
      triStateFields.termo_sinal_assinado !== undefined &&
      triStateFields.termo_sinal_anexo !== undefined &&
      triStateFields.contrato_assinado !== undefined &&
      triStateFields.contrato_anexo !== undefined &&
      pdfFile !== null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDistrato) {
      if (!selectedPatient) {
        toast.error('Selecione um paciente da lista');
        return;
      }
      if (!pdfFile) {
        toast.error('Anexe o print da solicitação');
        return;
      }
      if (!isDistratoValid()) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
    } else {
      if (!formData.paciente_nome || !formData.tipo_demanda) return;
    }

    setIsSubmitting(true);
    try {
      // Convert tri-state to boolean for saving
      const submitData = {
        ...formData,
        distrato_termo_sinal_assinado: triStateFields.termo_sinal_assinado === 'sim',
        distrato_termo_sinal_anexo: triStateFields.termo_sinal_anexo === 'sim',
        distrato_contrato_assinado: triStateFields.contrato_assinado === 'sim',
        distrato_contrato_anexo: triStateFields.contrato_anexo === 'sim',
      };

      await createChamado(submitData);
      // TODO: Upload PDF file to storage if needed
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      paciente_nome: '',
      paciente_telefone: '',
      paciente_email: '',
      tipo_demanda: initialTipoDemanda || '',
      prioridade: 'normal',
      canal_origem: 'whatsapp',
      motivo_abertura: '',
      branch: '',
      distrato_valor_pago: undefined,
      distrato_data_pagamento_sinal: '',
      distrato_termo_sinal_assinado: undefined,
      distrato_termo_sinal_anexo: undefined,
      distrato_contrato_assinado: undefined,
      distrato_contrato_anexo: undefined,
    });
    setTriStateFields({
      termo_sinal_assinado: undefined,
      termo_sinal_anexo: undefined,
      contrato_assinado: undefined,
      contrato_anexo: undefined,
    });
    setSelectedPatient(null);
    setPdfFile(null);
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient({ id: patient.id, full_name: patient.full_name });
    setFormData(prev => ({
      ...prev,
      paciente_id: patient.id,
      paciente_nome: patient.full_name,
      paciente_telefone: patient.phone || '',
      paciente_email: patient.email || '',
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('O arquivo deve ter no máximo 10MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isDistrato ? "max-w-2xl max-h-[90vh]" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDistrato && <Gavel className="h-5 w-5 text-destructive" />}
            {isDistrato ? 'Nova Solicitação de Distrato' : 'Novo Chamado'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className={isDistrato ? "max-h-[70vh] pr-4" : ""}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Canal de Origem - Primeiro para Distrato */}
            <div className="space-y-2">
              <Label>Canal de Origem *</Label>
              <Select 
                value={formData.canal_origem} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, canal_origem: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {CANAL_ORIGEM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ========== CAMPOS ESPECÍFICOS DE DISTRATO ========== */}
            {isDistrato && (
              <div className="space-y-5 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Campos obrigatórios para Distrato</span>
                </div>

                {/* Paciente - Seleção da lista */}
                <div className="space-y-2 relative z-20">
                  <Label>Paciente * <span className="text-xs text-muted-foreground">(busque pelo nome)</span></Label>
                  <PatientAutocomplete
                    value={formData.paciente_nome}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, paciente_nome: value }));
                      // Clear selected patient if typing manually
                      if (selectedPatient && value !== selectedPatient.full_name) {
                        setSelectedPatient(null);
                      }
                    }}
                    onSelectPatient={handlePatientSelect}
                    placeholder="Digite o nome para buscar..."
                  />
                  {formData.paciente_nome && !selectedPatient && (
                    <div className="flex items-center gap-2 text-warning-foreground text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Paciente não encontrado. Cadastre-o primeiro no sistema.</span>
                    </div>
                  )}
                  {selectedPatient && (
                    <div className="text-xs text-primary">
                      ✓ Paciente selecionado: {selectedPatient.full_name}
                    </div>
                  )}
                </div>

                {/* PDF do Email - Obrigatório */}
                <div className="space-y-2 relative z-10">
                  <Label>Print da solicitação *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!pdfFile ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 border-dashed flex flex-col items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para anexar o PDF do e-mail</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(pdfFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Filial e Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filial *</Label>
                    <Select 
                      value={formData.branch || ''} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, branch: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a filial" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                        <SelectItem value="nao_encontrado">Não Encontrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Pago (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.distrato_valor_pago || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        distrato_valor_pago: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {/* Data Pagamento Sinal */}
                <div className="space-y-2">
                  <Label>Data Pagamento Sinal *</Label>
                  <Input
                    type="date"
                    value={formData.distrato_data_pagamento_sinal || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, distrato_data_pagamento_sinal: e.target.value }))}
                    required
                  />
                </div>

                {/* Termo de Sinal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Termo de Sinal foi assinado? *</Label>
                    <RadioGroup 
                      value={triStateFields.termo_sinal_assinado || ''}
                      onValueChange={(v) => setTriStateFields(prev => ({ ...prev, termo_sinal_assinado: v as TriStateValue }))}
                      className="flex flex-wrap gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="termo_sinal_sim" />
                        <Label htmlFor="termo_sinal_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="termo_sinal_nao" />
                        <Label htmlFor="termo_sinal_nao" className="font-normal">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao_encontrado" id="termo_sinal_ne" />
                        <Label htmlFor="termo_sinal_ne" className="font-normal text-warning-foreground">Não Encontrado</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label>Termo de Sinal em anexo? *</Label>
                    <RadioGroup 
                      value={triStateFields.termo_sinal_anexo || ''}
                      onValueChange={(v) => setTriStateFields(prev => ({ ...prev, termo_sinal_anexo: v as TriStateValue }))}
                      className="flex flex-wrap gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="termo_anexo_sim" />
                        <Label htmlFor="termo_anexo_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="termo_anexo_nao" />
                        <Label htmlFor="termo_anexo_nao" className="font-normal">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao_encontrado" id="termo_anexo_ne" />
                        <Label htmlFor="termo_anexo_ne" className="font-normal text-warning-foreground">Não Encontrado</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Contrato */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Contrato foi assinado? *</Label>
                    <RadioGroup 
                      value={triStateFields.contrato_assinado || ''}
                      onValueChange={(v) => setTriStateFields(prev => ({ ...prev, contrato_assinado: v as TriStateValue }))}
                      className="flex flex-wrap gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="contrato_sim" />
                        <Label htmlFor="contrato_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="contrato_nao" />
                        <Label htmlFor="contrato_nao" className="font-normal">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao_encontrado" id="contrato_ne" />
                        <Label htmlFor="contrato_ne" className="font-normal text-warning-foreground">Não Encontrado</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label>Contrato em anexo? *</Label>
                    <RadioGroup 
                      value={triStateFields.contrato_anexo || ''}
                      onValueChange={(v) => setTriStateFields(prev => ({ ...prev, contrato_anexo: v as TriStateValue }))}
                      className="flex flex-wrap gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="contrato_anexo_sim" />
                        <Label htmlFor="contrato_anexo_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="contrato_anexo_nao" />
                        <Label htmlFor="contrato_anexo_nao" className="font-normal">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao_encontrado" id="contrato_anexo_ne" />
                        <Label htmlFor="contrato_anexo_ne" className="font-normal text-warning-foreground">Não Encontrado</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Campos padrão para não-distrato */}
            {!isDistrato && (
              <>
                {/* Paciente */}
                <div className="space-y-2">
                  <Label>Nome do Paciente *</Label>
                  <PatientAutocomplete
                    value={formData.paciente_nome}
                    onChange={(value) => setFormData(prev => ({ ...prev, paciente_nome: value }))}
                    onSelectPatient={handlePatientSelect}
                    placeholder="Nome completo do paciente"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={formData.paciente_telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, paciente_telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.paciente_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, paciente_email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Tipo e Prioridade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Demanda *</Label>
                    <Select 
                      value={formData.tipo_demanda} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_demanda: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_DEMANDA_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              {opt.value === 'distrato' && <Gavel className="h-4 w-4 text-destructive" />}
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select 
                      value={formData.prioridade} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, prioridade: v as ChamadoPrioridade }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Tipo de Demanda para Distrato (hidden but needed) */}
            {isDistrato && (
              <input type="hidden" value="distrato" />
            )}

            {/* Motivo / Contexto Geral */}
            <div className="space-y-2">
              <Label>{isDistrato ? 'Contexto Geral' : 'Descrição do Motivo'}</Label>
              <Textarea
                value={formData.motivo_abertura}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo_abertura: e.target.value }))}
                placeholder={isDistrato 
                  ? "Descreva o contexto geral da solicitação de distrato..." 
                  : "Descreva o motivo da abertura do chamado..."
                }
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  (isDistrato ? !isDistratoValid() : (!formData.paciente_nome || !formData.tipo_demanda))
                }
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isDistrato ? 'Criar Solicitação de Distrato' : 'Criar Chamado'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
