import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown,
  ShoppingCart, Truck, ArrowRight, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../contexts/PortalAuthContext';
import { InventoryConceptChart } from '../../components/InventoryConceptChart';

export default function InventoryDashboard() {
  const { user } = usePortalAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Itens em Estoque', value: '0', icon: Package, color: 'bg-blue-500' },
    { label: 'Estoque Baixo', value: '0', icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Entradas (Mês)', value: '0', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Saídas (Mês)', value: '0', icon: TrendingDown, color: 'bg-orange-500' },
  ];

  const quickActions = [
    { icon: ShoppingCart, label: 'Novo Item', path: '/portal/inventory/items/new' },
    { icon: TrendingUp, label: 'Registrar Entrada', path: '/portal/inventory/movements/new?type=entry' },
    { icon: TrendingDown, label: 'Registrar Saída', path: '/portal/inventory/movements/new?type=exit' },
    { icon: Truck, label: 'Fornecedores', path: '/portal/inventory/suppliers' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">Controle de Estoque</h1>
            <p className="opacity-90">Olá, {user?.full_name?.split(' ')[0]}. Gerencie o inventário da clínica.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory Concept Chart */}
      <InventoryConceptChart />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-6 w-6" />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Estoque Baixo
            </CardTitle>
            <CardDescription>Itens que precisam de reposição</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/inventory/items?filter=low')}>
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item com estoque baixo</p>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Itens Próximos ao Vencimento
          </CardTitle>
          <CardDescription>Itens que vencem nos próximos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item próximo ao vencimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
