import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Package,
  Briefcase,
  RefreshCw,
  Layers,
  Edit,
  Copy,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockProducts = [
  { id: '1', name: 'Consulta Capilar', type: 'service', price: 250, billingInterval: null, isActive: true, createdAt: '2025-01-15' },
  { id: '2', name: 'Kit Tratamento Básico', type: 'product', price: 450, billingInterval: null, isActive: true, createdAt: '2025-01-10' },
  { id: '3', name: 'Plano Premium Mensal', type: 'subscription', price: 299, billingInterval: 'monthly', isActive: true, createdAt: '2025-01-05' },
  { id: '4', name: 'Licença ByNeoFolic', type: 'plan', price: 2500, billingInterval: 'monthly', isActive: true, createdAt: '2025-01-01' },
  { id: '5', name: 'Transplante Capilar FUE', type: 'service', price: 15000, billingInterval: null, isActive: true, createdAt: '2024-12-20' },
  { id: '6', name: 'Curso IBRAMEC', type: 'product', price: 4500, billingInterval: null, isActive: false, createdAt: '2024-12-15' },
];

const productTypeConfig = {
  product: { label: 'Produto', icon: Package, color: 'bg-blue-100 text-blue-700' },
  service: { label: 'Serviço', icon: Briefcase, color: 'bg-purple-100 text-purple-700' },
  subscription: { label: 'Assinatura', icon: RefreshCw, color: 'bg-emerald-100 text-emerald-700' },
  plan: { label: 'Plano', icon: Layers, color: 'bg-amber-100 text-amber-700' },
};

export default function NeoPayProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    type: 'product',
    price: '',
    billingInterval: '',
    trialDays: '0',
    isActive: true,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || product.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreateProduct = () => {
    toast.success('Produto criado com sucesso!');
    setIsCreateDialogOpen(false);
    setNewProduct({
      name: '',
      description: '',
      type: 'product',
      price: '',
      billingInterval: '',
      trialDays: '0',
      isActive: true,
    });
  };

  const getTypeBadge = (type: string) => {
    const config = productTypeConfig[type as keyof typeof productTypeConfig];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos & Serviços</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo de produtos, serviços e planos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Produto</DialogTitle>
              <DialogDescription>
                Adicione um novo produto, serviço ou plano ao catálogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome do produto ou serviço"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição detalhada"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newProduct.type}
                    onValueChange={(value) => setNewProduct({ ...newProduct, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="service">Serviço</SelectItem>
                      <SelectItem value="subscription">Assinatura</SelectItem>
                      <SelectItem value="plan">Plano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0,00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
              </div>
              {(newProduct.type === 'subscription' || newProduct.type === 'plan') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Intervalo de Cobrança</Label>
                    <Select
                      value={newProduct.billingInterval}
                      onValueChange={(value) => setNewProduct({ ...newProduct, billingInterval: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trial">Dias de Trial</Label>
                    <Input
                      id="trial"
                      type="number"
                      placeholder="0"
                      value={newProduct.trialDays}
                      onChange={(e) => setNewProduct({ ...newProduct, trialDays: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Produto ativo</Label>
                <Switch
                  id="active"
                  checked={newProduct.isActive}
                  onCheckedChange={(checked) => setNewProduct({ ...newProduct, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProduct} className="bg-emerald-600 hover:bg-emerald-700">
                Criar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(productTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = mockProducts.filter((p) => p.type === type).length;
          return (
            <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterType(type)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="product">Produtos</SelectItem>
                <SelectItem value="service">Serviços</SelectItem>
                <SelectItem value="subscription">Assinaturas</SelectItem>
                <SelectItem value="plan">Planos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Criado em {product.createdAt}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(product.type)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    {product.billingInterval ? (
                      <Badge variant="outline">
                        {product.billingInterval === 'monthly' ? 'Mensal' : 
                         product.billingInterval === 'yearly' ? 'Anual' : 'Semanal'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
