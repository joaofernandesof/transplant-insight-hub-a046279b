/**
 * PatientJourneyDetailsSidebar - Painel lateral para leads da jornada (avivar_patient_journeys)
 * Exibe dados do paciente/lead do Kanban Comercial e Pós-Venda
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
  Bookmark,
  Target,
  Stethoscope,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PatientJourney, SERVICE_LABELS, STAGE_LABELS } from '@/pages/avivar/journey/types';
import { usePatientJourneys } from '@/pages/avivar/journey/hooks/usePatientJourneys';
import { toast } from 'sonner';

interface PatientJourneyDetailsSidebarProps {
  journey: PatientJourney;
  onJourneyUpdated?: () => void;
}

const stageColors: Record<string, string> = {
  lead_entrada: 'bg-blue-500',
  triagem: 'bg-amber-500',
  agendamento: 'bg-purple-500',
  follow_up: 'bg-orange-500',
  paciente: 'bg-emerald-500',
  onboarding: 'bg-cyan-500',
  contrato: 'bg-indigo-500',
  contrato_assinado: 'bg-green-500',
  pre_operatorio: 'bg-violet-500',
  procedimento: 'bg-rose-500',
  pos_operatorio: 'bg-teal-500',
  relacionamento: 'bg-pink-500',
};

export function PatientJourneyDetailsSidebar({ journey, onJourneyUpdated }: PatientJourneyDetailsSidebarProps) {
  const [isContactOpen, setIsContactOpen] = useState(true);
  const [isFunnelOpen, setIsFunnelOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [editedData, setEditedData] = useState({
    patient_name: journey.patient_name,
    patient_phone: journey.patient_phone || '',
    patient_email: journey.patient_email || '',
    service_type: journey.service_type,
    lead_source: journey.lead_source || '',
    notes: journey.notes || '',
  });

  const { updateJourney } = usePatientJourneys();

  const handleSave = async () => {
    try {
      await updateJourney.mutateAsync({
        id: journey.id,
        updates: {
          patient_name: editedData.patient_name,
          patient_phone: editedData.patient_phone || undefined,
          patient_email: editedData.patient_email || undefined,
          service_type: editedData.service_type as any,
          lead_source: editedData.lead_source || undefined,
          notes: editedData.notes || undefined,
        }
      });
      setIsEditMode(false);
      toast.success('Lead atualizado com sucesso!');
      onJourneyUpdated?.();
    } catch (error) {
      toast.error('Erro ao salvar alterações');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateJourney.mutateAsync({
        id: journey.id,
        updates: { notes: editedData.notes || undefined }
      });
      toast.success('Observações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar observações');
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-[hsl(var(--avivar-card))]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 border-2 border-[hsl(var(--avivar-primary))]">
            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] text-xl font-bold">
              {journey.patient_name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {isEditMode ? (
              <Input
                value={editedData.patient_name}
                onChange={(e) => setEditedData(prev => ({ ...prev, patient_name: e.target.value }))}
                className="font-bold text-lg mb-1"
              />
            ) : (
              <h3 className="font-bold text-[hsl(var(--avivar-foreground))] text-lg truncate">
                {journey.patient_name}
              </h3>
            )}
            <Badge 
              variant="outline" 
              className="text-xs font-mono mt-1 bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
            >
              #{journey.id.slice(0, 8)}
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Edit2 className={cn(
              "h-4 w-4",
              isEditMode ? "text-[hsl(var(--avivar-primary))]" : "text-[hsl(var(--avivar-muted-foreground))]"
            )} />
          </Button>
        </div>

        {isEditMode && (
          <div className="mt-3 flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={updateJourney.isPending}
              className="flex-1 bg-[hsl(var(--avivar-primary))]"
            >
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditMode(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Contato */}
          <Collapsible open={isContactOpen} onOpenChange={setIsContactOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Contato
                </span>
                {isContactOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {isEditMode ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Telefone</Label>
                    <Input
                      value={editedData.patient_phone}
                      onChange={(e) => setEditedData(prev => ({ ...prev, patient_phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={editedData.patient_email}
                      onChange={(e) => setEditedData(prev => ({ ...prev, patient_email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </>
              ) : (
                <>
                  {journey.patient_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      <span className="text-[hsl(var(--avivar-foreground))]">{journey.patient_phone}</span>
                    </div>
                  )}
                  {journey.patient_email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      <span className="text-[hsl(var(--avivar-foreground))] truncate">{journey.patient_email}</span>
                    </div>
                  )}
                  {!journey.patient_phone && !journey.patient_email && (
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] italic">
                      Nenhum contato informado
                    </p>
                  )}
                </>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <span className="text-[hsl(var(--avivar-foreground))]">
                  Criado em {format(new Date(journey.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-[hsl(var(--avivar-border))]" />

          {/* Funil e Estágio */}
          <Collapsible open={isFunnelOpen} onOpenChange={setIsFunnelOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <Target className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Funil & Serviço
                </span>
                {isFunnelOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Etapa atual</label>
                <Badge 
                  className={cn(
                    "text-white",
                    stageColors[journey.current_stage] || 'bg-gray-500'
                  )}
                >
                  {STAGE_LABELS[journey.current_stage] || journey.current_stage}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tipo de Jornada</label>
                <Badge variant="outline">
                  {journey.journey_type === 'comercial' ? 'Comercial' : 'Pós-Venda'}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Serviço</label>
                {isEditMode ? (
                  <Select
                    value={editedData.service_type}
                    onValueChange={(value) => setEditedData(prev => ({ ...prev, service_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capilar">Transplante Capilar</SelectItem>
                      <SelectItem value="barba">Transplante de Barba</SelectItem>
                      <SelectItem value="sobrancelha">Transplante de Sobrancelha</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                      {SERVICE_LABELS[journey.service_type]}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Origem</label>
                {isEditMode ? (
                  <Input
                    value={editedData.lead_source}
                    onChange={(e) => setEditedData(prev => ({ ...prev, lead_source: e.target.value }))}
                    placeholder="Ex: Instagram, Google, Indicação..."
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                      {journey.lead_source || 'Não informado'}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-[hsl(var(--avivar-border))]" />

          {/* Observações */}
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Observações
                </span>
                {isNotesOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                placeholder="Adicione observações sobre este lead..."
                value={editedData.notes}
                onChange={(e) => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[100px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
              <Button 
                size="sm" 
                className="mt-2 w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
                onClick={handleSaveNotes}
                disabled={updateJourney.isPending}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Salvar Observações
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
