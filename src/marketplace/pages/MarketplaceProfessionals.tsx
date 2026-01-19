import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { ProfessionalCard } from "../components/ProfessionalCard";
import { useMarketplaceProfessionals } from "../hooks/useMarketplace";
import { toast } from "sonner";

export function MarketplaceProfessionals() {
  const { data: professionals, isLoading } = useMarketplaceProfessionals();
  const [search, setSearch] = useState("");

  const filteredProfessionals = professionals?.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProfessional = () => {
    toast.info("Funcionalidade de cadastro em desenvolvimento");
  };

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Profissionais"
        subtitle="Gerencie sua equipe médica"
        actions={
          <Button
            className="bg-marketplace hover:bg-marketplace/90"
            onClick={handleAddProfessional}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Professionals Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredProfessionals && filteredProfessionals.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onViewProfile={() => toast.info("Ver perfil em desenvolvimento")}
                onSchedule={() => toast.info("Agendamento em desenvolvimento")}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-marketplace/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-marketplace" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Nenhum profissional cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Adicione os médicos e especialistas da sua clínica.
            </p>
            <Button
              className="bg-marketplace hover:bg-marketplace/90"
              onClick={handleAddProfessional}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar profissional
            </Button>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
