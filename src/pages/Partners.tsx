import { useState } from "react";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Store, 
  Copy, 
  Check,
  ExternalLink,
  Search,
  Percent,
  Tag
} from "lucide-react";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  discount: string;
  couponCode: string;
  website: string;
  logo?: string;
  featured?: boolean;
}

const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'MedEquip Pro',
    description: 'Equipamentos médicos e cirúrgicos de alta qualidade',
    category: 'Equipamentos',
    discount: '15%',
    couponCode: 'NEOFOLIC15',
    website: 'https://medequippro.com.br',
    featured: true
  },
  {
    id: '2',
    name: 'DermaCosmetics',
    description: 'Produtos dermocosméticos para pré e pós-procedimento',
    category: 'Cosméticos',
    discount: '20%',
    couponCode: 'NEO20OFF',
    website: 'https://dermacosmetics.com.br',
    featured: true
  },
  {
    id: '3',
    name: 'ClinicaWeb',
    description: 'Sistemas de gestão e agendamento para clínicas',
    category: 'Software',
    discount: '30%',
    couponCode: 'NEOSOFT30',
    website: 'https://clinicaweb.com.br'
  },
  {
    id: '4',
    name: 'Marketing Saúde',
    description: 'Agência especializada em marketing para saúde',
    category: 'Marketing',
    discount: '25%',
    couponCode: 'NEOMKT25',
    website: 'https://marketingsaude.com.br'
  },
  {
    id: '5',
    name: 'LabHair',
    description: 'Análises capilares e tricologia avançada',
    category: 'Laboratório',
    discount: '10%',
    couponCode: 'NEOLAB10',
    website: 'https://labhair.com.br'
  },
  {
    id: '6',
    name: 'UniformeMed',
    description: 'Uniformes e jalecos médicos personalizados',
    category: 'Vestuário',
    discount: '15%',
    couponCode: 'NEOUNIF15',
    website: 'https://uniformemed.com.br'
  },
  {
    id: '7',
    name: 'ContabilClinic',
    description: 'Contabilidade especializada para clínicas',
    category: 'Contabilidade',
    discount: '1 mês grátis',
    couponCode: 'NEOCONTABIL',
    website: 'https://contabilclinic.com.br'
  },
  {
    id: '8',
    name: 'TreinoHair Academy',
    description: 'Cursos e workshops de técnicas capilares',
    category: 'Educação',
    discount: '20%',
    couponCode: 'NEOLEARN20',
    website: 'https://treinohair.com.br'
  }
];

const categoryColors: Record<string, string> = {
  'Equipamentos': 'bg-blue-100 text-blue-700',
  'Cosméticos': 'bg-pink-100 text-pink-700',
  'Software': 'bg-purple-100 text-purple-700',
  'Marketing': 'bg-orange-100 text-orange-700',
  'Laboratório': 'bg-green-100 text-green-700',
  'Vestuário': 'bg-amber-100 text-amber-700',
  'Contabilidade': 'bg-slate-100 text-slate-700',
  'Educação': 'bg-indigo-100 text-indigo-700'
};

export default function Partners() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(mockPartners.map(p => p.category))];

  const filteredPartners = mockPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || partner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyCoupon = async (partner: Partner) => {
    try {
      await navigator.clipboard.writeText(partner.couponCode);
      setCopiedId(partner.id);
      toast.success(`Cupom ${partner.couponCode} copiado!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Erro ao copiar cupom');
    }
  };

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                Vitrine de Parceiros
              </h1>
              <p className="text-sm text-muted-foreground">Cupons exclusivos para licenciados ByNeofolic</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 overflow-x-hidden w-full">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge 
            variant={!selectedCategory ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Featured Partners */}
        {filteredPartners.some(p => p.featured) && !selectedCategory && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-emerald-600" />
              Parceiros em Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPartners.filter(p => p.featured).map((partner) => (
                <Card key={partner.id} className="border-2 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{partner.name}</h3>
                          <Badge className={categoryColors[partner.category]}>
                            {partner.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{partner.description}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="destructive" className="text-lg px-3 py-1">
                            {partner.discount} OFF
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border flex-1">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-bold">{partner.couponCode}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyCoupon(partner)}
                          >
                            {copiedId === partner.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => window.open(partner.website, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Partners */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {selectedCategory ? `Parceiros - ${selectedCategory}` : 'Todos os Parceiros'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.filter(p => selectedCategory || !p.featured).map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{partner.name}</h3>
                    <Badge className={`text-xs ${categoryColors[partner.category]}`}>
                      {partner.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{partner.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="destructive" className="text-sm">
                      {partner.discount} OFF
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted rounded px-2 py-1 flex-1 text-xs">
                      <span className="font-mono font-bold">{partner.couponCode}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopyCoupon(partner)}
                    >
                      {copiedId === partner.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(partner.website, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
          </div>
        )}
      </main>
    </ModuleLayout>
  );
}
