/**
 * Dialog para criar novo lead no Kanban
 * Permite selecionar etapa/coluna inicial
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { COMMERCIAL_STAGES, POST_SALE_STAGES, SERVICE_LABELS, ServiceType, JourneyStage, JourneyType, StageConfig } from '../types';
import { Loader2, User, Phone, Mail, MapPin, MessageSquare } from 'lucide-react';

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyType: JourneyType;
  onSubmit: (data: NewLeadData) => void;
  isLoading?: boolean;
}

export interface NewLeadData {
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  service_type: ServiceType;
  current_stage: JourneyStage;
  lead_source?: string;
  notes?: string;
}

export function NewLeadDialog({ open, onOpenChange, journeyType, onSubmit, isLoading }: NewLeadDialogProps) {
  const stages: StageConfig[] = journeyType === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;
  const defaultStage = stages[0].id;

  const [formData, setFormData] = useState<NewLeadData>({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    service_type: 'capilar',
    current_stage: defaultStage,
    lead_source: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name.trim()) return;
    onSubmit(formData);
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      service_type: 'capilar',
      current_stage: defaultStage,
      lead_source: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <User className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Novo Lead
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            Adicione as informações do novo lead. Ele será adicionado na etapa selecionada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[hsl(var(--avivar-foreground))]">
              Nome *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              <Input
                id="name"
                placeholder="Nome do lead"
                value={formData.patient_name}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                required
              />
            </div>
          </div>

          {/* Telefone e Email - Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[hsl(var(--avivar-foreground))]">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <Input
                  id="phone"
                  placeholder="+55 (00) 00000-0000"
                  value={formData.patient_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_phone: e.target.value }))}
                  className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[hsl(var(--avivar-foreground))]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.patient_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, patient_email: e.target.value }))}
                  className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Serviço e Etapa - Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">
                Tipo de Serviço *
              </Label>
              <Select
                value={formData.service_type}
                onValueChange={(value: ServiceType) => setFormData(prev => ({ ...prev, service_type: value }))}
              >
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">
                Etapa Inicial *
              </Label>
              <Select
                value={formData.current_stage}
                onValueChange={(value: JourneyStage) => setFormData(prev => ({ ...prev, current_stage: value }))}
              >
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.statusColor}`} />
                        {stage.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Origem do Lead */}
          <div className="space-y-2">
            <Label htmlFor="source" className="text-[hsl(var(--avivar-foreground))]">
              Origem do Lead
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              <Input
                id="source"
                placeholder="Ex: Instagram, Google, Indicação..."
                value={formData.lead_source}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_source: e.target.value }))}
                className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[hsl(var(--avivar-foreground))]">
              Observações
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              <Textarea
                id="notes"
                placeholder="Notas adicionais sobre o lead..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="pl-10 min-h-[80px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.patient_name.trim() || isLoading}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
