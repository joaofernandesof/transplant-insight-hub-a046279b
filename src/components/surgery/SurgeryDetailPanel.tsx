import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  Trash2,
  ExternalLink,
  FileText,
  UserPlus,
  Stethoscope,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { SurgeryChecklistTimeline } from "./SurgeryChecklistTimeline";
import { cn } from "@/lib/utils";

interface SurgeryDetailPanelProps {
  surgery: SurgerySchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewPatient?: (patientId: string) => void;
}

export function SurgeryDetailPanel({ 
  surgery, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete,
  onViewPatient,
}: SurgeryDetailPanelProps) {
  if (!surgery) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const surgeryDate = parseISO(surgery.surgery_date);

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-muted text-muted-foreground';
    const colors: Record<string, string> = {
      'CATEGORIA A': 'bg-red-100 text-red-700',
      'CATEGORIA B': 'bg-blue-100 text-blue-700',
      'CATEGORIA C': 'bg-amber-100 text-amber-700',
      'CATEGORIA D': 'bg-green-100 text-green-700',
      'RETOQUE': 'bg-purple-100 text-purple-700',
    };
    const shortCategory = category.split(' - ')[0];
    return colors[shortCategory] || 'bg-muted text-muted-foreground';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                {surgery.patient_name}
                {onViewPatient && surgery.medical_record && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onViewPatient(surgery.medical_record!)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(surgeryDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick Info */}
            <div className="flex flex-wrap gap-2">
              <Badge className={cn(getCategoryColor(surgery.category))}>
                {surgery.category?.split(' - ')[0] || 'Sem categoria'}
              </Badge>
              <Badge variant="outline">
                <Stethoscope className="h-3 w-3 mr-1" />
                {surgery.procedure_type || 'N/A'}
              </Badge>
              {surgery.grade && (
                <Badge variant="outline">Grau {surgery.grade}</Badge>
              )}
              {surgery.surgery_time && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {surgery.surgery_time}
                </Badge>
              )}
            </div>

            {/* Patient Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Contato do Paciente
              </h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                {surgery.patient_phone ? (
                  <a 
                    href={`tel:${surgery.patient_phone}`} 
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {surgery.patient_phone}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Telefone não informado</p>
                )}
                {surgery.medical_record && (
                  <p className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Prontuário: {surgery.medical_record}
                  </p>
                )}
              </div>
            </div>

            {/* Companion */}
            {(surgery.companion_name || surgery.companion_phone) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Acompanhante
                </h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  {surgery.companion_name && (
                    <p className="text-sm font-medium">{surgery.companion_name}</p>
                  )}
                  {surgery.companion_phone && (
                    <a 
                      href={`tel:${surgery.companion_phone}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {surgery.companion_phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Financial */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Informações Financeiras
              </h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">VGV Inicial</p>
                    <p className="font-medium">{formatCurrency(surgery.initial_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Indicação</p>
                    <p className="font-medium">{formatCurrency(surgery.referral_bonus)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground text-purple-600">Upgrade</p>
                    <p className="font-medium text-purple-600">{formatCurrency(surgery.upgrade_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground text-blue-600">Upsell</p>
                    <p className="font-medium text-blue-600">{formatCurrency(surgery.upsell_value)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">VGV Final</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(surgery.final_value)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded p-2">
                    <p className="text-xs text-muted-foreground">Sinal</p>
                    <p className="font-medium text-sm">{formatCurrency(surgery.deposit_paid)}</p>
                  </div>
                  <div className="bg-background rounded p-2">
                    <p className="text-xs text-muted-foreground">Restante</p>
                    <p className="font-medium text-sm">{formatCurrency(surgery.remaining_paid)}</p>
                  </div>
                  <div className={cn(
                    "rounded p-2",
                    surgery.balance_due > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-green-50 dark:bg-green-950/30"
                  )}>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className={cn(
                      "font-bold text-sm",
                      surgery.balance_due > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {formatCurrency(surgery.balance_due)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Checklist */}
            <SurgeryChecklistTimeline surgery={surgery} />

            {/* Notes */}
            {(surgery.observations || surgery.financial_verification || surgery.post_sale_notes) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Observações</h4>
                  {surgery.observations && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Gerais</p>
                      <p className="text-sm">{surgery.observations}</p>
                    </div>
                  )}
                  {surgery.financial_verification && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Verificação Financeira</p>
                      <p className="text-sm">{surgery.financial_verification}</p>
                    </div>
                  )}
                  {surgery.post_sale_notes && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Pós-Venda</p>
                      <p className="text-sm">{surgery.post_sale_notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            Documentos sincronizados com prontuário do paciente
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
