import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  CheckCircle2, 
  Star,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NeoHairProduct {
  id: string;
  name: string;
  short_description: string;
  description: string;
  image_url: string | null;
  category: string;
  level: string | null;
  target_grades: number[] | null;
  price: number;
  compare_price: number | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  included_items: { name: string; quantity: number }[];
  display_order: number;
}

export default function NeoHairStore() {
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ['neohair-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neohair_products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        included_items: (p.included_items as { name: string; quantity: number }[]) || [],
      })) as NeoHairProduct[];
    },
  });

  const kits = products?.filter(p => p.category === 'kit') || [];
  const consultas = products?.filter(p => p.category === 'consulta') || [];

  const handleBuy = (product: NeoHairProduct) => {
    toast.info('Checkout em desenvolvimento');
    // TODO: Integrar com NeoPay
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'basico': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'intermediario': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'avancado': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'premium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLevelLabel = (level: string | null) => {
    switch (level) {
      case 'basico': return 'Básico';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      case 'premium': return 'Premium';
      default: return level;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 mb-4">
          <Sparkles className="h-3 w-3 mr-2" />
          Tratamentos Personalizados
        </Badge>
        <h1 className="text-3xl font-bold mb-2">Loja de Tratamentos</h1>
        <p className="text-muted-foreground">
          Escolha o kit ideal para seu caso. Todos os tratamentos são baseados em evidências científicas.
        </p>
      </div>

      {/* Kits */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-500" />
          Kits de Tratamento
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kits.map((product) => (
            <Card key={product.id} className="flex flex-col hover:border-teal-500/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  {product.level && (
                    <Badge className={getLevelColor(product.level)}>
                      {getLevelLabel(product.level)}
                    </Badge>
                  )}
                  {product.is_recurring && (
                    <Badge variant="outline" className="text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Mensal
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.short_description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Preço */}
                <div className="mb-4">
                  {product.compare_price && (
                    <span className="text-sm text-muted-foreground line-through mr-2">
                      R$ {product.compare_price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                  {product.is_recurring && (
                    <span className="text-sm text-muted-foreground">/mês</span>
                  )}
                </div>

                {/* Graus recomendados */}
                {product.target_grades && product.target_grades.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Recomendado para:</p>
                    <div className="flex gap-1">
                      {product.target_grades.map(g => (
                        <span 
                          key={g}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itens inclusos */}
                {product.included_items && product.included_items.length > 0 && (
                  <div className="space-y-1.5">
                    {product.included_items.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                    {product.included_items.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        + {product.included_items.length - 4} itens
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  onClick={() => handleBuy(product)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.is_recurring ? 'Assinar' : 'Comprar'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Consultas */}
      {consultas.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Consultas Médicas
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {consultas.map((product) => (
              <Card key={product.id} className="flex flex-col md:flex-row hover:border-teal-500/50 transition-colors">
                <CardContent className="flex-1 pt-6">
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{product.short_description}</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </p>
                </CardContent>
                <CardFooter className="md:border-l md:pl-6">
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    onClick={() => handleBuy(product)}
                  >
                    Agendar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30">
        <CardContent className="py-8 text-center">
          <h3 className="text-xl font-bold mb-2">Não sabe qual escolher?</h3>
          <p className="text-muted-foreground mb-4">
            Faça sua avaliação capilar gratuita e receba uma recomendação personalizada
          </p>
          <Button 
            onClick={() => navigate('/neohair/avaliacao')}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            Fazer Avaliação Gratuita
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
