import { Star, MapPin, Phone, Users, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketplaceUnit } from "../types/marketplace";

interface UnitCardProps {
  unit: MarketplaceUnit;
  onViewProfile?: () => void;
  onSchedule?: () => void;
}

export function UnitCard({ unit, onViewProfile, onSchedule }: UnitCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-marketplace-border overflow-hidden">
      <CardContent className="p-0">
        {/* Image or placeholder */}
        <div className="h-32 bg-gradient-to-br from-marketplace/20 to-marketplace/5 flex items-center justify-center">
          {unit.imageUrl ? (
            <img
              src={unit.imageUrl}
              alt={unit.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="h-12 w-12 text-marketplace/40" />
          )}
        </div>

        <div className="p-5 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-lg truncate">{unit.name}</h3>
              {unit.isActive && (
                <Badge variant="secondary" className="bg-marketplace-accent/10 text-marketplace-accent shrink-0">
                  Ativa
                </Badge>
              )}
            </div>

            {(unit.city || unit.state) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {unit.city}
                  {unit.city && unit.state && ", "}
                  {unit.state}
                </span>
              </div>
            )}
          </div>

          {unit.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {unit.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {unit.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="font-medium text-foreground">
                  {unit.rating.toFixed(1)}
                </span>
                <span>({unit.reviewCount})</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{unit.professionals.length} profissionais</span>
            </div>
          </div>

          {unit.phone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{unit.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {onViewProfile && (
              <Button variant="outline" className="flex-1" onClick={onViewProfile}>
                Ver unidade
              </Button>
            )}
            {onSchedule && (
              <Button
                className="flex-1 bg-marketplace hover:bg-marketplace/90"
                onClick={onSchedule}
              >
                Agendar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
