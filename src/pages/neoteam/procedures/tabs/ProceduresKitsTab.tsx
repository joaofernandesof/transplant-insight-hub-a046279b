/**
 * Procedures & Kits Tab
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Plus, 
  Search, 
  Package, 
  Clock, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { useProcedures, useProcedureKits, useKitWithItems } from '../hooks/useProcedures';
import { CATEGORY_LABELS } from '../types';

export function ProceduresKitsTab() {
  const [search, setSearch] = useState('');
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  
  const { data: procedures, isLoading: loadingProcedures } = useProcedures();
  const { data: kits, isLoading: loadingKits } = useProcedureKits();
  const { data: selectedKit } = useKitWithItems(selectedKitId ?? undefined);

  const filteredProcedures = procedures?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get active kit for each procedure
  const getActiveKit = (procedureId: string) => {
    return kits?.find(k => k.procedure_id === procedureId && k.is_active);
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
          {loadingProcedures || loadingKits ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                  return (
                    <TableRow key={procedure.id}>
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
                              onClick={() => setSelectedKitId(kit.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredProcedures?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
