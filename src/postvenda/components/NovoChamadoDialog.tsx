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
import { Loader2 } from 'lucide-react';
import { usePostVenda, NovoChamado, ChamadoPrioridade } from '../hooks/usePostVenda';
import { TIPO_DEMANDA_OPTIONS, CANAL_ORIGEM_OPTIONS, PRIORIDADE_LABELS } from '../lib/permissions';
import { PatientAutocomplete } from '@/neohub/components/PatientAutocomplete';

interface NovoChamadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoChamadoDialog({ open, onOpenChange }: NovoChamadoDialogProps) {
  const { createChamado } = usePostVenda();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NovoChamado>({
    paciente_nome: '',
    paciente_telefone: '',
    paciente_email: '',
    tipo_demanda: '',
    prioridade: 'normal',
    canal_origem: 'whatsapp',
    motivo_abertura: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_nome || !formData.tipo_demanda) return;

    setIsSubmitting(true);
    try {
      await createChamado(formData);
      onOpenChange(false);
      setFormData({
        paciente_nome: '',
        paciente_telefone: '',
        paciente_email: '',
        tipo_demanda: '',
        prioridade: 'normal',
        canal_origem: 'whatsapp',
        motivo_abertura: '',
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
        </DialogHeader>

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
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Descrição do Motivo</Label>
            <Textarea
              value={formData.motivo_abertura}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo_abertura: e.target.value }))}
              placeholder="Descreva o motivo da abertura do chamado..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.paciente_nome || !formData.tipo_demanda}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Chamado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
