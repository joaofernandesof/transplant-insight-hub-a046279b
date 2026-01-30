/**
 * AvivarCatalog - Catálogo de Produtos e Serviços
 * Gestão de produtos para envio via WhatsApp
 * Suporte a tema claro e escuro
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
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Catálogo de Produtos
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Gerencie seus produtos e serviços para envio via WhatsApp</p>
        </div>
        <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.25)]">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Total de Produtos</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{catalogStats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{catalogStats.activeProducts} ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Visualizações</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{catalogStats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Envios</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{catalogStats.totalSends}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Via WhatsApp</p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa Conversão</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{catalogStats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+5% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Vendas</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">87</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] focus:border-[hsl(var(--avivar-primary))]"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]">
            <TabsTrigger value="all" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="product" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="service" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
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
              "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.4)] transition-all group relative overflow-hidden",
              !product.active && "opacity-60"
            )}
          >
            {product.featured && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Destaque
                </Badge>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  product.type === 'product' 
                    ? "bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]" 
                    : "bg-blue-500/20 text-blue-500"
                )}>
                  {product.type === 'product' ? (
                    <Package className="h-6 w-6" />
                  ) : (
                    <Briefcase className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">{product.name}</h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{product.category}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-[hsl(var(--avivar-foreground))]">{formatCurrency(product.price)}</p>
                  {product.price > 0 && (
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">ou 12x de {formatCurrency(product.price / 12)}</p>
                  )}
                </div>
                <Badge className={cn(
                  "text-xs",
                  product.active 
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] border-[hsl(var(--avivar-border))]"
                )}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-t border-[hsl(var(--avivar-border))]">
                <div className="text-center">
                  <p className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">{product.views}</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">{product.sends}</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Envios</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{product.conversions}</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Vendas</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Enviar
                </Button>
                <Button variant="ghost" size="icon" className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <Card className="bg-[hsl(var(--avivar-card)/0.5)] border-dashed border-[hsl(var(--avivar-primary)/0.3)] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-all cursor-pointer group">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[280px]">
            <div className="w-16 h-16 rounded-xl bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center mb-3 group-hover:bg-[hsl(var(--avivar-primary)/0.3)] transition-colors">
              <Plus className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
            </div>
            <p className="font-medium text-[hsl(var(--avivar-primary))]">Adicionar Produto</p>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center mt-1">
              Crie um novo produto ou serviço para seu catálogo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
