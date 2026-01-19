import { Star, Calendar, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketplaceProfessional } from "../types/marketplace";

interface ProfessionalCardProps {
  professional: MarketplaceProfessional;
  onViewProfile?: () => void;
  onSchedule?: () => void;
  variant?: "compact" | "full";
}

export function ProfessionalCard({
  professional,
  onViewProfile,
  onSchedule,
  variant = "full",
}: ProfessionalCardProps) {
  const initials = professional.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow border-marketplace-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-marketplace/20">
              <AvatarImage src={professional.avatarUrl} />
              <AvatarFallback className="bg-marketplace/10 text-marketplace">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{professional.fullName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {professional.specialty || "Especialista"}
              </p>
            </div>
            {professional.rating && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{professional.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-marketplace-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header with gradient */}
        <div className="h-16 bg-gradient-to-r from-marketplace to-marketplace/80" />
        
        {/* Content */}
        <div className="px-5 pb-5 -mt-8">
          <Avatar className="h-16 w-16 ring-4 ring-card shadow-md">
            <AvatarImage src={professional.avatarUrl} />
            <AvatarFallback className="bg-marketplace/10 text-marketplace text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="mt-3 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">{professional.fullName}</h3>
              <p className="text-sm text-muted-foreground">
                CRM: {professional.crm}
                {professional.crmState && ` / ${professional.crmState}`}
                {professional.rqe && ` | RQE: ${professional.rqe}`}
              </p>
            </div>

            {professional.specialty && (
              <Badge variant="secondary" className="bg-marketplace/10 text-marketplace">
                {professional.specialty}
              </Badge>
            )}

            {professional.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {professional.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {professional.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium text-foreground">
                    {professional.rating.toFixed(1)}
                  </span>
                  <span>({professional.reviewCount} avaliações)</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{professional.consultationDuration} min</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {onViewProfile && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onViewProfile}
                >
                  Ver perfil
                </Button>
              )}
              {onSchedule && (
                <Button
                  className="flex-1 bg-marketplace hover:bg-marketplace/90"
                  onClick={onSchedule}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
