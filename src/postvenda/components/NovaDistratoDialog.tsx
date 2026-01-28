import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail } from 'lucide-react';
import { useDistratoRequests, NovaDistratoSolicitacao } from '../hooks/useDistrato';
import { PatientAutocomplete } from '@/neohub/components/PatientAutocomplete';

interface NovaDistratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaDistratoDialog({ open, onOpenChange }: NovaDistratoDialogProps) {
  const { criarSolicitacao } = useDistratoRequests();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [formData, setFormData] = useState<NovaDistratoSolicitacao>({
    paciente_nome: '',
    paciente_email: '',
    paciente_telefone: '',
    email_remetente: '',
    email_assunto: 'Nova solicitação de distrato',
    email_corpo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_nome.trim()) return;

    try {
      setIsSubmitting(true);
      await criarSolicitacao(formData);
      onOpenChange(false);
      setFormData({
        paciente_nome: '',
        paciente_email: '',
        paciente_telefone: '',
        email_remetente: '',
        email_assunto: 'Nova solicitação de distrato',
        email_corpo: '',
      });
      setPatientSearch('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientSelect = (patient: { id: string; full_name: string; email?: string; phone?: string }) => {
    setFormData(prev => ({
      ...prev,
      paciente_id: patient.id,
      paciente_nome: patient.full_name,
      paciente_email: patient.email || '',
      paciente_telefone: patient.phone || '',
      email_remetente: patient.email || '',
    }));
    setPatientSearch(patient.full_name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Nova Solicitação de Distrato
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente / Titular do Contrato</Label>
            <PatientAutocomplete
              value={patientSearch}
              onChange={setPatientSearch}
              onSelectPatient={handlePatientSelect}
              placeholder="Buscar paciente..."
            />
            {formData.paciente_nome && (
              <p className="text-sm text-muted-foreground">
                Selecionado: {formData.paciente_nome}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-mail do Paciente</Label>
              <Input
                type="email"
                value={formData.paciente_email}
                onChange={(e) => setFormData(prev => ({ ...prev, paciente_email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.paciente_telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, paciente_telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-mail do Remetente (se diferente)</Label>
            <Input
              type="email"
              value={formData.email_remetente}
              onChange={(e) => setFormData(prev => ({ ...prev, email_remetente: e.target.value }))}
              placeholder="email@exemplo.com"
            />
            <p className="text-xs text-muted-foreground">
              Preencha se o e-mail foi recebido de outra pessoa que não o titular
            </p>
          </div>

          <div className="space-y-2">
            <Label>Corpo do E-mail (opcional)</Label>
            <Textarea
              value={formData.email_corpo}
              onChange={(e) => setFormData(prev => ({ ...prev, email_corpo: e.target.value }))}
              placeholder="Cole aqui o conteúdo do e-mail recebido..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.paciente_nome.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Solicitação'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
