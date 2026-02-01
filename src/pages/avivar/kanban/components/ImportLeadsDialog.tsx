/**
 * ImportLeadsDialog - Dialog para importar leads de planilha XLS/CSV
 */

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KanbanColumnData } from '../AvivarKanbanPage';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanbanId: string;
  columns: KanbanColumnData[];
}

interface ParsedLead {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  source?: string;
}

export function ImportLeadsDialog({
  open,
  onOpenChange,
  kanbanId,
  columns,
}: ImportLeadsDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Set default column (first one)
  const defaultColumn = columns.length > 0 ? columns[0] : null;

  const resetState = () => {
    setStep('upload');
    setSelectedFile(null);
    setParsedLeads([]);
    setSelectedColumnId(defaultColumn?.id || '');
    setError(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length < 2) {
        setError('A planilha precisa ter pelo menos uma linha de cabeçalho e uma linha de dados.');
        return;
      }

      // Try to detect columns
      const headers = jsonData[0].map((h) => String(h).toLowerCase().trim());
      const nameIndex = headers.findIndex((h) => 
        h.includes('nome') || h.includes('name') || h.includes('contato') || h.includes('lead')
      );
      const phoneIndex = headers.findIndex((h) => 
        h.includes('telefone') || h.includes('phone') || h.includes('celular') || h.includes('whatsapp')
      );
      const emailIndex = headers.findIndex((h) => 
        h.includes('email') || h.includes('e-mail')
      );
      const notesIndex = headers.findIndex((h) => 
        h.includes('nota') || h.includes('notes') || h.includes('observ')
      );
      const sourceIndex = headers.findIndex((h) => 
        h.includes('origem') || h.includes('source') || h.includes('fonte')
      );

      if (nameIndex === -1) {
        setError('Não foi possível encontrar uma coluna de nome. Certifique-se de ter uma coluna chamada "Nome", "Name" ou "Contato".');
        return;
      }

      // Parse leads
      const leads: ParsedLead[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const name = row[nameIndex]?.toString().trim();
        if (!name) continue;

        leads.push({
          name,
          phone: phoneIndex >= 0 ? row[phoneIndex]?.toString().trim() : undefined,
          email: emailIndex >= 0 ? row[emailIndex]?.toString().trim() : undefined,
          notes: notesIndex >= 0 ? row[notesIndex]?.toString().trim() : undefined,
          source: sourceIndex >= 0 ? row[sourceIndex]?.toString().trim() : 'Importação',
        });
      }

      if (leads.length === 0) {
        setError('Nenhum lead válido encontrado na planilha.');
        return;
      }

      setParsedLeads(leads);
      setSelectedColumnId(defaultColumn?.id || columns[0]?.id || '');
      setStep('preview');
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Erro ao ler o arquivo. Certifique-se de que é um arquivo XLS, XLSX ou CSV válido.');
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const leadsToInsert = parsedLeads.map((lead, index) => ({
        kanban_id: kanbanId,
        column_id: selectedColumnId,
        user_id: user.id,
        name: lead.name,
        phone: lead.phone || null,
        email: lead.email || null,
        notes: lead.notes || null,
        source: lead.source || 'Importação',
        order_index: index,
      }));

      const { error } = await supabase
        .from('avivar_kanban_leads')
        .insert(leadsToInsert);

      if (error) throw error;
      return leadsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
      toast.success(`${count} leads importados com sucesso!`);
      resetState();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error importing leads:', error);
      toast.error('Erro ao importar leads');
      setStep('preview');
    },
  });

  const handleImport = () => {
    if (!selectedColumnId) {
      toast.error('Selecione uma coluna de destino');
      return;
    }
    setStep('importing');
    importMutation.mutate();
  };

  const downloadTemplate = () => {
    const template = [
      ['Nome', 'Telefone', 'Email', 'Observações', 'Origem'],
      ['Maria Silva', '11999998888', 'maria@email.com', 'Interessada em harmonização', 'Instagram'],
      ['João Santos', '11988887777', 'joao@email.com', 'Consulta agendada', 'Indicação'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_importacao_leads.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Leads
          </DialogTitle>
          <DialogDescription>
            Importe sua base de leads de uma planilha Excel ou CSV
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Clique para selecionar um arquivo
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: .xls, .xlsx, .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Como formatar sua planilha
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>A primeira linha deve conter os cabeçalhos</li>
                <li>Coluna obrigatória: <Badge variant="secondary">Nome</Badge></li>
                <li>Colunas opcionais: <Badge variant="outline">Telefone</Badge> <Badge variant="outline">Email</Badge> <Badge variant="outline">Observações</Badge> <Badge variant="outline">Origem</Badge></li>
              </ul>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar modelo de exemplo
              </Button>
            </div>

            {/* Info about destination */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Dica:</strong> Todos os leads importados serão adicionados à primeira coluna do kanban para que você possa revisá-los e movê-los para as etapas corretas.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{parsedLeads.length} leads encontrados</p>
                <p className="text-sm text-muted-foreground">
                  Arquivo: {selectedFile?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="column">Importar para:</Label>
                <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="h-64 border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Telefone</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 50).map((lead, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-muted-foreground">{index + 1}</td>
                      <td className="p-2 font-medium">{lead.name}</td>
                      <td className="p-2">{lead.phone || '-'}</td>
                      <td className="p-2">{lead.email || '-'}</td>
                      <td className="p-2">{lead.source || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {parsedLeads.length - 50} leads
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Importando {parsedLeads.length} leads...</p>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={!selectedColumnId}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {parsedLeads.length} leads
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
