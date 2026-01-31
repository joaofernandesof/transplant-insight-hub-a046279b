/**
 * Stock Movements Tab - Histórico de movimentações
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowDownCircle, 
  ArrowUpCircle,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MOVEMENT_TYPE_LABELS, type StockMovementType } from '../../procedures/types';

const MOVEMENT_ICONS: Record<StockMovementType, React.ReactNode> = {
  entrada: <ArrowDownCircle className="h-4 w-4 text-green-500" />,
  saida: <ArrowUpCircle className="h-4 w-4 text-red-500" />,
  ajuste: <RefreshCw className="h-4 w-4 text-yellow-500" />,
  transferencia: <ArrowLeftRight className="h-4 w-4 text-blue-500" />
};

export function StockMovementsTab() {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, stock_item:stock_items(name, unit)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Histórico de Movimentações
          </CardTitle>
          <CardDescription>
            Entradas, saídas, ajustes e transferências de estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements?.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {format(new Date(mov.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={mov.movement_type === 'entrada' ? 'default' : mov.movement_type === 'saida' ? 'destructive' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {MOVEMENT_ICONS[mov.movement_type as StockMovementType]}
                        {MOVEMENT_TYPE_LABELS[mov.movement_type as StockMovementType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {mov.stock_item?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={mov.movement_type === 'entrada' ? 'text-green-600' : mov.movement_type === 'saida' ? 'text-red-600' : ''}>
                        {mov.movement_type === 'entrada' ? '+' : mov.movement_type === 'saida' ? '-' : ''}
                        {mov.quantity} {mov.stock_item?.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {Number(mov.unit_cost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {mov.lot_number || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {mov.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!movements || movements.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
