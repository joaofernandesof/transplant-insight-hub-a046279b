import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  Calendar,
  Star,
  Flame,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { MetricCard } from "../components/MetricCard";
import { useMarketplaceMetrics } from "../hooks/useMarketplace";

const COLORS = ["#007AFF", "#4ADE80", "#F59E0B", "#EF4444", "#8B5CF6"];

const mockLeadsOverTime = [
  { month: "Jan", leads: 12, conversions: 4 },
  { month: "Fev", leads: 19, conversions: 6 },
  { month: "Mar", leads: 15, conversions: 5 },
  { month: "Abr", leads: 25, conversions: 9 },
  { month: "Mai", leads: 32, conversions: 12 },
  { month: "Jun", leads: 28, conversions: 10 },
];

const mockSourceData = [
  { name: "Marketplace", value: 45 },
  { name: "Indicação", value: 25 },
  { name: "Direto", value: 20 },
  { name: "Redes Sociais", value: 10 },
];

const mockConversionFunnel = [
  { stage: "Novos", count: 100, percentage: 100 },
  { stage: "Contatados", count: 72, percentage: 72 },
  { stage: "Agendados", count: 45, percentage: 45 },
  { stage: "Convertidos", count: 28, percentage: 28 },
];

export function MarketplaceDashboard() {
  const { data: metrics, isLoading } = useMarketplaceMetrics();

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Dashboard"
        subtitle="Métricas e análise de performance"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Leads"
            value={metrics?.totalLeads || 0}
            icon={<Flame className="h-5 w-5" />}
            trend={{ value: 15 }}
            variant="primary"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${(metrics?.conversionRate || 0).toFixed(1)}%`}
            icon={<Target className="h-5 w-5" />}
            trend={{ value: 3 }}
          />
          <MetricCard
            title="Agendamentos"
            value={metrics?.totalAppointments || 0}
            icon={<Calendar className="h-5 w-5" />}
            trend={{ value: 8 }}
          />
          <MetricCard
            title="Avaliação Média"
            value={(metrics?.averageRating || 4.5).toFixed(1)}
            subtitle="de 5.0"
            icon={<Star className="h-5 w-5" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leads Over Time */}
          <Card className="border-marketplace-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Evolução de Leads
                <Badge variant="outline" className="font-normal">
                  Últimos 6 meses
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockLeadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="hsl(211, 100%, 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(211, 100%, 50%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Conversões"
                    stroke="hsl(142, 76%, 58%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 76%, 58%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Source Distribution */}
          <Card className="border-marketplace-border">
            <CardHeader>
              <CardTitle className="text-base">Origem dos Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mockSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mockSourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="border-marketplace-border">
          <CardHeader>
            <CardTitle className="text-base">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {mockConversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="text-center">
                  <div
                    className="mx-auto mb-2 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      width: `${60 + stage.percentage * 0.4}%`,
                      height: "80px",
                      backgroundColor: COLORS[index],
                      opacity: 0.1 + stage.percentage / 150,
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: COLORS[index] }}
                    >
                      {stage.count}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{stage.stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {stage.percentage}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-marketplace-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Leads este mês
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics?.newLeadsThisMonth || 0}
                  </p>
                </div>
                <div className="flex items-center text-marketplace-accent">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-medium">+12%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-marketplace-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Agendamentos este mês
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics?.appointmentsThisMonth || 0}
                  </p>
                </div>
                <div className="flex items-center text-marketplace-accent">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-medium">+8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-marketplace-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avaliações este mês
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics?.reviewsThisMonth || 0}
                  </p>
                </div>
                <div className="flex items-center text-marketplace-accent">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-medium">+5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-marketplace-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tempo médio de resposta
                  </p>
                  <p className="text-2xl font-bold">2.4h</p>
                </div>
                <div className="flex items-center text-marketplace-error">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="text-sm font-medium">-15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
