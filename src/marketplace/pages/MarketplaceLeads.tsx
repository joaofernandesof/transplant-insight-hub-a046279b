import { useState } from "react";
import { Plus, Filter, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { LeadPipeline } from "../components/LeadPipeline";
import { useMarketplaceLeads } from "../hooks/useMarketplace";
import { toast } from "sonner";
import type { LeadStatus } from "../types/marketplace";

export function MarketplaceLeads() {
  const { data: leads, isLoading, updateLeadStatus } = useMarketplaceLeads();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const handleUpdateStatus = (id: string, status: LeadStatus) => {
    updateLeadStatus.mutate({ id, status });
  };

  const handleAddLead = () => {
    toast.info("Cadastro de lead em desenvolvimento");
  };

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Pipeline de Leads"
        subtitle="Gerencie seu funil de conversão"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex border rounded-lg p-1">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="bg-marketplace hover:bg-marketplace/90"
              onClick={handleAddLead}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Lead</span>
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <div className="h-10 bg-muted animate-pulse rounded-t-lg" />
                <div className="h-96 bg-muted/50 animate-pulse rounded-b-lg" />
              </div>
            ))}
          </div>
        ) : leads && leads.length > 0 ? (
          <LeadPipeline
            leads={leads}
            onUpdateStatus={handleUpdateStatus}
            onViewLead={(lead) => toast.info(`Detalhes de ${lead.name}`)}
          />
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-marketplace/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-marketplace" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Nenhum lead no pipeline
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Leads novos prontos para contato aparecerão aqui. Configure seu
              perfil no Marketplace para começar a atrair pacientes.
            </p>
            <Button
              className="bg-marketplace hover:bg-marketplace/90"
              onClick={handleAddLead}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar lead manualmente
            </Button>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
