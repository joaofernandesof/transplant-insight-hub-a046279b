/**
 * Tabelas de preços dos planos CPG - Essencial e Integral (editáveis)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Diamond } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlanRow {
  combination: string;
  structure: string;
  theoreticalValue: string;
  tableValue: string;
  discount: string;
  discountPercent: string;
}

const defaultEssencialRows: PlanRow[] = [
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

const defaultIntegralRows: PlanRow[] = [
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

type PlanField = keyof PlanRow;

function EditableCell({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { setEditing(false); if (local !== value) onChange(local); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { setEditing(false); if (local !== value) onChange(local); }
          if (e.key === "Escape") { setLocal(value); setEditing(false); }
        }}
        className="bg-background border border-primary/30 rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary/30 w-full min-w-[60px]"
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors inline-block ${className || ""}`}
      onClick={() => { setLocal(value); setEditing(true); }}
      title="Clique para editar"
    >
      {value}
    </span>
  );
}

function PlanTable({ title, rows, onRowChange }: { title: string; rows: PlanRow[]; onRowChange: (rowIdx: number, field: PlanField, value: string) => void }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Diamond className="h-3.5 w-3.5 text-primary fill-primary" />
          PLANO {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] text-center min-w-[100px]">Combinação</TableHead>
                <TableHead className="text-[11px] text-center min-w-[90px]">Estrutura</TableHead>
                <TableHead className="text-[11px] text-center min-w-[90px]">Valor Teórico (R$/mês)</TableHead>
                <TableHead className="text-[11px] text-center min-w-[90px]">Valor Tabela (R$/mês)</TableHead>
                <TableHead className="text-[11px] text-center min-w-[80px]">Desconto (R$/mês)</TableHead>
                <TableHead className="text-[11px] text-center min-w-[60px]">Desc. (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="py-1.5 px-2 text-xs text-center">
                    <EditableCell value={row.combination} onChange={(v) => onRowChange(idx, "combination", v)} className="font-medium" />
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-xs text-center">
                    <EditableCell value={row.structure} onChange={(v) => onRowChange(idx, "structure", v)} />
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-xs text-center">
                    <EditableCell value={row.theoreticalValue} onChange={(v) => onRowChange(idx, "theoreticalValue", v)} />
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-xs text-center">
                    <EditableCell value={row.tableValue} onChange={(v) => onRowChange(idx, "tableValue", v)} className="font-semibold" />
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-xs text-center">
                    <EditableCell value={row.discount} onChange={(v) => onRowChange(idx, "discount", v)} />
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-xs text-center">
                    <EditableCell value={row.discountPercent} onChange={(v) => onRowChange(idx, "discountPercent", v)} className="font-medium" />
                  </TableCell>
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
  const isMobile = useIsMobile();
  const [essencialRows, setEssencialRows] = useState<PlanRow[]>(defaultEssencialRows);
  const [integralRows, setIntegralRows] = useState<PlanRow[]>(defaultIntegralRows);

  const handleEssencialChange = (rowIdx: number, field: PlanField, value: string) => {
    setEssencialRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));
  };

  const handleIntegralChange = (rowIdx: number, field: PlanField, value: string) => {
    setIntegralRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));
  };

  return (
    <div className={isMobile ? "space-y-6" : "grid grid-cols-2 gap-4"}>
      <PlanTable title="ESSENCIAL" rows={essencialRows} onRowChange={handleEssencialChange} />
      <PlanTable title="INTEGRAL" rows={integralRows} onRowChange={handleIntegralChange} />
    </div>
  );
}
