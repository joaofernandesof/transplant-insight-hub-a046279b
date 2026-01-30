/**
 * Detail sheet for viewing/editing a patient journey
 */

import { useState, useEffect } from 'react';
import { PatientJourney, SERVICE_LABELS, STAGE_LABELS, COMMERCIAL_STAGES, POST_SALE_STAGES } from '../types';
import { getStageConfig, isStageComplete, getStageProgress, canAdvanceStage } from '../hooks/usePatientJourneys';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar,
  ChevronRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface JourneyDetailSheetProps {
  journey: PatientJourney | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<PatientJourney>) => void;
  onAdvance: () => void;
}

export function JourneyDetailSheet({
  journey,
  open,
  onClose,
  onUpdate,
  onAdvance
}: JourneyDetailSheetProps) {
  const [localData, setLocalData] = useState<Partial<PatientJourney>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local data when journey changes
  useEffect(() => {
    if (journey) {
      setLocalData({
        patient_name: journey.patient_name,
        patient_phone: journey.patient_phone,
        patient_email: journey.patient_email,
        service_type: journey.service_type,
        notes: journey.notes,
      });
      setHasChanges(false);
    }
  }, [journey]);

  if (!journey) return null;

  const stageConfig = getStageConfig(journey.current_stage);
  const progress = stageConfig ? getStageProgress(journey, stageConfig) : 0;
  const { canAdvance, message } = canAdvanceStage(journey);
  const stages = journey.journey_type === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;

  const handleLocalChange = (field: keyof PatientJourney, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localData);
      setHasChanges(false);
      toast.success('Informações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar informações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChecklistChange = (field: keyof PatientJourney, checked: boolean) => {
    // Checklist items are saved immediately
    onUpdate({ [field]: checked });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {journey.patient_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn(
              journey.service_type === 'capilar' && "border-blue-500 text-blue-600",
              journey.service_type === 'barba' && "border-amber-500 text-amber-600",
              journey.service_type === 'sobrancelha' && "border-pink-500 text-pink-600"
            )}>
              {SERVICE_LABELS[journey.service_type]}
            </Badge>
            <Badge variant="secondary">
              {STAGE_LABELS[journey.current_stage]}
            </Badge>
            <Badge variant={journey.journey_type === 'comercial' ? 'default' : 'outline'}>
              {journey.journey_type === 'comercial' ? 'Comercial' : 'Pós-Venda'}
            </Badge>
          </div>

          {/* Stage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso da Etapa</span>
              <span className={cn(
                "font-bold",
                progress === 100 ? "text-emerald-600" : "text-amber-600"
              )}>
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Stage Timeline */}
            <div className="flex gap-1 mt-3">
              {stages.map((stage, idx) => {
                const isCurrent = stage.id === journey.current_stage;
                const isPast = stages.findIndex(s => s.id === journey.current_stage) > idx;
                
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex-1 h-1.5 rounded-full",
                      isCurrent && stage.statusColor,
                      isPast && "bg-emerald-500",
                      !isCurrent && !isPast && "bg-muted"
                    )}
                    title={stage.label}
                  />
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Patient Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">Informações do Paciente</h4>
              {hasChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-500">
                  Alterações não salvas
                </Badge>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
                <Input
                  id="name"
                  value={localData.patient_name || ''}
                  onChange={(e) => handleLocalChange('patient_name', e.target.value)}
                  className="mt-1 bg-background border-input focus:ring-2 focus:ring-primary cursor-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone" className="text-foreground">Telefone</Label>
                  <Input
                    id="phone"
                    value={localData.patient_phone || ''}
                    onChange={(e) => handleLocalChange('patient_phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1 bg-background border-input focus:ring-2 focus:ring-primary cursor-text"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localData.patient_email || ''}
                    onChange={(e) => handleLocalChange('patient_email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="mt-1 bg-background border-input focus:ring-2 focus:ring-primary cursor-text"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="service" className="text-foreground">Tipo de Serviço</Label>
                <Select
                  value={localData.service_type || journey.service_type}
                  onValueChange={(value) => handleLocalChange('service_type', value)}
                >
                  <SelectTrigger className="mt-1 bg-background border-input cursor-pointer hover:bg-accent/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capilar">Transplante Capilar</SelectItem>
                    <SelectItem value="barba">Transplante de Barba</SelectItem>
                    <SelectItem value="sobrancelha">Transplante de Sobrancelha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                  "w-full mt-2",
                  hasChanges 
                    ? "bg-primary hover:bg-primary/90" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Current Stage Checklist */}
          {stageConfig && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Checklist: {stageConfig.label}
              </h4>

              <p className="text-xs text-muted-foreground">
                Os itens abaixo são preenchidos automaticamente pela IA durante o atendimento.
              </p>

              <div className="space-y-3">
                {stageConfig.checklist.map(item => {
                  const value = journey[item.field];
                  // Default to false (unchecked) - AI fills these during conversation
                  const isChecked = typeof value === 'boolean' ? value : false;

                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        isChecked 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" 
                          : "bg-background border-border"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          handleChecklistChange(item.field, !!checked);
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <span className={cn(
                          "text-sm",
                          isChecked && "line-through text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                        {item.required && !isChecked && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      {isChecked && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={localData.notes || ''}
              onChange={(e) => handleLocalChange('notes', e.target.value)}
              placeholder="Adicione observações sobre o paciente..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Blocking Message */}
          {!canAdvance && message && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={onAdvance}
              disabled={!canAdvance}
              className={cn(
                "flex-1",
                canAdvance 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : ""
              )}
            >
              {canAdvance ? (
                <>
                  Avançar Etapa <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" /> Bloqueado
                </>
              )}
            </Button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground flex items-center gap-4 pt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Criado: {format(new Date(journey.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
            {journey.converted_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Convertido: {format(new Date(journey.converted_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
