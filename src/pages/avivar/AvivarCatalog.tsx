/**
 * AvivarCatalog - Catálogo de Produtos e Serviços
 * Gestão de produtos para envio via WhatsApp
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Plus,
  Search,
  Package,
  Briefcase,
  Edit2,
  Trash2,
  Eye,
  Send,
  Star,
  TrendingUp,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data para produtos
const products = [
  { 
    id: 1, 
    name: 'Transplante Capilar FUE', 
    type: 'service',
    price: 15000, 
    category: 'Procedimento',
    views: 234,
    sends: 45,
    conversions: 12,
    active: true,
    featured: true,
  },
  { 
    id: 2, 
    name: 'Kit Tratamento Capilar', 
    type: 'product',
    price: 497, 
    category: 'Produto',
    views: 156,
    sends: 38,
    conversions: 8,
    active: true,
    featured: false,
  },
  { 
    id: 3, 
    name: 'Consulta Online', 
    type: 'service',
    price: 299, 
    category: 'Serviço',
    views: 89,
    sends: 22,
    conversions: 15,
    active: true,
    featured: true,
  },
  { 
    id: 4, 
    name: 'Minoxidil Premium', 
    type: 'product',
    price: 149, 
    category: 'Produto',
    views: 312,
    sends: 67,
    conversions: 23,
    active: true,
    featured: false,
  },
  { 
    id: 5, 
    name: 'Avaliação Capilar Presencial', 
    type: 'service',
    price: 0, 
    category: 'Serviço',
    views: 445,
    sends: 112,
    conversions: 45,
    active: true,
    featured: true,
  },
  { 
    id: 6, 
    name: 'Shampoo Antiqueda', 
    type: 'product',
    price: 89, 
    category: 'Produto',
    views: 178,
    sends: 34,
    conversions: 11,
    active: false,
    featured: false,
  },
];

// Estatísticas
const catalogStats = {
  totalProducts: 24,
  activeProducts: 22,
  totalViews: 1456,
  totalSends: 312,
  conversionRate: 28,
};

export default function AvivarCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || product.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Catálogo de Produtos
            <Sparkles className="h-5 w-5 text-purple-400" />
          </h1>
          <p className="text-slate-400">Gerencie seus produtos e serviços para envio via WhatsApp</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total de Produtos</p>
                <p className="text-2xl font-bold text-white">{catalogStats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-emerald-400 mt-1">{catalogStats.activeProducts} ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Visualizações</p>
                <p className="text-2xl font-bold text-white">{catalogStats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Envios</p>
                <p className="text-2xl font-bold text-white">{catalogStats.totalSends}</p>
              </div>
              <Send className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Via WhatsApp</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Taxa Conversão</p>
                <p className="text-2xl font-bold text-white">{catalogStats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-xs text-emerald-400 mt-1">+5% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Vendas</p>
                <p className="text-2xl font-bold text-white">87</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-400"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-slate-900/50 border border-purple-500/30">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="product" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="service" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Briefcase className="h-4 w-4 mr-2" />
              Serviços
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id}
            className={cn(
              "bg-slate-900/80 border-slate-700/50 hover:border-purple-500/40 transition-all group relative overflow-hidden",
              !product.active && "opacity-60"
            )}
          >
            {product.featured && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  <Star className="h-3 w-3 mr-1 fill-amber-300" />
                  Destaque
                </Badge>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  product.type === 'product' 
                    ? "bg-purple-600/20 text-purple-400" 
                    : "bg-blue-600/20 text-blue-400"
                )}>
                  {product.type === 'product' ? (
                    <Package className="h-6 w-6" />
                  ) : (
                    <Briefcase className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{product.name}</h3>
                  <p className="text-xs text-slate-400">{product.category}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-white">{formatCurrency(product.price)}</p>
                  {product.price > 0 && (
                    <p className="text-xs text-slate-500">ou 12x de {formatCurrency(product.price / 12)}</p>
                  )}
                </div>
                <Badge className={cn(
                  "text-xs",
                  product.active 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-700/50 text-slate-400 border-slate-600"
                )}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">{product.views}</p>
                  <p className="text-xs text-slate-400">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">{product.sends}</p>
                  <p className="text-xs text-slate-400">Envios</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-400">{product.conversions}</p>
                  <p className="text-xs text-slate-400">Vendas</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Enviar
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <Card className="bg-slate-900/50 border-dashed border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[280px]">
            <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center mb-3 group-hover:bg-purple-600/30 transition-colors">
              <Plus className="h-8 w-8 text-purple-400" />
            </div>
            <p className="font-medium text-purple-300">Adicionar Produto</p>
            <p className="text-xs text-slate-500 text-center mt-1">
              Crie um novo produto ou serviço para seu catálogo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
