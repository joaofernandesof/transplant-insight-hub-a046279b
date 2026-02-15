import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, Download, Undo2, CheckCircle2, XCircle, Clock, 
  ShoppingCart, CheckCheck, Loader2, Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { HotLead, LeadOutcome, LeadTab } from '@/hooks/useHotLeads';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionsBarProps {
  selectedLeads: Set<string>;
  allLeads: HotLead[];
  activeTab: LeadTab;
  activeItems: HotLead[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  onRelease?: (leadId: string) => Promise<boolean>;
  onUpdateOutcome?: (leadId: string, outcome: LeadOutcome) => Promise<boolean>;
  getClaimerName: (userId: string | null) => string;
}

export function BulkActionsBar({
  selectedLeads,
  allLeads,
  activeTab,
  activeItems,
  onClearSelection,
  onSelectAll,
  onRelease,
  onUpdateOutcome,
  getClaimerName,
}: BulkActionsBarProps) {
  const { isAdmin } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const count = selectedLeads.size;
  if (count === 0) return null;

  const selectedItems = allLeads.filter(l => selectedLeads.has(l.id));
  const allSelected = activeItems.length > 0 && activeItems.every(l => selectedLeads.has(l.id));

  const handleExportSelected = () => {
    const rows = selectedItems.map(l => ({
      Nome: l.name,
      Telefone: l.phone,
      Email: l.email || '',
      Estado: l.state || '',
      Cidade: l.city || '',
      Status: l.lead_outcome || (l.claimed_by ? 'Adquirido' : 'Disponível'),
      'Adquirido por': l.claimed_by ? getClaimerName(l.claimed_by) : '',
      'Data': l.available_at
        ? new Date(l.available_at).toLocaleDateString('pt-BR')
        : new Date(l.created_at).toLocaleDateString('pt-BR'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `hotleads-selecionados-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleBulkOutcome = (outcome: LeadOutcome) => {
    const labels: Record<LeadOutcome, string> = {
      vendido: 'Vendido',
      descartado: 'Descartado',
      em_atendimento: 'Em Atendimento',
    };
    setConfirmAction({
      title: `Marcar ${count} lead${count > 1 ? 's' : ''} como "${labels[outcome]}"?`,
      description: 'Esta ação será aplicada a todos os leads selecionados.',
      action: async () => {
        if (!onUpdateOutcome) return;
        setIsProcessing(outcome);
        for (const lead of selectedItems) {
          await onUpdateOutcome(lead.id, outcome);
        }
        setIsProcessing(null);
        onClearSelection();
      },
    });
  };

  const handleBulkRelease = () => {
    setConfirmAction({
      title: `Devolver ${count} lead${count > 1 ? 's' : ''}?`,
      description: 'Os leads selecionados serão devolvidos para a lista de disponíveis.',
      action: async () => {
        if (!onRelease) return;
        setIsProcessing('release');
        for (const lead of selectedItems) {
          await onRelease(lead.id);
        }
        setIsProcessing(null);
        onClearSelection();
      },
    });
  };

  // Determine which outcome actions to show based on tab
  const showOutcomeActions = activeTab === 'acquired' || activeTab === 'in_progress';
  const showReleaseAction = isAdmin && onRelease && activeTab !== 'available';

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background shadow-2xl border border-border/20">
          {/* Count & selection controls */}
          <div className="flex items-center gap-2 pr-3 border-r border-background/20">
            <span className="text-sm font-semibold whitespace-nowrap">
              {count} selecionado{count > 1 ? 's' : ''}
            </span>
            <button
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="text-xs underline opacity-70 hover:opacity-100 whitespace-nowrap"
            >
              {allSelected ? 'Limpar' : 'Todos'}
            </button>
          </div>

          {/* Context actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs gap-1.5"
              onClick={handleExportSelected}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>

            {showOutcomeActions && onUpdateOutcome && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs gap-1.5 text-green-600 hover:text-green-700"
                  onClick={() => handleBulkOutcome('vendido')}
                  disabled={isProcessing !== null}
                >
                  {isProcessing === 'vendido' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Vendido
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs gap-1.5 text-blue-500 hover:text-blue-600"
                  onClick={() => handleBulkOutcome('em_atendimento')}
                  disabled={isProcessing !== null}
                >
                  {isProcessing === 'em_atendimento' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                  Atendendo
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs gap-1.5 text-red-500 hover:text-red-600"
                  onClick={() => handleBulkOutcome('descartado')}
                  disabled={isProcessing !== null}
                >
                  {isProcessing === 'descartado' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Descartado
                </Button>
              </>
            )}

            {showReleaseAction && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs gap-1.5 text-orange-600 hover:text-orange-700"
                onClick={handleBulkRelease}
                disabled={isProcessing !== null}
              >
                {isProcessing === 'release' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                Devolver
              </Button>
            )}
          </div>

          <button
            onClick={onClearSelection}
            className="ml-1 p-1 rounded-full hover:bg-background/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAction?.action();
                setConfirmAction(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
