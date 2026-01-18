import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { SalesStats } from "@/hooks/useSales";

interface SalesChartsProps {
  stats: SalesStats;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export function SalesCharts({ stats }: SalesChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Data for service type chart
  const serviceData = Object.entries(stats.byService)
    .map(([name, data]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      value: data.value,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Data for category pie chart
  const categoryData = Object.entries(stats.byCategory)
    .filter(([name]) => name !== 'Sem categoria' && name !== '-')
    .map(([name, data]) => ({
      name: name.replace('CATEGORIA ', '').substring(0, 15),
      fullName: name,
      value: data.value,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Data for seller performance
  const sellerData = Object.entries(stats.bySeller)
    .filter(([name]) => name !== 'Sem vendedor')
    .map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Data for branch performance
  const branchData = Object.entries(stats.byBranch)
    .filter(([name]) => name !== 'Sem filial')
    .map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Data for monthly evolution
  const monthData = Object.entries(stats.byMonth)
    .map(([month, data]) => ({
      name: month,
      value: data.value,
      count: data.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Data for contract status
  const statusData = Object.entries(stats.byContractStatus)
    .filter(([name]) => name !== 'Sem status')
    .map(([name, count]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{payload[0]?.payload?.fullName || label}</p>
          <p className="text-sm text-muted-foreground">
            Valor: {formatCurrency(payload[0]?.value || 0)}
          </p>
          {payload[0]?.payload?.count && (
            <p className="text-sm text-muted-foreground">
              Quantidade: {payload[0].payload.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* VGV by Service Type */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">VGV por Tipo de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                <YAxis type="category" dataKey="name" className="text-xs" width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Seller Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sellerData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Branch Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">VGV por Filial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Contract Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status dos Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Evolution */}
      {monthData.length > 1 && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evolução Mensal do VGV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
