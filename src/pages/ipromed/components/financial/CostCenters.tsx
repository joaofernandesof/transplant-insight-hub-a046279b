/**
 * IPROMED Financial - Centros de Resultado
 * Classificação por área, unidade, sócio e tipo de serviço
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calculator,
  Plus,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Building,
  Briefcase,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface CostCenter {
  id: string;
  name: string;
  type: 'area' | 'partner' | 'unit' | 'service';
  revenue: number;
  expenses: number;
  margin: number;
  cases: number;
}

const mockCostCenters: CostCenter[] = [
  { id: '1', name: 'Consultivo', type: 'area', revenue: 45000, expenses: 12000, margin: 73, cases: 15 },
  { id: '2', name: 'Contencioso', type: 'area', revenue: 35000, expenses: 18000, margin: 49, cases: 8 },
  { id: '3', name: 'Audiências', type: 'service', revenue: 12000, expenses: 4500, margin: 62, cases: 24 },
  { id: '4', name: 'Perícias', type: 'service', revenue: 8000, expenses: 5000, margin: 37, cases: 6 },
  { id: '5', name: 'Correspondentes', type: 'service', revenue: 0, expenses: 8500, margin: -100, cases: 12 },
  { id: '6', name: 'Dra. Larissa', type: 'partner', revenue: 52000, expenses: 15000, margin: 71, cases: 18 },
  { id: '7', name: 'Dra. Caroline', type: 'partner', revenue: 38000, expenses: 12000, margin: 68, cases: 14 },
  { id: '8', name: 'Unidade SP', type: 'unit', revenue: 65000, expenses: 22000, margin: 66, cases: 25 },
];

const typeConfig = {
  area: { label: 'Área do Direito', icon: Scale, color: 'bg-blue-100 text-blue-700' },
  partner: { label: 'Sócio', icon: Users, color: 'bg-purple-100 text-purple-700' },
  unit: { label: 'Unidade', icon: Building, color: 'bg-emerald-100 text-emerald-700' },
  service: { label: 'Serviço', icon: Briefcase, color: 'bg-amber-100 text-amber-700' },
};

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function CostCenters() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredCenters = mockCostCenters.filter(c =>
    selectedType === 'all' || c.type === selectedType
  );

  const stats = {
    totalRevenue: mockCostCenters.reduce((sum, c) => sum + c.revenue, 0),
    totalExpenses: mockCostCenters.reduce((sum, c) => sum + c.expenses, 0),
    avgMargin: Math.round(mockCostCenters.reduce((sum, c) => sum + c.margin, 0) / mockCostCenters.length),
  };

  const pieData = mockCostCenters
    .filter(c => c.type === 'area' && c.revenue > 0)
    .map(c => ({ name: c.name, value: c.revenue }));

  const barData = mockCostCenters
    .filter(c => c.type === 'partner')
    .map(c => ({ name: c.name, receita: c.revenue, despesa: c.expenses }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600" />
            Centros de Resultado
          </h2>
          <p className="text-sm text-muted-foreground">
            Classificação por área do direito, unidade, sócio responsável e tipo de serviço
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Centro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Centro de Resultado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input placeholder="Ex: Trabalhista, Unidade RJ" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <Button key={key} variant="outline" className="justify-start gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button onClick={() => setIsFormOpen(false)}>Criar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Receita Total</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-700">Despesa Total</p>
                <p className="text-2xl font-bold text-rose-800">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Margem Média</p>
                <p className="text-2xl font-bold text-blue-800">{stats.avgMargin}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance por Sócio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#10b981" />
                  <Bar dataKey="despesa" name="Despesa" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={selectedType === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedType('all')}
        >
          Todos
        </Button>
        {Object.entries(typeConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedType === key ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => setSelectedType(key)}
          >
            <config.icon className="h-3 w-3" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Centro</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Receita</TableHead>
                <TableHead className="font-semibold">Despesa</TableHead>
                <TableHead className="font-semibold">Margem</TableHead>
                <TableHead className="font-semibold">Casos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCenters.map(center => {
                const type = typeConfig[center.type];
                
                return (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>
                      <Badge className={type.color}>
                        {type.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {formatCurrency(center.revenue)}
                    </TableCell>
                    <TableCell className="text-rose-600 font-medium">
                      {formatCurrency(center.expenses)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${center.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {center.margin}%
                      </span>
                    </TableCell>
                    <TableCell>{center.cases}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
