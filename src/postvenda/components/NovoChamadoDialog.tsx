import { useState } from 'react';
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
import { Loader2, Gavel, AlertCircle } from 'lucide-react';
import { usePostVenda, NovoChamado, ChamadoPrioridade } from '../hooks/usePostVenda';
import { TIPO_DEMANDA_OPTIONS, CANAL_ORIGEM_OPTIONS, PRIORIDADE_LABELS, BRANCH_OPTIONS } from '../lib/permissions';
import { PatientAutocomplete } from '@/neohub/components/PatientAutocomplete';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NovoChamadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTipoDemanda?: string;
}

export function NovoChamadoDialog({ open, onOpenChange, initialTipoDemanda }: NovoChamadoDialogProps) {
  const { createChamado } = usePostVenda();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    distrato_forma_pagamento: undefined,
    distrato_termo_sinal_assinado: undefined,
    distrato_termo_sinal_anexo: undefined,
    distrato_contrato_assinado: undefined,
    distrato_contrato_anexo: undefined,
  });

  const isDistrato = formData.tipo_demanda === 'distrato';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_nome || !formData.tipo_demanda) return;

    // Validação adicional para distrato
    if (isDistrato && !formData.branch) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createChamado(formData);
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
      distrato_forma_pagamento: undefined,
      distrato_termo_sinal_assinado: undefined,
      distrato_termo_sinal_anexo: undefined,
      distrato_contrato_assinado: undefined,
      distrato_contrato_anexo: undefined,
    });
  };

  const handlePatientSelect = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      paciente_id: patient.id,
      paciente_nome: patient.full_name,
      paciente_telefone: patient.phone || '',
      paciente_email: patient.email || '',
    }));
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paciente */}
            <div className="space-y-2">
              <Label>Nome do Paciente *</Label>
              <Input
                value={formData.paciente_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, paciente_nome: e.target.value }))}
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

            {/* Canal de Origem */}
            <div className="space-y-2">
              <Label>Canal de Origem</Label>
              <Select 
                value={formData.canal_origem} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, canal_origem: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANAL_ORIGEM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ========== CAMPOS ESPECÍFICOS DE DISTRATO ========== */}
            {isDistrato && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="flex items-center gap-2 text-warning-foreground bg-warning/20 p-3 rounded-lg border border-warning/30">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Campos obrigatórios para Distrato</span>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Pago (R$)</Label>
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
                    />
                  </div>
                </div>

                {/* Data Pagamento Sinal e Forma */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Pagamento Sinal</Label>
                    <Input
                      type="date"
                      value={formData.distrato_data_pagamento_sinal || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, distrato_data_pagamento_sinal: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select 
                      value={formData.distrato_forma_pagamento || ''} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, distrato_forma_pagamento: v as 'online' | 'presencial' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Termo de Sinal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Termo de Sinal foi assinado?</Label>
                    <RadioGroup 
                      value={formData.distrato_termo_sinal_assinado === undefined ? '' : formData.distrato_termo_sinal_assinado ? 'sim' : 'nao'}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, distrato_termo_sinal_assinado: v === 'sim' }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="termo_sinal_sim" />
                        <Label htmlFor="termo_sinal_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="termo_sinal_nao" />
                        <Label htmlFor="termo_sinal_nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label>Termo de Sinal em anexo?</Label>
                    <RadioGroup 
                      value={formData.distrato_termo_sinal_anexo === undefined ? '' : formData.distrato_termo_sinal_anexo ? 'sim' : 'nao'}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, distrato_termo_sinal_anexo: v === 'sim' }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="termo_anexo_sim" />
                        <Label htmlFor="termo_anexo_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="termo_anexo_nao" />
                        <Label htmlFor="termo_anexo_nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Contrato */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Contrato foi assinado?</Label>
                    <RadioGroup 
                      value={formData.distrato_contrato_assinado === undefined ? '' : formData.distrato_contrato_assinado ? 'sim' : 'nao'}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, distrato_contrato_assinado: v === 'sim' }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="contrato_sim" />
                        <Label htmlFor="contrato_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="contrato_nao" />
                        <Label htmlFor="contrato_nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label>Contrato em anexo?</Label>
                    <RadioGroup 
                      value={formData.distrato_contrato_anexo === undefined ? '' : formData.distrato_contrato_anexo ? 'sim' : 'nao'}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, distrato_contrato_anexo: v === 'sim' }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="contrato_anexo_sim" />
                        <Label htmlFor="contrato_anexo_sim" className="font-normal">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="contrato_anexo_nao" />
                        <Label htmlFor="contrato_anexo_nao" className="font-normal">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
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
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.paciente_nome || !formData.tipo_demanda || (isDistrato && !formData.branch)}
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
