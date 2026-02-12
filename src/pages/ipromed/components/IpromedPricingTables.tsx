/**
 * Tabelas de preços dos planos CPG - Essencial e Integral (editáveis)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldCheck, Crown, FileText, ClipboardList, CalendarCheck, Camera, FolderOpen, Lock, MonitorSmartphone, Ban, XCircle, Pen, Stethoscope, Heart, ScrollText } from "lucide-react";
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

function PlanTable({ title, rows, onRowChange, variant }: { title: string; rows: PlanRow[]; onRowChange: (rowIdx: number, field: PlanField, value: string) => void; variant: 'essencial' | 'integral' }) {
  const isIntegral = variant === 'integral';
  const IconComp = isIntegral ? ShieldCheck : Shield;
  const headerBg = isIntegral ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-blue-50 dark:bg-blue-950/40';
  const headerBorder = isIntegral ? 'border-emerald-200 dark:border-emerald-800' : 'border-blue-200 dark:border-blue-800';
  const iconBg = isIntegral ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
  const titleColor = isIntegral ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300';
  const subtitleText = isIntegral ? 'Proteção completa' : 'Proteção fundamental';

  return (
    <Card className={`min-w-0 border-2 ${headerBorder} relative overflow-hidden`}>
      {isIntegral && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-10">
          <Crown className="h-3 w-3" /> Mais completo
        </div>
      )}
      <CardHeader className={`pb-3 ${headerBg} border-b ${headerBorder}`}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <IconComp className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className={`text-lg font-bold ${titleColor}`}>
              {title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitleText}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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

  const documents = [
    { icon: FileText, label: "Contrato de Prestação de Serviços" },
    { icon: ClipboardList, label: "Formulário de Anamnese Guiado" },
    { icon: CalendarCheck, label: "Política de Agendamento" },
    { icon: Camera, label: "Termo de Uso de Imagem" },
    { icon: FolderOpen, label: "Política de Prontuário" },
    { icon: Lock, label: "Termo de Sigilo" },
    { icon: MonitorSmartphone, label: "TCLE para Teleconsulta" },
    { icon: Ban, label: "Termo de Recusa de Tratamento" },
    { icon: XCircle, label: "Notificação de Renúncia" },
    { icon: Pen, label: "Orientação Pré-Procedimento" },
    { icon: Stethoscope, label: "Orientação Pós-Procedimento" },
    { icon: ScrollText, label: "TCLEs Específicos por Procedimento" },
  ];

  return (
    <div className="space-y-6">
      <div className={isMobile ? "space-y-6" : "grid grid-cols-2 gap-4"}>
        <PlanTable title="Essencial" rows={essencialRows} onRowChange={handleEssencialChange} variant="essencial" />
        <PlanTable title="Integral" rows={integralRows} onRowChange={handleIntegralChange} variant="integral" />
      </div>

      {/* Documentação Jurídica Preventiva */}
      <Card className="border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 pb-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-amber-700 dark:text-amber-300">
                Documentação Jurídica Preventiva
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Todos os documentos personalizados entregues ao médico</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {documents.map((doc, idx) => {
              const Icon = doc.icon;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border text-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">{doc.label}</span>
                </div>
              );
            })}
          </div>

          {/* Valores */}
          <div className={`grid gap-3 mt-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Valor de Mercado</p>
              <p className="text-xl font-bold text-red-500 line-through">R$ 15.200</p>
            </div>
            <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Seu Investimento</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground line-through">R$ 4.900</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$ 3.900</span>
              </div>
            </div>
            <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Você Economiza</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$ 11.300</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
