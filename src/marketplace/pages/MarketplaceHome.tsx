import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Calendar,
  Flame,
  Star,
  Megaphone,
  BarChart3,
  Search,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { MetricCard } from "../components/MetricCard";
import { AIConversionAgent } from "../components/AIConversionAgent";
import { useMarketplaceMetrics } from "../hooks/useMarketplace";

const quickAccessItems = [
  {
    id: "professionals",
    title: "Profissionais",
    description: "Gerencie a equipe médica",
    icon: Users,
    route: "/marketplace/professionals",
    color: "text-marketplace",
    bgColor: "bg-marketplace/10",
  },
  {
    id: "units",
    title: "Unidades",
    description: "Administre suas clínicas",
    icon: Building2,
    route: "/marketplace/units",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: "schedule",
    title: "Agenda",
    description: "Visualize agendamentos",
    icon: Calendar,
    route: "/marketplace/schedule",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "leads",
    title: "Leads",
    description: "Pipeline de conversão",
    icon: Flame,
    route: "/marketplace/leads",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: "reviews",
    title: "Avaliações",
    description: "Monitore a reputação",
    icon: Star,
    route: "/marketplace/reviews",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "campaigns",
    title: "Campanhas",
    description: "Comunicação com pacientes",
    icon: Megaphone,
    route: "/marketplace/campaigns",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Métricas e analytics",
    icon: BarChart3,
    route: "/marketplace/dashboard",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    id: "discovery",
    title: "Descoberta",
    description: "Simulação da área pública",
    icon: Search,
    route: "/marketplace/discovery",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
];

export function MarketplaceHome() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useMarketplaceMetrics();

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Marketplace IBRAMEC"
        subtitle="Atração e Conversão de Pacientes"
        showBack={true}
        backTo="/home"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* AI Agent Banner */}
        <AIConversionAgent />

        {/* Quick Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Leads do Mês"
            value={metrics?.newLeadsThisMonth || 0}
            icon={<UserPlus className="h-5 w-5" />}
            trend={{ value: 12 }}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${(metrics?.conversionRate || 0).toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 5 }}
          />
          <MetricCard
            title="Agendamentos"
            value={metrics?.appointmentsThisMonth || 0}
            icon={<Calendar className="h-5 w-5" />}
            trend={{ value: 8 }}
          />
          <MetricCard
            title="Avaliação Média"
            value={`${(metrics?.averageRating || 0).toFixed(1)}`}
            subtitle="de 5.0"
            icon={<Star className="h-5 w-5" />}
          />
        </section>

        {/* Quick Access Grid */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickAccessItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-marketplace-border group"
                onClick={() => navigate(item.route)}
              >
                <CardContent className="p-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card className="border-marketplace-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Leads Recentes</h3>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-marketplace/10"
                  onClick={() => navigate("/marketplace/leads")}
                >
                  Ver todos
                </Badge>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Nenhum lead recente.
                    <br />
                    <span className="text-marketplace cursor-pointer hover:underline">
                      Configure seu perfil
                    </span>{" "}
                    para atrair pacientes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-marketplace-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Performance</h3>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-marketplace/10"
                  onClick={() => navigate("/marketplace/dashboard")}
                >
                  Dashboard
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Leads por fonte
                  </span>
                </div>

                {metrics?.leadsBySource && metrics.leadsBySource.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.leadsBySource.slice(0, 4).map((item) => (
                      <div key={item.source} className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-marketplace rounded-full"
                            style={{
                              width: `${(item.count / metrics.totalLeads) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {item.source}: {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Dados serão exibidos conforme os leads chegarem
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MarketplaceLayout>
  );
}
