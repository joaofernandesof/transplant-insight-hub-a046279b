/**
 * Módulo de Conferência Contratual - Jurídico
 * Portal do Colaborador → NeoHub
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractReviewKanban } from "@/components/contract-review/ContractReviewKanban";
import { ContractReviewList } from "@/components/contract-review/ContractReviewList";
import { NewContractReviewDialog } from "@/components/contract-review/NewContractReviewDialog";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function ContractReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  
  const currentTab = searchParams.get("view") || "kanban";
  
  const handleTabChange = (value: string) => {
    setSearchParams({ view: value });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Conferência Contratual
          </h1>
          <p className="text-muted-foreground">
            Solicitações de análise jurídica de contratos
          </p>
        </div>
        
        <Button onClick={() => setIsNewDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="mt-6">
          <ContractReviewKanban />
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <ContractReviewList />
        </TabsContent>
      </Tabs>

      {/* Dialog de nova solicitação */}
      <NewContractReviewDialog 
        open={isNewDialogOpen} 
        onOpenChange={setIsNewDialogOpen} 
      />
    </div>
  );
}
