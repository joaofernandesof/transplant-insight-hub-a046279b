import { useState } from "react";
import { Search, MapPin, Filter, Star, Calendar, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { ProfessionalCard } from "../components/ProfessionalCard";
import { UnitCard } from "../components/UnitCard";
import { useMarketplaceProfessionals, useMarketplaceUnits } from "../hooks/useMarketplace";
import { toast } from "sonner";

export function MarketplaceDiscovery() {
  const { data: professionals } = useMarketplaceProfessionals();
  const { data: units } = useMarketplaceUnits();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [procedure, setProcedure] = useState("");
  const [activeTab, setActiveTab] = useState<"professionals" | "units">("professionals");

  const filteredProfessionals = professionals?.filter((p) => {
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesProcedure = !procedure || p.specialty?.toLowerCase().includes(procedure.toLowerCase());
    return matchesSearch && matchesProcedure;
  });

  const filteredUnits = units?.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !city || u.city?.toLowerCase().includes(city.toLowerCase());
    return matchesSearch && matchesCity;
  });

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Descoberta"
        subtitle="Simulação da área pública para pacientes"
        actions={
          <Badge variant="outline" className="text-marketplace border-marketplace">
            <Eye className="h-3 w-3 mr-1" />
            Modo Preview
          </Badge>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Preview Banner */}
        <Card className="border-dashed border-2 border-marketplace/30 bg-marketplace/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-marketplace/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-marketplace" />
              </div>
              <div>
                <p className="font-medium">Visualização de Simulação</p>
                <p className="text-sm text-muted-foreground">
                  Esta é uma prévia de como os pacientes veriam sua clínica no Marketplace
                  público. Ideal para testar e ajustar perfis antes de expor externamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="border-marketplace-border">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Encontre o especialista ideal
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cidade..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={procedure} onValueChange={setProcedure}>
                <SelectTrigger>
                  <SelectValue placeholder="Procedimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transplante">Transplante Capilar</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="tratamento">Tratamento Clínico</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-marketplace hover:bg-marketplace/90">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="professionals">
              Profissionais
              <Badge variant="secondary" className="ml-2">
                {filteredProfessionals?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="units">
              Unidades
              <Badge variant="secondary" className="ml-2">
                {filteredUnits?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="professionals" className="mt-6">
            {filteredProfessionals && filteredProfessionals.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    onViewProfile={() => toast.info("Ver perfil (simulação)")}
                    onSchedule={() => toast.info("Agendar (simulação)")}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Nenhum profissional encontrado
                </h3>
                <p className="text-muted-foreground">
                  Cadastre profissionais para vê-los aparecer aqui.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="units" className="mt-6">
            {filteredUnits && filteredUnits.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    onViewProfile={() => toast.info("Ver unidade (simulação)")}
                    onSchedule={() => toast.info("Agendar (simulação)")}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Nenhuma unidade encontrada
                </h3>
                <p className="text-muted-foreground">
                  Cadastre unidades para vê-las aparecer aqui.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MarketplaceLayout>
  );
}
