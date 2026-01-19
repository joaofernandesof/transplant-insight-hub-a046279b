import { useState } from "react";
import { Star, Filter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { ReviewCard } from "../components/ReviewCard";
import { useMarketplaceReviews } from "../hooks/useMarketplace";
import { toast } from "sonner";

export function MarketplaceReviews() {
  const { data: reviews, isLoading } = useMarketplaceReviews();
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");

  const filteredReviews = reviews?.filter((review) => {
    if (filter === "pending") return !review.reply;
    if (filter === "replied") return !!review.reply;
    return true;
  });

  // Calculate rating distribution
  const ratingDistribution = reviews?.reduce(
    (acc, r) => {
      const rating = Math.round(r.rating);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  const pendingCount = reviews?.filter((r) => !r.reply).length || 0;

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Avaliações"
        subtitle="Monitore e responda às avaliações dos pacientes"
        actions={
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-marketplace-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Avaliação média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-marketplace-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-marketplace/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-marketplace" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reviews?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total de avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-marketplace-border col-span-2">
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-3">Distribuição de notas</p>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs w-8">{rating} ★</span>
                    <Progress
                      value={
                        reviews && reviews.length > 0
                          ? ((ratingDistribution?.[rating] || 0) / reviews.length) * 100
                          : 0
                      }
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8">
                      {ratingDistribution?.[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todas
            <Badge variant="outline" className="ml-2">
              {reviews?.length || 0}
            </Badge>
          </Button>
          <Button
            variant={filter === "pending" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Aguardando resposta
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-marketplace-warning text-white">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "replied" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("replied")}
          >
            Respondidas
          </Button>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredReviews && filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReply={() => toast.info("Responder avaliação em desenvolvimento")}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Avaliações de pacientes aparecerão aqui. Incentive seus pacientes a
              avaliarem a experiência após os procedimentos.
            </p>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
