/**
 * ConfirmActionDialog - Diálogo reutilizável de confirmação para ações críticas
 * 
 * Uso:
 * <ConfirmActionDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Excluir registro?"
 *   description="Esta ação não pode ser desfeita."
 *   impact="Todos os dados associados serão removidos permanentemente."
 *   severity="destructive"
 *   confirmLabel="Excluir"
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, ShieldAlert, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmSeverity = "destructive" | "warning" | "info";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Texto explicando o impacto da ação */
  impact?: string;
  /** Nível de severidade visual */
  severity?: ConfirmSeverity;
  /** Texto do botão de confirmação */
  confirmLabel?: string;
  /** Texto do botão de cancelamento */
  cancelLabel?: string;
  /** Callback ao confirmar */
  onConfirm: () => void | Promise<void>;
  /** Estado de carregamento */
  isLoading?: boolean;
}

const severityConfig: Record<ConfirmSeverity, {
  icon: typeof Trash2;
  iconClass: string;
  badgeBg: string;
  buttonClass: string;
  impactBg: string;
  impactBorder: string;
  impactText: string;
}> = {
  destructive: {
    icon: Trash2,
    iconClass: "text-destructive",
    badgeBg: "bg-destructive/10",
    buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    impactBg: "bg-destructive/5",
    impactBorder: "border-destructive/20",
    impactText: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    badgeBg: "bg-amber-500/10",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
    impactBg: "bg-amber-500/5",
    impactBorder: "border-amber-500/20",
    impactText: "text-amber-600",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    badgeBg: "bg-blue-500/10",
    buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    impactBg: "bg-blue-500/5",
    impactBorder: "border-blue-500/20",
    impactText: "text-blue-600",
  },
};

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  impact,
  severity = "destructive",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  isLoading = false,
}: ConfirmActionDialogProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-full flex-shrink-0", config.badgeBg)}>
              <Icon className={cn("h-5 w-5", config.iconClass)} />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {description}
              </AlertDialogDescription>
            </div>
          </div>

          {impact && (
            <div className={cn(
              "mt-3 p-3 rounded-md border text-sm",
              config.impactBg,
              config.impactBorder
            )}>
              <div className="flex items-start gap-2">
                <ShieldAlert className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.impactText)} />
                <span className="text-muted-foreground">{impact}</span>
              </div>
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(config.buttonClass)}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmActionDialog;
