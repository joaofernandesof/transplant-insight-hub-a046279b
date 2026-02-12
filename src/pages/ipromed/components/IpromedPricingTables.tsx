/**
 * Tabelas de preços dos planos CPG - Essencial e Integral
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Diamond } from "lucide-react";

interface PlanRow {
  combination: string;
  structure: string;
  theoreticalValue: string;
  tableValue: string;
  discount: string;
  discountPercent: string;
}

const essencialRows: PlanRow[] = [
  { combination: "Somente CPF", structure: "1 CPF", theoreticalValue: "990", tableValue: "990", discount: "0", discountPercent: "0%" },
  { combination: "Somente CNPJ", structure: "1 CNPJ", theoreticalValue: "1.590", tableValue: "1.590", discount: "0", discountPercent: "0%" },
  { combination: "1 + 1", structure: "1 CNPJ + 1 CPF", theoreticalValue: "2.580", tableValue: "1.900", discount: "680", discountPercent: "26,36%" },
  { combination: "1 + 2", structure: "1 CNPJ + 2 CPFs", theoreticalValue: "3.570", tableValue: "2.400", discount: "1.170", discountPercent: "32,77%" },
  { combination: "1 + 3", structure: "1 CNPJ + 3 CPFs", theoreticalValue: "4.560", tableValue: "2.900", discount: "1.660", discountPercent: "36,40%" },
  { combination: "2 + 1", structure: "2 CNPJs + 1 CPF", theoreticalValue: "4.170", tableValue: "2.600", discount: "1.570", discountPercent: "37,65%" },
  { combination: "2 + 2", structure: "2 CNPJs + 2 CPFs", theoreticalValue: "5.160", tableValue: "3.100", discount: "2.060", discountPercent: "39,92%" },
  { combination: "2 + 3", structure: "2 CNPJs + 3 CPFs", theoreticalValue: "6.150", tableValue: "3.600", discount: "2.550", discountPercent: "41,46%" },
  { combination: "3 + 1", structure: "3 CNPJs + 1 CPF", theoreticalValue: "5.760", tableValue: "3.200", discount: "2.560", discountPercent: "44,44%" },
  { combination: "3 + 2", structure: "3 CNPJs + 2 CPFs", theoreticalValue: "6.750", tableValue: "3.700", discount: "3.050", discountPercent: "45,19%" },
  { combination: "3 + 3", structure: "3 CNPJs + 3 CPFs", theoreticalValue: "7.740", tableValue: "4.200", discount: "3.540", discountPercent: "45,74%" },
  { combination: "Acima de 3 + 3", structure: "Estrutura personalizada", theoreticalValue: "—", tableValue: "Sob consulta", discount: "—", discountPercent: "—" },
];

const integralRows: PlanRow[] = [
  { combination: "Somente CPF", structure: "1 CPF", theoreticalValue: "1.790", tableValue: "1.790", discount: "0", discountPercent: "0%" },
  { combination: "Somente CNPJ", structure: "1 CNPJ", theoreticalValue: "2.390", tableValue: "2.390", discount: "0", discountPercent: "0%" },
  { combination: "1 + 1", structure: "1 CNPJ + 1 CPF", theoreticalValue: "4.180", tableValue: "2.900", discount: "1.280", discountPercent: "30,62%" },
  { combination: "1 + 2", structure: "1 CNPJ + 2 CPFs", theoreticalValue: "5.970", tableValue: "3.600", discount: "2.370", discountPercent: "39,70%" },
  { combination: "1 + 3", structure: "1 CNPJ + 3 CPFs", theoreticalValue: "7.760", tableValue: "4.300", discount: "3.460", discountPercent: "44,59%" },
  { combination: "2 + 1", structure: "2 CNPJs + 1 CPF", theoreticalValue: "6.570", tableValue: "3.900", discount: "2.670", discountPercent: "40,64%" },
  { combination: "2 + 2", structure: "2 CNPJs + 2 CPFs", theoreticalValue: "8.360", tableValue: "4.600", discount: "3.760", discountPercent: "44,98%" },
  { combination: "2 + 3", structure: "2 CNPJs + 3 CPFs", theoreticalValue: "10.150", tableValue: "5.300", discount: "4.850", discountPercent: "47,78%" },
  { combination: "3 + 1", structure: "3 CNPJs + 1 CPF", theoreticalValue: "8.960", tableValue: "4.700", discount: "4.260", discountPercent: "47,54%" },
  { combination: "3 + 2", structure: "3 CNPJs + 2 CPFs", theoreticalValue: "10.750", tableValue: "5.400", discount: "5.350", discountPercent: "49,77%" },
  { combination: "3 + 3", structure: "3 CNPJs + 3 CPFs", theoreticalValue: "12.540", tableValue: "6.100", discount: "6.440", discountPercent: "51,35%" },
  { combination: "Acima de 3 + 3", structure: "Estrutura personalizada", theoreticalValue: "—", tableValue: "Sob consulta", discount: "—", discountPercent: "—" },
];

function PlanTable({ title, rows }: { title: string; rows: PlanRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Diamond className="h-4 w-4 text-primary fill-primary" />
          PLANO {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Combinação (CNPJ + CPF)</TableHead>
                <TableHead className="min-w-[140px]">Estrutura</TableHead>
                <TableHead className="min-w-[160px]">Valor Teórico Sem Desconto (R$ / mês)</TableHead>
                <TableHead className="min-w-[140px]">Valor Total Tabela (R$ / mês)</TableHead>
                <TableHead className="min-w-[140px]">Desconto Total (R$ / mês)</TableHead>
                <TableHead className="min-w-[100px]">Desconto (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.combination}</TableCell>
                  <TableCell>{row.structure}</TableCell>
                  <TableCell>{row.theoreticalValue === "—" ? "—" : `${row.theoreticalValue} / mês`}</TableCell>
                  <TableCell className="font-semibold">{row.tableValue === "Sob consulta" ? "Sob consulta" : `${row.tableValue} / mês`}</TableCell>
                  <TableCell>{row.discount === "—" ? "—" : `${row.discount} / mês`}</TableCell>
                  <TableCell className="font-medium">{row.discountPercent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function IpromedPricingTables() {
  return (
    <div className="space-y-6">
      <PlanTable title="ESSENCIAL" rows={essencialRows} />
      <PlanTable title="INTEGRAL" rows={integralRows} />
    </div>
  );
}
