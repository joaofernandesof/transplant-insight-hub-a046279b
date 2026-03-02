/**
 * Procedures & Kits Tab
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Package, 
  Clock, 
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  Copy,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProcedures, useProcedureKits, useKitWithItems } from '../hooks/useProcedures';
import { CATEGORY_LABELS } from '../types';
import { cn } from '@/lib/utils';

export function ProceduresKitsTab() {
  const [search, setSearch] = useState('');
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: procedures, isLoading: loadingProcedures } = useProcedures();
  const { data: kits, isLoading: loadingKits } = useProcedureKits();
  const { data: selectedKit } = useKitWithItems(selectedKitId ?? undefined);

  const filteredProcedures = procedures?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getActiveKit = (procedureId: string) => {
    return kits?.find(k => k.procedure_id === procedureId && k.is_active);
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredProcedures) return;
    if (selectedIds.size === filteredProcedures.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProcedures.map(p => p.id)));
    }
  };

  // Individual actions
  const deactivateProcedure = async (id: string) => {
    try {
      await supabase.from('procedures').update({ is_active: false }).eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast.success('Procedimento desativado');
    } catch {
      toast.error('Erro ao desativar procedimento');
    }
  };

  const deleteProcedure = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este procedimento?');
    if (!confirmed) return;
    try {
      await supabase.from('procedures').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast.success('Procedimento excluído');
    } catch {
      toast.error('Erro ao excluir procedimento');
    }
  };

  const duplicateProcedure = async (procedure: any) => {
    try {
      const { id, created_at, ...rest } = procedure;
      await supabase.from('procedures').insert({ ...rest, name: `${rest.name} (cópia)` });
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast.success('Procedimento duplicado');
    } catch {
      toast.error('Erro ao duplicar procedimento');
    }
  };

  // Bulk actions
  const bulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await supabase.from('procedures').update({ is_active: false }).eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast.success(`${selectedIds.size} procedimento(s) desativado(s)`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Erro ao desativar procedimentos');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} procedimento(s)?`);
    if (!confirmed) return;
    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await supabase.from('procedures').delete().eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
      toast.success(`${selectedIds.size} procedimento(s) excluído(s)`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Erro ao excluir procedimentos');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procedimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Procedimento
        </Button>
      </div>

      {/* Procedures List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Procedimentos Cadastrados
          </CardTitle>
          <CardDescription>
            {procedures?.length || 0} procedimentos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg">
              <CheckSquare className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">
                {selectedIds.size} selecionado(s)
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-600/50 text-amber-400 hover:bg-amber-900/30 gap-1"
                  onClick={bulkDeactivate}
                  disabled={isBulkProcessing}
                >
                  <Power className="h-3.5 w-3.5" />
                  Desativar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600/50 text-red-400 hover:bg-red-900/30 gap-1"
                  onClick={bulkDelete}
                  disabled={isBulkProcessing}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar
                </Button>
              </div>
              {isBulkProcessing && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
            </div>
          )}

          {loadingProcedures || loadingKits ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={!!filteredProcedures?.length && selectedIds.size === filteredProcedures.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Kit Ativo</TableHead>
                  <TableHead>Itens no Kit</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures?.map((procedure) => {
                  const kit = getActiveKit(procedure.id);
                  const isSelected = selectedIds.has(procedure.id);
                  return (
                    <TableRow key={procedure.id} className={cn(isSelected && "bg-blue-950/20")}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(procedure.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {procedure.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {procedure.category || 'Geral'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {procedure.duration_minutes} min
                        </div>
                      </TableCell>
                      <TableCell>
                        {kit ? (
                          <Badge>v{kit.version}</Badge>
                        ) : (
                          <Badge variant="destructive">Sem kit</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {kit ? (
                          <span className="text-muted-foreground">
                            {(kit as any).kit_items?.length || 0} itens
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {kit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedKitId(kit.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {}}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateProcedure(procedure)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              {kit && (
                                <DropdownMenuItem onClick={() => setSelectedKitId(kit.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Kit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deactivateProcedure(procedure.id)}>
                                <Power className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={() => deleteProcedure(procedure.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredProcedures?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum procedimento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Kit Details Dialog */}
      <Dialog open={!!selectedKitId} onOpenChange={(open) => !open && setSelectedKitId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Kit do Procedimento
            </DialogTitle>
            <DialogDescription>
              {selectedKit?.procedure?.name} - Versão {selectedKit?.version}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedKit?.version_notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedKit.version_notes}
                </p>
              </div>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Qtd Padrão</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedKit?.kit_items?.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.stock_item?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.stock_item?.unit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.stock_item?.category ? CATEGORY_LABELS[item.stock_item.category] : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.quantity_default}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.requires_photo && (
                          <Badge variant="secondary" className="text-xs">
                            📷 Foto
                          </Badge>
                        )}
                        {item.stock_item?.is_critical && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Crítico
                          </Badge>
                        )}
                        {item.allows_substitute && (
                          <Badge variant="outline" className="text-xs">
                            🔄 Substituto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
