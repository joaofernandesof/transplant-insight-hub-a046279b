import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ShoppingCart, Wallet, Receipt } from "lucide-react";
import { SalesStats } from "@/hooks/useSales";

interface SalesKPICardsProps {
  stats: SalesStats;
}

export function SalesKPICards({ stats }: SalesKPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpis = [
    {
      title: "VGV Total",
      value: formatCurrency(stats.totalVgv),
      icon: DollarSign,
      description: "Valor Geral de Vendas",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Sinais Recebidos",
      value: formatCurrency(stats.totalDeposits),
      icon: Wallet,
      description: "Total em entradas",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Saldo a Receber",
      value: formatCurrency(stats.totalBalance),
      icon: Receipt,
      description: "VGV - Sinais",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Total Vendas",
      value: stats.salesCount.toString(),
      icon: ShoppingCart,
      description: "Quantidade de vendas",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.avgTicket),
      icon: TrendingUp,
      description: "Valor médio por venda",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
    },
    {
      title: "Transplantes",
      value: stats.transplantsSold.toString(),
      icon: Users,
      description: "Cirurgias vendidas",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-1.5 rounded-md ${kpi.bgColor}`}>
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
