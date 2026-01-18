import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSales, SaleInsert } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SalesImportDialogProps {
  trigger?: React.ReactNode;
}

interface ImportedRow {
  "Data Venda"?: string | number;
  "Nome Paciente"?: string;
  "Serviço"?: string;
  "Categoria"?: string;
  "Filial"?: string;
  "Vendedor"?: string;
  "VGV"?: number | string;
  "Entrada"?: number | string;
  "Status Contrato"?: string;
  "Origem"?: string;
  "Grau Calvície"?: string;
  "Prontuário"?: string;
  "Email"?: string;
  "CPF"?: string;
  "Observações"?: string;
}

export function SalesImportDialog({ trigger }: SalesImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { createSale } = useSales();

  const downloadTemplate = () => {
    const templateData = [
      {
        "Data Venda": "2025-01-15",
        "Nome Paciente": "João Silva",
        "Serviço": "Transplante Capilar",
        "Categoria": "CATEGORIA A - TRANSPLANTE (DR HYGOR)",
        "Filial": "Brasília",
        "Vendedor": "Alessandro",
        "VGV": 15000,
        "Entrada": 5000,
        "Status Contrato": "Aprovado",
        "Origem": "Instagram",
        "Grau Calvície": "4",
        "Prontuário": "001234",
        "Email": "joao@email.com",
        "CPF": "123.456.789-00",
        "Observações": "Cliente VIP",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");

    // Set column widths
    ws["!cols"] = [
      { wch: 12 }, // Data
      { wch: 25 }, // Nome
      { wch: 20 }, // Serviço
      { wch: 40 }, // Categoria
      { wch: 12 }, // Filial
      { wch: 15 }, // Vendedor
      { wch: 12 }, // VGV
      { wch: 12 }, // Entrada
      { wch: 20 }, // Status
      { wch: 12 }, // Origem
      { wch: 12 }, // Grau
      { wch: 12 }, // Prontuário
      { wch: 25 }, // Email
      { wch: 15 }, // CPF
      { wch: 30 }, // Observações
    ];

    XLSX.writeFile(wb, "modelo_importacao_vendas.xlsx");
    toast.success("Modelo baixado com sucesso!");
  };

  const parseExcelDate = (value: string | number | undefined): string => {
    if (!value) return format(new Date(), "yyyy-MM-dd");
    
    if (typeof value === "number") {
      // Excel serial date
      const date = new Date((value - 25569) * 86400 * 1000);
      return format(date, "yyyy-MM-dd");
    }
    
    // Try to parse string date
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, "yyyy-MM-dd");
    }
    
    return format(new Date(), "yyyy-MM-dd");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setPreview([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<ImportedRow>(sheet);

      if (data.length === 0) {
        setErrors(["A planilha está vazia"]);
        return;
      }

      // Validate required fields
      const validationErrors: string[] = [];
      data.forEach((row, index) => {
        if (!row["Nome Paciente"]) {
          validationErrors.push(`Linha ${index + 2}: Nome do paciente é obrigatório`);
        }
        if (!row["Serviço"]) {
          validationErrors.push(`Linha ${index + 2}: Serviço é obrigatório`);
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors.slice(0, 5));
        if (validationErrors.length > 5) {
          setErrors([...validationErrors.slice(0, 5), `... e mais ${validationErrors.length - 5} erros`]);
        }
        return;
      }

      setPreview(data.slice(0, 5));
      
      // Store full data for import
      (window as any).__importData = data;
      
    } catch (error) {
      setErrors(["Erro ao ler o arquivo. Verifique se é um arquivo Excel válido."]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!user) return;
    
    const data = (window as any).__importData as ImportedRow[];
    if (!data || data.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of data) {
        try {
          const saleDate = parseExcelDate(row["Data Venda"]);
          const monthYear = saleDate.substring(0, 7);
          
          const vgv = typeof row["VGV"] === "string" 
            ? parseFloat(row["VGV"].replace(/[^\d.,]/g, "").replace(",", ".")) 
            : (row["VGV"] || 0);
          
          const deposit = typeof row["Entrada"] === "string"
            ? parseFloat(row["Entrada"].replace(/[^\d.,]/g, "").replace(",", "."))
            : (row["Entrada"] || 0);

          const saleData: SaleInsert = {
            user_id: user.id,
            patient_name: row["Nome Paciente"] || "Sem nome",
            sale_date: saleDate,
            month_year: monthYear,
            service_type: row["Serviço"] || "Não especificado",
            vgv_initial: vgv,
            deposit_paid: deposit,
            category: row["Categoria"] || null,
            branch: row["Filial"] || null,
            sold_by: row["Vendedor"] || null,
            patient_origin: row["Origem"] || null,
            contract_status: row["Status Contrato"] || null,
            baldness_grade: row["Grau Calvície"] || null,
            patient_email: row["Email"] || null,
            patient_cpf: row["CPF"] || null,
            medical_record: row["Prontuário"] || null,
            observations: row["Observações"] || null,
          };

          await createSale.mutateAsync(saleData);
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`Importação concluída: ${successCount} vendas importadas${errorCount > 0 ? `, ${errorCount} erros` : ""}`);
      setOpen(false);
      setPreview([]);
      delete (window as any).__importData;
      
    } catch (error) {
      toast.error("Erro durante a importação");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Planilha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Vendas via Planilha</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel (.xlsx) seguindo o modelo padrão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <FileSpreadsheet className="h-10 w-10 text-green-600" />
            <div className="flex-1">
              <h4 className="font-medium">Modelo de Planilha</h4>
              <p className="text-sm text-muted-foreground">
                Baixe o modelo para garantir que seus dados estejam no formato correto.
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Arquivo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {(window as any).__importData?.length || preview.length} vendas prontas para importar
                </span>
              </div>
              
              <div className="rounded-md border overflow-x-auto">
                <table className="text-xs w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 py-1 text-left">Paciente</th>
                      <th className="px-2 py-1 text-left">Serviço</th>
                      <th className="px-2 py-1 text-left">Filial</th>
                      <th className="px-2 py-1 text-right">VGV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{row["Nome Paciente"]}</td>
                        <td className="px-2 py-1">{row["Serviço"]}</td>
                        <td className="px-2 py-1">{row["Filial"] || "-"}</td>
                        <td className="px-2 py-1 text-right">
                          {typeof row["VGV"] === "number" 
                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(row["VGV"])
                            : row["VGV"] || "-"
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {(window as any).__importData?.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Mostrando 5 de {(window as any).__importData.length} registros
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={preview.length === 0 || importing}
            >
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Importar Vendas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
