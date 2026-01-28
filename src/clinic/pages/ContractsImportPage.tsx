import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Users, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ParsedRow {
  rowIndex: number;
  dataVenda: string;
  paciente: string;
  procedimento: string;
  categoria: string;
  grau: string;
  filial: string;
  consultor: string;
  vendedor: string;
  origemPaciente: string;
  observacaoOrigem: string;
  vgv: number;
  sinalPago: number;
  valorPermuta: number;
  situacaoContrato: string;
  dataDistrato: string;
  fezCirurgia: boolean;
  assinouTermoSinal: boolean;
  definidoDataCirurgia: boolean;
  definidoPagamentos: boolean;
  monday: boolean;
  contaAzul: boolean;
  agenda: boolean;
  shosp: boolean;
  observacoes: string;
  chave: string;
  isValid: boolean;
  errors: string[];
}

interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uniquePatients: number;
  uniqueContracts: number;
  byBranch: Record<string, number>;
  byService: Record<string, number>;
}

export default function ContractsImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number; errors: number } | null>(null);

  const parseMoneyValue = (value: string | number | null | undefined): number => {
    if (!value) return 0;
    const str = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const parseBoolean = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const upper = String(value).toUpperCase().trim();
    return upper === 'SIM' || upper === 'OK' || upper === 'TRUE' || upper === '1';
  };

  const parseDate = (value: string | number | null | undefined): string => {
    if (!value) return '';
    
    // Handle Excel serial date numbers
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      return date.toISOString().split('T')[0];
    }
    
    const str = String(value).trim();
    
    // DD/MM/YYYY format
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return str;
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setParsedData([]);
    setSummary(null);
    setImportResult(null);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      // Find header row (first row with data)
      const headerRow = jsonData[0] as string[];
      
      // Map column indices
      const colIndex: Record<string, number> = {};
      headerRow.forEach((header, idx) => {
        const key = String(header).toUpperCase().trim();
        if (key.includes('DATA VENDA')) colIndex.dataVenda = idx;
        if (key === 'PACIENTE') colIndex.paciente = idx;
        if (key === 'PROCEDIMENTO') colIndex.procedimento = idx;
        if (key === 'CATEGORIA') colIndex.categoria = idx;
        if (key.includes('GRAU')) colIndex.grau = idx;
        if (key === 'FILIAL') colIndex.filial = idx;
        if (key.includes('CONSULTOU')) colIndex.consultor = idx;
        if (key.includes('VENDEU')) colIndex.vendedor = idx;
        if (key === 'ORIGEM PACIENTE') colIndex.origem = idx;
        if (key.includes('OBSERVAÇÃO ORIGEM')) colIndex.observacaoOrigem = idx;
        if (key === 'VGV INICIAL') colIndex.vgv = idx;
        if (key === 'SINAL PAGO') colIndex.sinal = idx;
        if (key === 'VALOR PERMUTA') colIndex.permuta = idx;
        if (key.includes('SITUAÇÃO CONTRATO')) colIndex.situacao = idx;
        if (key.includes('DATA DO DISTRATO')) colIndex.distrato = idx;
        if (key.includes('FEZ CIRURGIA')) colIndex.fezCirurgia = idx;
        if (key.includes('TERMO DE SINAL')) colIndex.termoSinal = idx;
        if (key.includes('DATA DO TRANSPLANTE')) colIndex.dataTransplante = idx;
        if (key.includes('PAGAMENTOS MENSAIS')) colIndex.pagamentos = idx;
        if (key.includes('MONDAY')) colIndex.monday = idx;
        if (key.includes('CONTA AZUL')) colIndex.contaAzul = idx;
        if (key.includes('AGENDA')) colIndex.agenda = idx;
        if (key.includes('SHOSP')) colIndex.shosp = idx;
        if (key === 'OBSERVAÇÕES') colIndex.observacoes = idx;
        if (key === 'CHAVE') colIndex.chave = idx;
      });

      // Parse data rows
      const rows: ParsedRow[] = [];
      const uniquePatients = new Set<string>();
      const uniqueContracts = new Set<string>();
      const byBranch: Record<string, number> = {};
      const byService: Record<string, number> = {};

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        const paciente = String(row[colIndex.paciente] || '').trim();
        if (!paciente) continue; // Skip empty rows

        const procedimento = String(row[colIndex.procedimento] || '').trim();
        const filial = String(row[colIndex.filial] || '').trim();
        const chave = String(row[colIndex.chave] || `${paciente}-${procedimento}-${i}`).trim();
        const vgv = parseMoneyValue(row[colIndex.vgv]);
        const dataVenda = parseDate(row[colIndex.dataVenda]);

        const errors: string[] = [];
        if (!paciente) errors.push('Nome do paciente obrigatório');
        if (!procedimento) errors.push('Procedimento obrigatório');
        if (!filial) errors.push('Filial obrigatória');
        if (!dataVenda) errors.push('Data de venda inválida');

        const parsed: ParsedRow = {
          rowIndex: i + 1,
          dataVenda,
          paciente,
          procedimento,
          categoria: String(row[colIndex.categoria] || '').trim(),
          grau: String(row[colIndex.grau] || '').trim(),
          filial,
          consultor: String(row[colIndex.consultor] || '').trim(),
          vendedor: String(row[colIndex.vendedor] || '').trim(),
          origemPaciente: String(row[colIndex.origem] || '').trim(),
          observacaoOrigem: String(row[colIndex.observacaoOrigem] || '').trim(),
          vgv,
          sinalPago: parseMoneyValue(row[colIndex.sinal]),
          valorPermuta: parseMoneyValue(row[colIndex.permuta]),
          situacaoContrato: String(row[colIndex.situacao] || '').trim(),
          dataDistrato: parseDate(row[colIndex.distrato]),
          fezCirurgia: parseBoolean(row[colIndex.fezCirurgia]),
          assinouTermoSinal: parseBoolean(row[colIndex.termoSinal]),
          definidoDataCirurgia: parseBoolean(row[colIndex.dataTransplante]),
          definidoPagamentos: parseBoolean(row[colIndex.pagamentos]),
          monday: parseBoolean(row[colIndex.monday]),
          contaAzul: parseBoolean(row[colIndex.contaAzul]),
          agenda: parseBoolean(row[colIndex.agenda]),
          shosp: parseBoolean(row[colIndex.shosp]),
          observacoes: String(row[colIndex.observacoes] || '').trim(),
          chave,
          isValid: errors.length === 0,
          errors,
        };

        rows.push(parsed);
        
        if (parsed.isValid) {
          uniquePatients.add(paciente.toUpperCase());
          uniqueContracts.add(chave);
          byBranch[filial] = (byBranch[filial] || 0) + 1;
          byService[procedimento] = (byService[procedimento] || 0) + 1;
        }
      }

      setParsedData(rows);
      setSummary({
        totalRows: rows.length,
        validRows: rows.filter(r => r.isValid).length,
        invalidRows: rows.filter(r => !r.isValid).length,
        uniquePatients: uniquePatients.size,
        uniqueContracts: uniqueContracts.size,
        byBranch,
        byService,
      });

      toast.success(`Arquivo processado: ${rows.length} linhas encontradas`);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo Excel');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleImport = async () => {
    if (!parsedData.length) return;

    setIsImporting(true);
    setImportProgress(0);

    const validRows = parsedData.filter(r => r.isValid);
    const batchSize = 50;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    try {
      // First, get existing patients for matching
      const { data: existingPatients } = await supabase
        .from('clinic_patients')
        .select('id, full_name');

      const patientMap = new Map<string, string>();
      (existingPatients || []).forEach(p => {
        patientMap.set(p.full_name.toUpperCase().trim(), p.id);
      });

      // Process in batches
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            // Find or create patient
            let patientId = patientMap.get(row.paciente.toUpperCase().trim());
            
            if (!patientId) {
              // Create new patient
              const { data: newPatient, error: patientError } = await supabase
                .from('clinic_patients')
                .insert({ full_name: row.paciente })
                .select('id')
                .single();

              if (patientError) throw patientError;
              patientId = newPatient.id;
              patientMap.set(row.paciente.toUpperCase().trim(), patientId);
            }

            // Check if contract already exists
            const { data: existingContract } = await supabase
              .from('clinic_contracts')
              .select('id')
              .eq('contract_number', row.chave)
              .maybeSingle();

            const contractData = {
              contract_number: row.chave,
              patient_id: patientId,
              sale_date: row.dataVenda,
              branch: row.filial,
              category: row.categoria || null,
              consultant: row.consultor || null,
              seller: row.vendedor || null,
              lead_source: row.origemPaciente || null,
              lead_source_detail: row.observacaoOrigem || null,
              vgv: row.vgv,
              down_payment: row.sinalPago,
              swap_value: row.valorPermuta,
              contract_status: row.situacaoContrato || 'ativo',
              distrato_date: row.dataDistrato || null,
              surgery_done: row.fezCirurgia,
              signal_term_signed: row.assinouTermoSinal,
              surgery_date_defined: row.definidoDataCirurgia,
              monthly_payments_defined: row.definidoPagamentos,
              registered_monday: row.monday,
              registered_conta_azul: row.contaAzul,
              registered_agenda: row.agenda,
              registered_shosp: row.shosp,
              observations: row.observacoes || null,
            };

            if (existingContract) {
              // Update existing
              await supabase
                .from('clinic_contracts')
                .update(contractData)
                .eq('id', existingContract.id);
              updated++;
            } else {
              // Insert new contract
              const { data: newContract, error: contractError } = await supabase
                .from('clinic_contracts')
                .insert(contractData)
                .select('id')
                .single();

              if (contractError) throw contractError;

              // Insert service
              if (row.procedimento) {
                await supabase
                  .from('clinic_contract_services')
                  .insert({
                    contract_id: newContract.id,
                    service_type: row.procedimento,
                    baldness_grade: row.grau || null,
                    unit_price: row.vgv,
                  });
              }
              inserted++;
            }
          } catch (error) {
            console.error('Error processing row:', row.rowIndex, error);
            errors++;
          }
        }

        setImportProgress(Math.round(((i + batch.length) / validRows.length) * 100));
      }

      // Log the import
      await supabase.from('import_logs').insert({
        import_type: 'contracts',
        file_name: file?.name,
        total_rows: validRows.length,
        inserted_count: inserted,
        updated_count: updated,
        error_count: errors,
      });

      setImportResult({ inserted, updated, errors });
      toast.success(`Importação concluída! ${inserted} novos, ${updated} atualizados`);
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importação de Contratos</h1>
          <p className="text-muted-foreground">
            Importe contratos em massa a partir de planilhas Excel
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Arquivo Excel
          </CardTitle>
          <CardDescription>
            Selecione um arquivo .xlsx ou .xls com os dados dos contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isParsing || isImporting}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isParsing ? (
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {file ? file.name : 'Clique para selecionar ou arraste o arquivo aqui'}
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{summary.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total de Linhas</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{summary.validRows}</div>
                <div className="text-sm text-muted-foreground">Linhas Válidas</div>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{summary.invalidRows}</div>
                <div className="text-sm text-muted-foreground">Com Erros</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-secondary-foreground">{summary.uniquePatients}</div>
                <div className="text-sm text-muted-foreground">Pacientes Únicos</div>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <div className="text-2xl font-bold text-accent-foreground">{summary.uniqueContracts}</div>
                <div className="text-sm text-muted-foreground">Contratos Únicos</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Por Filial</h4>
                <div className="space-y-1">
                  {Object.entries(summary.byBranch).map(([branch, count]) => (
                    <div key={branch} className="flex justify-between text-sm">
                      <span>{branch}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Por Serviço</h4>
                <div className="space-y-1">
                  {Object.entries(summary.byService).slice(0, 10).map(([service, count]) => (
                    <div key={service} className="flex justify-between text-sm">
                      <span className="truncate mr-2">{service}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview dos Dados</CardTitle>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || summary?.validRows === 0}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando... {importProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar {summary?.validRows || 0} Contratos
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isImporting && (
              <Progress value={importProgress} className="mb-4" />
            )}

            {importResult && (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Importação concluída: <strong>{importResult.inserted}</strong> novos contratos, 
                  <strong> {importResult.updated}</strong> atualizados, 
                  <strong> {importResult.errors}</strong> erros
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Data Venda</TableHead>
                    <TableHead className="text-right">VGV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 100).map((row) => (
                    <TableRow key={row.rowIndex} className={!row.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <XCircle className="h-4 w-4 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{row.errors.join(', ')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.paciente}</TableCell>
                      <TableCell>{row.procedimento}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.filial}</Badge>
                      </TableCell>
                      <TableCell>{row.dataVenda}</TableCell>
                      <TableCell className="text-right">
                        {row.vgv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 100 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Mostrando primeiras 100 linhas de {parsedData.length}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
