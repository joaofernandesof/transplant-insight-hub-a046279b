import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportSurgeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportSurgeriesDialog({ open, onOpenChange, onSuccess }: ImportSurgeriesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [branch, setBranch] = useState('Filial Fortaleza');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; inserted?: number; errors?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert to pipe-delimited rows (matching edge function format)
      const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (jsonRows.length < 2) {
        toast.error('Planilha vazia ou sem dados válidos');
        setIsLoading(false);
        return;
      }

      // Skip header row, join each row with pipe delimiter
      const pipeRows = jsonRows.slice(1).map(row =>
        '|' + row.map((cell: any) => String(cell ?? '')).join('|') + '|'
      );

      const { data: response, error } = await supabase.functions.invoke('import-surgeries', {
        body: { rows: pipeRows, branch },
      });

      if (error) throw error;

      setResult({
        success: true,
        inserted: response?.inserted || 0,
        errors: response?.errors,
      });

      toast.success(`${response?.inserted || 0} registros importados com sucesso!`);
      onSuccess?.();
    } catch (err: any) {
      console.error('Import error:', err);
      setResult({ success: false, errors: [err.message || 'Erro desconhecido'] });
      toast.error('Erro ao importar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Agenda Cirúrgica
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo Excel (.xlsx) com os dados da agenda para importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Branch selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Filial</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Filial Fortaleza">Filial Fortaleza</SelectItem>
                <SelectItem value="Filial Recife">Filial Recife</SelectItem>
                <SelectItem value="Filial Salvador">Filial Salvador</SelectItem>
                <SelectItem value="Filial São Paulo">Filial São Paulo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Arquivo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              {file ? (
                <>
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium truncate max-w-full">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB — Clique para trocar
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para selecionar o arquivo</span>
                  <span className="text-xs text-muted-foreground">.xlsx, .xls ou .csv</span>
                </>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              result.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <div>
                {result.success ? (
                  <p>{result.inserted} registros importados com sucesso.</p>
                ) : (
                  <p>Erro na importação.</p>
                )}
                {result.errors?.map((e, i) => (
                  <p key={i} className="text-xs mt-1 opacity-80">{e}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {result?.success ? 'Fechar' : 'Cancelar'}
          </Button>
          {!result?.success && (
            <Button onClick={handleImport} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Importar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
