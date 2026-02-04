/**
 * IPROMED Financial - Relatórios e Indicadores
 * DRE, aging, relatórios por cliente e comparativos
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

// DRE Data - Formato Contábil Correto
const dreData = {
  // RECEITA BRUTA
  receitaBruta: {
    honorarios: 85000,
    consultas: 12500,
    pareceres: 8000,
    mensalidades: 35000,
    total: 140500,
  },
  // (-) DEDUÇÕES DA RECEITA
  deducoes: {
    impostosSobreServicos: 7025, // ISS ~5%
    pis: 912, // 0.65%
    cofins: 4215, // 3%
    total: 12152,
  },
  // (=) RECEITA LÍQUIDA
  receitaLiquida: 128348,
  
  // (-) CUSTO DOS SERVIÇOS PRESTADOS (CSP)
  custoServicos: {
    correspondentes: 8500,
    peritos: 12000,
    custas: 5500,
    total: 26000,
  },
  // (=) LUCRO BRUTO
  lucroBruto: 102348,
  margemBruta: 72.8, // (lucro bruto / receita bruta) * 100
  
  // (-) DESPESAS OPERACIONAIS
  despesasOperacionais: {
    administrativas: {
      pessoal: 45000,
      aluguel: 4500,
      software: 2500,
      telefone: 800,
      total: 52800,
    },
    comerciais: {
      marketing: 3500,
      comissoes: 2800,
      total: 6300,
    },
    gerais: {
      outros: 4000,
      total: 4000,
    },
    total: 63100,
  },
  
  // (=) EBITDA
  ebitda: 39248,
  margemEbitda: 27.9,
  
  // (-) DEPRECIAÇÃO E AMORTIZAÇÃO
  depreciacaoAmortizacao: 2500,
  
  // (=) EBIT (Lucro Operacional)
  ebit: 36748,
  margemOperacional: 26.1,
  
  // (+/-) RESULTADO FINANCEIRO
  resultadoFinanceiro: {
    receitasFinanceiras: 1200,
    despesasFinanceiras: 3200,
    resultado: -2000,
  },
  
  // (=) RESULTADO ANTES DOS IMPOSTOS (LAIR)
  resultadoAntesImpostos: 34748,
  
  // (-) IMPOSTOS SOBRE O LUCRO
  impostosLucro: {
    irpj: 5212, // ~15%
    csll: 3127, // ~9%
    total: 8339,
  },
  
  // (=) LUCRO LÍQUIDO
  lucroLiquido: 26409,
  margemLiquida: 18.8,
  
  // PRO-LABORE (informativo)
  proLabore: 25000,
};

// Aging data
const agingData = [
  { range: 'A vencer', amount: 42500, count: 8, color: 'bg-emerald-500' },
  { range: '1-7 dias', amount: 3500, count: 2, color: 'bg-amber-400' },
  { range: '8-15 dias', amount: 5200, count: 3, color: 'bg-amber-500' },
  { range: '16-30 dias', amount: 8750, count: 4, color: 'bg-orange-500' },
  { range: '31-60 dias', amount: 4200, count: 2, color: 'bg-rose-500' },
  { range: '+60 dias', amount: 2800, count: 1, color: 'bg-rose-700' },
];

// Monthly comparison
const monthlyData = [
  { month: 'Ago', receitas: 95000, despesas: 78000 },
  { month: 'Set', receitas: 102000, despesas: 85000 },
  { month: 'Out', receitas: 115000, despesas: 92000 },
  { month: 'Nov', receitas: 128000, despesas: 98000 },
  { month: 'Dez', receitas: 145000, despesas: 105000 },
  { month: 'Jan', receitas: 140500, despesas: 110500 },
];

// Client ranking
const clientRanking = [
  { name: 'Hospital XYZ', revenue: 48000, expenses: 12000, profit: 36000, delay: 0 },
  { name: 'Clínica ABC', revenue: 32000, expenses: 8500, profit: 23500, delay: 15 },
  { name: 'Dr. João Silva', revenue: 28000, expenses: 5000, profit: 23000, delay: 0 },
  { name: 'Dra. Maria Santos', revenue: 18500, expenses: 3200, profit: 15300, delay: 7 },
  { name: 'Dr. Carlos Oliveira', revenue: 14000, expenses: 6800, profit: 7200, delay: 30 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function FinancialReports() {
  const [period, setPeriod] = useState('current-month');
  const [activeTab, setActiveTab] = useState('dre');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Relatórios e Indicadores
          </h2>
          <p className="text-sm text-muted-foreground">
            DRE, aging de recebíveis, relatórios por cliente e comparativos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Janeiro/2026</SelectItem>
              <SelectItem value="last-month">Dezembro/2025</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Ano 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        {/* DRE Tab */}
        <TabsContent value="dre" className="mt-6 space-y-6">
          {/* DRE Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
              <CardContent className="p-4">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Receita Bruta</p>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(dreData.receitaBruta.total)}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <p className="text-xs text-blue-700 dark:text-blue-300">EBITDA</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(dreData.ebitda)}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Margem: {dreData.margemEbitda}%</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="p-4">
                <p className="text-xs text-purple-700 dark:text-purple-300">EBIT</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">{formatCurrency(dreData.ebit)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Margem: {dreData.margemOperacional}%</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="p-4">
                <p className="text-xs text-amber-700 dark:text-amber-300">Lucro Líquido</p>
                <p className="text-xl font-bold text-amber-800 dark:text-amber-200">{formatCurrency(dreData.lucroLiquido)}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Margem: {dreData.margemLiquida}%</p>
              </CardContent>
            </Card>
          </div>

          {/* DRE Full Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Demonstração do Resultado do Exercício (DRE)
              </CardTitle>
              <CardDescription>Período: Janeiro/2026</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {/* RECEITA BRUTA */}
                    <tr className="bg-emerald-50 dark:bg-emerald-950/30 font-semibold">
                      <td className="px-4 py-2">RECEITA BRUTA DE SERVIÇOS</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(dreData.receitaBruta.total)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">100%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Honorários Advocatícios</td>
                      <td className="px-4 py-1.5 text-right">{formatCurrency(dreData.receitaBruta.honorarios)}</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">60.5%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Consultas</td>
                      <td className="px-4 py-1.5 text-right">{formatCurrency(dreData.receitaBruta.consultas)}</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">8.9%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Pareceres</td>
                      <td className="px-4 py-1.5 text-right">{formatCurrency(dreData.receitaBruta.pareceres)}</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">5.7%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Mensalidades Jurídicas</td>
                      <td className="px-4 py-1.5 text-right">{formatCurrency(dreData.receitaBruta.mensalidades)}</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">24.9%</td>
                    </tr>
                    
                    {/* DEDUÇÕES */}
                    <tr className="border-t bg-rose-50/50 dark:bg-rose-950/20">
                      <td className="px-4 py-2 font-medium text-rose-700 dark:text-rose-300">(-) DEDUÇÕES DA RECEITA</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(dreData.deducoes.total)})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-8.6%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">ISS sobre Serviços</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.deducoes.impostosSobreServicos)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-5.0%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">PIS</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.deducoes.pis)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-0.65%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">COFINS</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.deducoes.cofins)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-3.0%</td>
                    </tr>
                    
                    {/* RECEITA LÍQUIDA */}
                    <tr className="border-t bg-emerald-100/50 dark:bg-emerald-950/40 font-semibold">
                      <td className="px-4 py-2">(=) RECEITA LÍQUIDA</td>
                      <td className="px-4 py-2 text-right text-emerald-700 dark:text-emerald-300">{formatCurrency(dreData.receitaLiquida)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">91.4%</td>
                    </tr>
                    
                    {/* CSP */}
                    <tr className="border-t bg-rose-50/50 dark:bg-rose-950/20">
                      <td className="px-4 py-2 font-medium text-rose-700 dark:text-rose-300">(-) CUSTO DOS SERVIÇOS PRESTADOS</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(dreData.custoServicos.total)})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-18.5%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Correspondentes</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.custoServicos.correspondentes)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-6.0%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Honorários Periciais</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.custoServicos.peritos)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-8.5%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Custas Processuais</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.custoServicos.custas)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-3.9%</td>
                    </tr>
                    
                    {/* LUCRO BRUTO */}
                    <tr className="border-t bg-emerald-100 dark:bg-emerald-950/50 font-bold">
                      <td className="px-4 py-2">(=) LUCRO BRUTO</td>
                      <td className="px-4 py-2 text-right text-emerald-700 dark:text-emerald-300">{formatCurrency(dreData.lucroBruto)}</td>
                      <td className="px-4 py-2 text-right">{dreData.margemBruta}%</td>
                    </tr>
                    
                    {/* DESPESAS OPERACIONAIS */}
                    <tr className="border-t bg-rose-50/50 dark:bg-rose-950/20">
                      <td className="px-4 py-2 font-medium text-rose-700 dark:text-rose-300">(-) DESPESAS OPERACIONAIS</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(dreData.despesasOperacionais.total)})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-44.9%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Despesas Administrativas</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.despesasOperacionais.administrativas.total)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-37.6%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-12 text-xs text-muted-foreground">Pessoal e Encargos</td>
                      <td className="px-4 py-1.5 text-right text-rose-500 text-xs">({formatCurrency(dreData.despesasOperacionais.administrativas.pessoal)})</td>
                      <td className="px-4 py-1.5"></td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-12 text-xs text-muted-foreground">Aluguel e Condomínio</td>
                      <td className="px-4 py-1.5 text-right text-rose-500 text-xs">({formatCurrency(dreData.despesasOperacionais.administrativas.aluguel)})</td>
                      <td className="px-4 py-1.5"></td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-12 text-xs text-muted-foreground">Software e Tecnologia</td>
                      <td className="px-4 py-1.5 text-right text-rose-500 text-xs">({formatCurrency(dreData.despesasOperacionais.administrativas.software)})</td>
                      <td className="px-4 py-1.5"></td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Despesas Comerciais</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.despesasOperacionais.comerciais.total)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-4.5%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">Despesas Gerais</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.despesasOperacionais.gerais.total)})</td>
                      <td className="px-4 py-1.5 text-right text-muted-foreground">-2.8%</td>
                    </tr>
                    
                    {/* EBITDA */}
                    <tr className="border-t bg-blue-100 dark:bg-blue-950/50 font-bold">
                      <td className="px-4 py-2">(=) EBITDA</td>
                      <td className="px-4 py-2 text-right text-blue-700 dark:text-blue-300">{formatCurrency(dreData.ebitda)}</td>
                      <td className="px-4 py-2 text-right">{dreData.margemEbitda}%</td>
                    </tr>
                    
                    {/* D&A */}
                    <tr className="border-t">
                      <td className="px-4 py-2 text-muted-foreground">(-) Depreciação e Amortização</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(dreData.depreciacaoAmortizacao)})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-1.8%</td>
                    </tr>
                    
                    {/* EBIT */}
                    <tr className="border-t bg-purple-100 dark:bg-purple-950/50 font-bold">
                      <td className="px-4 py-2">(=) EBIT (Lucro Operacional)</td>
                      <td className="px-4 py-2 text-right text-purple-700 dark:text-purple-300">{formatCurrency(dreData.ebit)}</td>
                      <td className="px-4 py-2 text-right">{dreData.margemOperacional}%</td>
                    </tr>
                    
                    {/* RESULTADO FINANCEIRO */}
                    <tr className="border-t">
                      <td className="px-4 py-2 text-muted-foreground">(+) Receitas Financeiras</td>
                      <td className="px-4 py-2 text-right text-emerald-600">{formatCurrency(dreData.resultadoFinanceiro.receitasFinanceiras)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">0.9%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-2 text-muted-foreground">(-) Despesas Financeiras</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(dreData.resultadoFinanceiro.despesasFinanceiras)})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-2.3%</td>
                    </tr>
                    <tr className="border-t bg-muted/50">
                      <td className="px-4 py-2 font-medium">(=) Resultado Financeiro Líquido</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(Math.abs(dreData.resultadoFinanceiro.resultado))})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-1.4%</td>
                    </tr>
                    
                    {/* LAIR */}
                    <tr className="border-t bg-muted">
                      <td className="px-4 py-2 font-semibold">(=) RESULTADO ANTES DOS IMPOSTOS (LAIR)</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCurrency(dreData.resultadoAntesImpostos)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">24.7%</td>
                    </tr>
                    
                    {/* IMPOSTOS */}
                    <tr className="border-t bg-rose-50/50 dark:bg-rose-950/20">
                      <td className="px-4 py-2 font-medium text-rose-700 dark:text-rose-300">(-) IMPOSTOS SOBRE O LUCRO</td>
                      <td className="px-4 py-2 text-right text-rose-600">({formatCurrency(dreData.impostosLucro.total)})</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">-5.9%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">IRPJ</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.impostosLucro.irpj)})</td>
                      <td className="px-4 py-1.5"></td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-1.5 pl-8 text-muted-foreground">CSLL</td>
                      <td className="px-4 py-1.5 text-right text-rose-600">({formatCurrency(dreData.impostosLucro.csll)})</td>
                      <td className="px-4 py-1.5"></td>
                    </tr>
                    
                    {/* LUCRO LÍQUIDO */}
                    <tr className="border-t bg-amber-100 dark:bg-amber-950/50 font-bold text-lg">
                      <td className="px-4 py-3">(=) LUCRO LÍQUIDO DO PERÍODO</td>
                      <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-300">{formatCurrency(dreData.lucroLiquido)}</td>
                      <td className="px-4 py-3 text-right">{dreData.margemLiquida}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Margins Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Margem Bruta</p>
                  <p className="text-lg font-bold text-emerald-600">{dreData.margemBruta}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Margem EBITDA</p>
                  <p className="text-lg font-bold text-blue-600">{dreData.margemEbitda}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Margem Operacional</p>
                  <p className="text-lg font-bold text-purple-600">{dreData.margemOperacional}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Margem Líquida</p>
                  <p className="text-lg font-bold text-amber-600">{dreData.margemLiquida}%</p>
                </div>
              </div>
              
              {/* Pro-Labore Info */}
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Nota:</strong> Pró-labore dos sócios: {formatCurrency(dreData.proLabore)} (incluído nas Despesas Administrativas - Pessoal)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging Tab */}
        <TabsContent value="aging" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aging de Recebíveis</CardTitle>
              <CardDescription>Distribuição de valores por faixa de vencimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agingData.map(item => (
                  <div key={item.range} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{item.range}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`h-6 rounded ${item.color}`}
                          style={{ width: `${(item.amount / 50000) * 100}%`, minWidth: '4px' }}
                        />
                        <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                        <Badge variant="outline" className="text-xs">{item.count} títulos</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ranking por Cliente
              </CardTitle>
              <CardDescription>Quem dá mais lucro, quem atrasa, quem consome mais custo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Receita</TableHead>
                    <TableHead className="font-semibold">Despesa</TableHead>
                    <TableHead className="font-semibold">Lucro</TableHead>
                    <TableHead className="font-semibold">Atraso Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRanking.map((client, idx) => (
                    <TableRow key={client.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-600 font-medium">{formatCurrency(client.revenue)}</TableCell>
                      <TableCell className="text-rose-600">{formatCurrency(client.expenses)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(client.profit)}</TableCell>
                      <TableCell>
                        <Badge className={client.delay === 0 ? 'bg-emerald-100 text-emerald-700' : client.delay <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}>
                          {client.delay === 0 ? 'Em dia' : `${client.delay} dias`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Comparativo Mensal
              </CardTitle>
              <CardDescription>Crescimento e sazonalidade - últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
