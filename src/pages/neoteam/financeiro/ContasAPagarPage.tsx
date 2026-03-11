/**
 * Contas a Pagar - Página completa com formulário, tabela e kanban
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Table as TableIcon, FileText } from "lucide-react";
import AccountsPayable from "@/pages/ipromed/components/financial/AccountsPayable";
import PaymentRequestForm from "./components/PaymentRequestForm";
import PayablesKanban from "./components/PayablesKanban";
import { usePayables } from "@/pages/ipromed/hooks/usePayables";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ContasAPagarPage() {
  const [activeTab, setActiveTab] = useState("kanban");
  const { payables, refetch, isUpdating } = usePayables();

  const handleMoveStage = async (id: string, newStage: string, reason?: string) => {
    const updates: Record<string, any> = {
      workflow_stage: newStage,
    };

    if (newStage === 'pendencia') {
      updates.pending_reason = reason;
    } else if (newStage === 'negado') {
      updates.rejection_reason = reason;
      updates.status = 'cancelado';
    } else if (newStage === 'pago') {
      updates.status = 'pago';
      updates.payment_date = new Date().toISOString().split('T')[0];
    } else if (newStage === 'aprovacao_gestor') {
      updates.pending_reason = null;
    }

    const { error } = await supabase
      .from('ipromed_payables')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error(`Erro ao mover: ${error.message}`);
      return;
    }

    toast.success('Pagamento movido com sucesso!');
    refetch();
  };

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="tabela" className="gap-1.5">
              <TableIcon className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="formulario" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Solicitar Pagamento
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="mt-4">
          <PayablesKanban
            payables={payables}
            onMoveStage={handleMoveStage}
            isUpdating={isUpdating}
          />
        </TabsContent>

        <TabsContent value="tabela" className="mt-4">
          <AccountsPayable />
        </TabsContent>

        <TabsContent value="formulario" className="mt-4">
          <PaymentRequestForm onSuccess={() => { setActiveTab("kanban"); refetch(); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
