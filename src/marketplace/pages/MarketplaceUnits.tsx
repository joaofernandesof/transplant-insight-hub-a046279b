import { useState } from "react";
import { Plus, Search, Filter, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { UnitCard } from "../components/UnitCard";
import { useMarketplaceUnits } from "../hooks/useMarketplace";
import { toast } from "sonner";

export function MarketplaceUnits() {
  const { data: units, isLoading } = useMarketplaceUnits();
  const [search, setSearch] = useState("");

  const filteredUnits = units?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.toLowerCase().includes(search.toLowerCase()) ||
    u.state?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUnit = () => {
    toast.info("Funcionalidade de cadastro em desenvolvimento");
  };

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Unidades"
        subtitle="Administre suas clínicas"
        actions={
          <Button
            className="bg-marketplace hover:bg-marketplace/90"
            onClick={handleAddUnit}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Unidade</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade ou estado..."
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

        {/* Units Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredUnits && filteredUnits.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onViewProfile={() => toast.info("Ver unidade em desenvolvimento")}
                onSchedule={() => toast.info("Agendamento em desenvolvimento")}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-marketplace/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-marketplace" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Nenhuma unidade cadastrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Cadastre as unidades da sua rede de clínicas.
            </p>
            <Button
              className="bg-marketplace hover:bg-marketplace/90"
              onClick={handleAddUnit}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar unidade
            </Button>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
