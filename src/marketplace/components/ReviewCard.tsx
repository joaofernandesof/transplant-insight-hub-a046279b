import { Star, MessageCircle, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MarketplaceReview } from "../types/marketplace";

interface ReviewCardProps {
  review: MarketplaceReview;
  onReply?: () => void;
}

export function ReviewCard({ review, onReply }: ReviewCardProps) {
  const initials = review.patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  return (
    <Card className="border-marketplace-border">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{review.patientName}</p>
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.createdAt), "dd 'de' MMM, yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>

          {review.isPublic && (
            <Badge variant="outline" className="text-marketplace-accent border-marketplace-accent">
              <Check className="h-3 w-3 mr-1" />
              Pública
            </Badge>
          )}
        </div>

        {review.comment && (
          <p className="text-sm text-muted-foreground">{review.comment}</p>
        )}

        {review.reply && (
          <div className="bg-muted/50 rounded-lg p-3 border-l-2 border-marketplace">
            <p className="text-xs text-muted-foreground mb-1">Resposta da clínica</p>
            <p className="text-sm">{review.reply}</p>
          </div>
        )}

        {!review.reply && onReply && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onReply}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Responder avaliação
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
