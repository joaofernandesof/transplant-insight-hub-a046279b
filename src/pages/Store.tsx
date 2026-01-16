import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ShoppingBag,
  Search,
  ShoppingCart,
  Package,
  TrendingUp,
  Star,
  Plus,
  Minus
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";

interface Product {
  id: string;
  name: string;
  description: string;
  costPrice: number;
  suggestedPrice: number;
  category: string;
  inStock: boolean;
  image?: string;
}

const products: Product[] = [
  { id: '1', name: 'Gummy Hair Neo', description: 'Suplemento capilar em goma', costPrice: 28, suggestedPrice: 100, category: 'Suplementos', inStock: true },
  { id: '2', name: 'Shampoo Neo-Spa', description: 'Shampoo de manutenção pós-transplante', costPrice: 35, suggestedPrice: 120, category: 'Cuidados', inStock: true },
  { id: '3', name: 'Condicionador Neo-Spa', description: 'Condicionador para cabelos transplantados', costPrice: 32, suggestedPrice: 110, category: 'Cuidados', inStock: true },
  { id: '4', name: 'Kit Pós-Operatório', description: 'Kit completo de cuidados pós-transplante', costPrice: 85, suggestedPrice: 280, category: 'Kits', inStock: true },
  { id: '5', name: 'Sérum Capilar', description: 'Sérum para fortalecimento capilar', costPrice: 45, suggestedPrice: 150, category: 'Tratamentos', inStock: true },
  { id: '6', name: 'Minoxidil 5%', description: 'Solução tópica para crescimento', costPrice: 25, suggestedPrice: 89, category: 'Tratamentos', inStock: false },
  { id: '7', name: 'Finasterida Neo', description: 'Tratamento oral anti-queda', costPrice: 40, suggestedPrice: 130, category: 'Medicamentos', inStock: true },
  { id: '8', name: 'Kit Mesoterapia', description: 'Insumos para sessão de mesoterapia', costPrice: 120, suggestedPrice: 350, category: 'Insumos', inStock: true },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Store() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const product = products.find(p => p.id === id);
    return total + (product?.costPrice || 0) * qty;
  }, 0);

  const cartItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logoByNeofolic} alt="ByNeofolic" className="h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-orange-600" />
                  Loja Neo-Spa
                </h1>
                <p className="text-sm text-muted-foreground">Produtos com preço de custo</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2 relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {cartItems}
                </Badge>
              )}
              {formatCurrency(cartTotal)}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">Margem de Lucro Superior a 100%</h3>
                <p className="text-sm text-orange-700">
                  Compre no preço de custo e revenda com alta margem para seus pacientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const margin = Math.round(((product.suggestedPrice - product.costPrice) / product.costPrice) * 100);
            const qty = cart[product.id] || 0;
            
            return (
              <Card key={product.id} className={`overflow-hidden ${!product.inStock ? 'opacity-60' : ''}`}>
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative">
                  <Package className="h-16 w-16 text-orange-300" />
                  {!product.inStock && (
                    <Badge className="absolute top-2 right-2 bg-red-500">Indisponível</Badge>
                  )}
                  <Badge className="absolute top-2 left-2 bg-green-600">+{margin}%</Badge>
                </div>
                <CardContent className="p-4">
                  <Badge variant="outline" className="text-xs mb-2">{product.category}</Badge>
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(product.costPrice)}</p>
                      <p className="text-xs text-muted-foreground">
                        Revenda: {formatCurrency(product.suggestedPrice)}
                      </p>
                    </div>
                  </div>

                  {product.inStock && (
                    qty > 0 ? (
                      <div className="flex items-center justify-between gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => removeFromCart(product.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{qty}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => addToCart(product.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full gap-2" 
                        size="sm"
                        onClick={() => addToCart(product.id)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Adicionar
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
