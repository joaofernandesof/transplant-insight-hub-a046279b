/**
 * Low Stock Tab - Itens com estoque baixo ou crítico
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  ShoppingCart,
  Package
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function LowStockTab() {
  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['low-stock-items'],
    queryFn: async () => {
      // First get all stock items
      const { data: items, error: itemsError } = await supabase
        .from('stock_items')
        .select('*')
        .eq('is_active', true);
      
      if (itemsError) throw itemsError;

      // Get clinic stock
      const { data: stock, error: stockError } = await supabase
        .from('clinic_stock')
        .select('*');
      
      if (stockError) throw stockError;

      // Map stock to items and filter low stock
      return items?.map(item => {
        const itemStock = stock?.find(s => s.stock_item_id === item.id);
        const onHand = itemStock?.on_hand_qty || 0;
        const reorderPoint = item.reorder_point || 10;
        const minQty = item.min_quantity || 5;
        
        return {
          ...item,
          on_hand_qty: onHand,
          status: onHand <= minQty ? 'critical' : onHand <= reorderPoint ? 'low' : 'normal',
          percentage: Math.min(100, (onHand / reorderPoint) * 100)
        };
      }).filter(item => item.status !== 'normal')
        .sort((a, b) => a.on_hand_qty - b.on_hand_qty);
    }
  });

  const criticalItems = lowStockItems?.filter(i => i.status === 'critical') || [];
  const lowItems = lowStockItems?.filter(i => i.status === 'low') || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-700 dark:text-red-400">
                {criticalItems.length}
              </span>
              <span className="text-sm text-red-600 dark:text-red-500">itens</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {lowItems.length}
              </span>
              <span className="text-sm text-yellow-600 dark:text-yellow-500">itens</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Itens que Precisam de Reposição
          </CardTitle>
          <CardDescription>
            Lista de itens com estoque abaixo do ponto de reposição
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems?.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border ${
                    item.status === 'critical' 
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20' 
                      : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={item.status === 'critical' ? 'destructive' : 'secondary'}>
                        {item.status === 'critical' ? 'Crítico' : 'Baixo'}
                      </Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Solicitar
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress 
                        value={item.percentage} 
                        className={`h-2 ${item.status === 'critical' ? '[&>div]:bg-red-500' : '[&>div]:bg-yellow-500'}`}
                      />
                    </div>
                    <div className="text-sm">
                      <span className={item.status === 'critical' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-yellow-600 dark:text-yellow-400 font-bold'}>
                        {item.on_hand_qty}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}/ {item.reorder_point} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {(!lowStockItems || lowStockItems.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item com estoque baixo!</p>
                  <p className="text-sm">Todos os itens estão com níveis adequados.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
