import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Play, Bot, Users } from "lucide-react";

interface UpsellItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const upsellItems: UpsellItem[] = [
  {
    id: 'automacao-comercial',
    title: 'Automação Comercial',
    description: 'Automatize seu processo comercial com um robô especializado em vendas para clínicas de transplante capilar.',
    icon: <Bot className="h-16 w-16 text-white/90" />,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'contrate-equipe',
    title: 'Contrate Nossa Equipe',
    description: 'Contrate nossa equipe especializada e se preocupe apenas em operar, deixe todo o restante conosco.',
    icon: <Users className="h-16 w-16 text-white/90" />,
    gradient: 'from-blue-400 to-blue-500',
  },
];

export function UpsellSection() {
  const handleBuy = (itemId: string) => {
    console.log('Comprar:', itemId);
    // TODO: Implementar lógica de compra
  };

  const handleTrailer = (itemId: string) => {
    console.log('Assistir trailer:', itemId);
    // TODO: Implementar visualização de trailer
  };

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Estrutura NEO</h2>
        <p className="text-sm text-muted-foreground">
          Eleve os níveis da sua clínica com a nossa estrutura
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upsellItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {/* Image/Icon Area */}
            <div className={`aspect-video bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoLTZ2LTZoNnYtNmg2djZoNnY2aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              {item.icon}
            </div>

            {/* Content */}
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleBuy(item.id)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Comprar curso
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => handleTrailer(item.id)}
                >
                  <Play className="h-4 w-4" />
                  Assistir Trailer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
