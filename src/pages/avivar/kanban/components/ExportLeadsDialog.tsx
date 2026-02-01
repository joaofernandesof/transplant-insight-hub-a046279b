/**
 * ExportLeadsDialog - Dialog para exportar leads para planilha XLS
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KanbanColumnData } from '../AvivarKanbanPage';

interface ExportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanbanId: string;
  kanbanName: string;
  columns: KanbanColumnData[];
}

export function ExportLeadsDialog({
  open,
  onOpenChange,
  kanbanId,
  kanbanName,
  columns,
}: ExportLeadsDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map((c) => c.id)
  );
  const [isExporting, setIsExporting] = useState(false);

  // Fetch leads for the kanban
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['avivar-kanban-leads', kanbanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanban_leads')
        .select('*')
        .eq('kanban_id', kanbanId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map((c) => c.id));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Filter leads by selected columns
      const filteredLeads = leads.filter((lead) =>
        selectedColumns.includes(lead.column_id)
      );

      if (filteredLeads.length === 0) {
        toast.error('Nenhum lead para exportar nas colunas selecionadas');
        setIsExporting(false);
        return;
      }

      // Create column name map
      const columnMap = new Map(columns.map((c) => [c.id, c.name]));

      // Prepare data for export
      const exportData = filteredLeads.map((lead) => ({
        Nome: lead.name,
        Telefone: lead.phone || '',
        Email: lead.email || '',
        Etapa: columnMap.get(lead.column_id) || '',
        Origem: lead.source || '',
        Observações: lead.notes || '',
        'Data de Criação': new Date(lead.created_at).toLocaleDateString('pt-BR'),
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      // Auto-size columns
      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 15 }, // Telefone
        { wch: 30 }, // Email
        { wch: 20 }, // Etapa
        { wch: 15 }, // Origem
        { wch: 40 }, // Observações
        { wch: 15 }, // Data
      ];
      ws['!cols'] = colWidths;

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `leads_${kanbanName.toLowerCase().replace(/\s+/g, '_')}_${date}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      toast.success(`${filteredLeads.length} leads exportados com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast.error('Erro ao exportar leads');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedLeadsCount = leads.filter((lead) =>
    selectedColumns.includes(lead.column_id)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Leads
          </DialogTitle>
          <DialogDescription>
            Exporte sua base de leads para uma planilha Excel
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Carregando leads...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Column Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Selecione as colunas para exportar:</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedColumns.length === columns.length
                    ? 'Desmarcar todos'
                    : 'Selecionar todos'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {columns.map((column) => {
                  const leadCount = leads.filter(
                    (l) => l.column_id === column.id
                  ).length;
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <span className="flex-1 text-sm">{column.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {leadCount}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">
                  {selectedLeadsCount} leads serão exportados
                </p>
                <p className="text-sm text-muted-foreground">
                  Formato: Excel (.xlsx)
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || isExporting || selectedLeadsCount === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
