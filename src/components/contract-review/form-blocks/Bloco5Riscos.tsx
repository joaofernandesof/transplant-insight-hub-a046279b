/**
 * Bloco 5: Pontos sensíveis e foco do Jurídico
 */

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, DollarSign, Settings, Scale, Image } from "lucide-react";

interface Bloco5Props {
  form: UseFormReturn<any>;
}

const RISK_OPTIONS = [
  { 
    id: 'risco_clausula_especifica', 
    label: 'Dúvida sobre cláusula específica',
    icon: AlertTriangle,
    color: 'text-amber-600'
  },
  { 
    id: 'risco_financeiro', 
    label: 'Risco Financeiro',
    icon: DollarSign,
    color: 'text-red-600'
  },
  { 
    id: 'risco_operacional', 
    label: 'Risco Operacional',
    icon: Settings,
    color: 'text-blue-600'
  },
  { 
    id: 'risco_juridico', 
    label: 'Risco Jurídico',
    icon: Scale,
    color: 'text-purple-600'
  },
  { 
    id: 'risco_imagem', 
    label: 'Risco de Imagem',
    icon: Image,
    color: 'text-orange-600'
  },
];

export function Bloco5Riscos({ form }: Bloco5Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Selecione os pontos de atenção</Label>
        <p className="text-xs text-muted-foreground">
          Marque todos os tipos de risco que você identifica neste contrato
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RISK_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isChecked = form.watch(option.id);
            
            return (
              <div
                key={option.id}
                className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors ${
                  isChecked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => form.setValue(option.id, !isChecked)}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(v) => form.setValue(option.id, v)}
                />
                <Icon className={`h-4 w-4 ${option.color}`} />
                <Label className="font-normal cursor-pointer">{option.label}</Label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="foco_atencao_juridico">
          🎯 Explique onde o Jurídico deve olhar com mais atenção *
        </Label>
        <p className="text-xs text-muted-foreground">
          Seja específico sobre cláusulas, termos ou situações que precisam de análise detalhada
        </p>
        <Textarea
          {...form.register('foco_atencao_juridico')}
          placeholder="Ex: Verificar a cláusula 5.2 sobre rescisão antecipada, pois o prazo de aviso parece muito curto. Também preciso de orientação sobre a cláusula de exclusividade..."
          rows={4}
        />
        {form.formState.errors.foco_atencao_juridico && (
          <p className="text-sm text-destructive">
            {form.formState.errors.foco_atencao_juridico.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
