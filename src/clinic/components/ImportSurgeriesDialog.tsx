import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2, History, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface ImportSurgeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ImportBatch {
  import_batch_id: string;
  count: number;
  branch: string;
  created_at: string;
}

export function ImportSurgeriesDialog({ open, onOpenChange, onSuccess }: ImportSurgeriesDialogProps) {
  const { branches } = useNeoTeamBranches();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [branch, setBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; inserted?: number; errors?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState('import');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (branches.length > 0 && !branch) {
      setBranch(branches[0].name);
    }
  }, [branches, branch]);

  // Fetch import batches
  const { data: importBatches = [], isLoading: loadingBatches, refetch: refetchBatches } = useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_surgeries')
        .select('import_batch_id, branch, created_at')
        .not('import_batch_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by batch_id
      const batchMap = new Map<string, ImportBatch>();
      for (const row of data || []) {
        const batchId = row.import_batch_id as string;
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, {
            import_batch_id: batchId,
            count: 0,
            branch: row.branch || 'N/A',
            created_at: row.created_at,
          });
        }
        batchMap.get(batchId)!.count++;
      }

      return Array.from(batchMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: open,
  });

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

      const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (jsonRows.length < 2) {
        toast.error('Planilha vazia ou sem dados válidos');
        setIsLoading(false);
        return;
      }

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
      refetchBatches();
      onSuccess?.();
    } catch (err: any) {
      console.error('Import error:', err);
      setResult({ success: false, errors: [err.message || 'Erro desconhecido'] });
      toast.error('Erro ao importar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    setDeletingBatch(batchId);
    try {
      const { error } = await supabase
        .from('clinic_surgeries')
        .delete()
        .eq('import_batch_id', batchId);

      if (error) throw error;

      toast.success('Importação removida com sucesso!');
      refetchBatches();
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      onSuccess?.();
    } catch (err: any) {
      console.error('Delete batch error:', err);
      toast.error('Erro ao remover: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setDeletingBatch(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Agenda Cirúrgica
          </DialogTitle>
          <DialogDescription>
            Importe dados ou gerencie importações anteriores.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="import" className="flex-1 gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <History className="h-3.5 w-3.5" />
              Histórico
              {importBatches.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                  {importBatches.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Filial</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex justify-end gap-2 pt-2">
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
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            {loadingBatches ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando...
              </div>
            ) : importBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Package className="h-10 w-10 opacity-40" />
                <p className="text-sm">Nenhuma importação encontrada</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {importBatches.map((batch) => (
                  <div
                    key={batch.import_batch_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {batch.count} registros
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {batch.branch}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(batch.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          disabled={deletingBatch === batch.import_batch_id}
                        >
                          {deletingBatch === batch.import_batch_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir importação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso removerá permanentemente <strong>{batch.count} registros</strong> importados 
                            em {format(new Date(batch.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} 
                            para <strong>{batch.branch}</strong>. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteBatch(batch.import_batch_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir {batch.count} registros
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
