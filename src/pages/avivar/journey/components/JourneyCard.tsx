/**
 * Card component for patient journey with checklist
 */

import { useState } from 'react';
import { PatientJourney, StageConfig, SERVICE_LABELS } from '../types';
import { isStageComplete, getStageProgress, canAdvanceStage } from '../hooks/usePatientJourneys';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Phone, 
  ChevronRight, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JourneyCardProps {
  journey: PatientJourney;
  stageConfig: StageConfig;
  onUpdate: (updates: Partial<PatientJourney>) => void;
  onAdvance: () => void;
  onSelect: () => void;
}

export function JourneyCard({ 
  journey, 
  stageConfig, 
  onUpdate, 
  onAdvance,
  onSelect 
}: JourneyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = getStageProgress(journey, stageConfig);
  const { canAdvance, message } = canAdvanceStage(journey);
  const isComplete = isStageComplete(journey, stageConfig);

  const handleChecklistToggle = (field: keyof PatientJourney, currentValue: unknown) => {
    if (typeof currentValue === 'boolean') {
      onUpdate({ [field]: !currentValue });
    } else if (typeof currentValue === 'number') {
      onUpdate({ [field]: (currentValue as number) + 1 });
    } else {
      // For text fields, just mark as having some value
      onUpdate({ [field]: currentValue || 'Preenchido' });
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-l-4",
        isComplete ? "border-l-emerald-500" : "border-l-amber-500"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm truncate max-w-[120px]">
              {journey.patient_name}
            </span>
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-[10px]",
              journey.service_type === 'capilar' && "bg-blue-100 text-blue-700",
              journey.service_type === 'barba' && "bg-amber-100 text-amber-700",
              journey.service_type === 'sobrancelha' && "bg-pink-100 text-pink-700"
            )}
          >
            {SERVICE_LABELS[journey.service_type]}
          </Badge>
        </div>

        {/* Contact */}
        {journey.patient_phone && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{journey.patient_phone}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Checklist</span>
            <span className={cn(
              "font-medium",
              progress === 100 ? "text-emerald-600" : "text-amber-600"
            )}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Expanded Checklist */}
        {expanded && (
          <div className="pt-2 border-t space-y-2" onClick={e => e.stopPropagation()}>
            {stageConfig.checklist.map(item => {
              const value = journey[item.field];
              const isChecked = typeof value === 'boolean' ? value : !!value;
              
              return (
                <div 
                  key={item.id} 
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleChecklistToggle(item.field, value)}
                    className="h-4 w-4"
                  />
                  <span className={cn(
                    "text-xs",
                    isChecked ? "text-muted-foreground line-through" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                  {item.required && !isChecked && (
                    <span className="text-[10px] text-destructive">*</span>
                  )}
                </div>
              );
            })}

            {/* Advance Button */}
            <div className="pt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                Detalhes
              </Button>
              <Button
                size="sm"
                className={cn(
                  "flex-1 text-xs",
                  canAdvance 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                disabled={!canAdvance}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canAdvance) onAdvance();
                }}
              >
                {canAdvance ? (
                  <>
                    Avançar <ChevronRight className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" /> Bloqueado
                  </>
                )}
              </Button>
            </div>

            {/* Blocking Message */}
            {!canAdvance && message && (
              <div className="flex items-start gap-1.5 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(journey.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          {isComplete && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
