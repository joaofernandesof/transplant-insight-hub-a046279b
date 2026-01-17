import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  FileText,
  Download,
  Search,
  FolderOpen,
  File,
  FileSpreadsheet,
  Stethoscope,
  DollarSign,
  ClipboardList,
  Shield
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";

interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'pdf' | 'doc' | 'xlsx' | 'video';
  size: string;
  downloads: number;
}

const materials: Material[] = [
  { id: '1', title: 'POP - Técnica FUE', description: 'Procedimento operacional padrão da técnica FUE', category: 'pops', type: 'pdf', size: '2.4 MB', downloads: 156 },
  { id: '2', title: 'POP - Técnica FUT', description: 'Procedimento operacional padrão da técnica FUT', category: 'pops', type: 'pdf', size: '2.1 MB', downloads: 89 },
  { id: '3', title: 'Protocolo de Esterilização', description: 'Procedimentos de higienização e esterilização', category: 'pops', type: 'pdf', size: '1.8 MB', downloads: 234 },
  { id: '4', title: 'Protocolo Pós-Operatório', description: 'Cuidados e orientações pós-transplante', category: 'pops', type: 'pdf', size: '1.5 MB', downloads: 312 },
  { id: '5', title: 'Script de Primeira Consulta', description: 'Roteiro completo para consulta inicial', category: 'scripts', type: 'doc', size: '450 KB', downloads: 445 },
  { id: '6', title: 'Script de Fechamento', description: 'Técnicas de fechamento e objeções', category: 'scripts', type: 'doc', size: '380 KB', downloads: 398 },
  { id: '7', title: 'Script de Follow-up', description: 'Acompanhamento de leads não convertidos', category: 'scripts', type: 'doc', size: '320 KB', downloads: 267 },
  { id: '8', title: 'FAQ - Objeções Comuns', description: 'Respostas para principais objeções', category: 'scripts', type: 'pdf', size: '520 KB', downloads: 523 },
  { id: '9', title: 'Contrato - Transplante Capilar', description: 'Modelo de contrato para procedimentos capilares', category: 'contratos', type: 'doc', size: '180 KB', downloads: 678 },
  { id: '10', title: 'Contrato - Transplante de Barba', description: 'Modelo específico para barba', category: 'contratos', type: 'doc', size: '165 KB', downloads: 234 },
  { id: '11', title: 'TCLE - Transplante Capilar', description: 'Termo de consentimento livre e esclarecido', category: 'contratos', type: 'doc', size: '145 KB', downloads: 567 },
  { id: '12', title: 'Autorização de Uso de Imagem', description: 'Termo para uso de fotos e vídeos', category: 'contratos', type: 'doc', size: '120 KB', downloads: 489 },
  { id: '13', title: 'Termo de Distrato', description: 'Modelo para cancelamento de procedimento', category: 'contratos', type: 'doc', size: '95 KB', downloads: 156 },
  { id: '14', title: 'Guia Pré-Transplante', description: 'Orientações para o paciente antes do procedimento', category: 'guias', type: 'pdf', size: '890 KB', downloads: 445 },
  { id: '15', title: 'Guia Pós-Transplante', description: 'Cuidados nos primeiros 30 dias', category: 'guias', type: 'pdf', size: '1.2 MB', downloads: 534 },
  { id: '16', title: 'Guia de PRP', description: 'Informações sobre o tratamento com PRP', category: 'guias', type: 'pdf', size: '650 KB', downloads: 312 },
  { id: '17', title: 'Guia de Mesoterapia', description: 'Protocolo de mesoterapia capilar', category: 'guias', type: 'pdf', size: '580 KB', downloads: 278 },
  { id: '18', title: 'Checklist de Anamnese', description: 'Lista completa para avaliação do paciente', category: 'checklists', type: 'xlsx', size: '85 KB', downloads: 567 },
  { id: '19', title: 'Checklist Pré-Cirúrgico', description: 'Verificações antes do procedimento', category: 'checklists', type: 'xlsx', size: '72 KB', downloads: 423 },
  { id: '20', title: 'Checklist de Pós-Venda', description: 'Acompanhamento do paciente após fechamento', category: 'checklists', type: 'xlsx', size: '68 KB', downloads: 345 },
];

const categories = [
  { id: 'all', name: 'Todos', icon: FolderOpen },
  { id: 'pops', name: 'POPs & Protocolos', icon: Stethoscope },
  { id: 'scripts', name: 'Scripts de Venda', icon: DollarSign },
  { id: 'contratos', name: 'Contratos & Termos', icon: Shield },
  { id: 'guias', name: 'Guias de Orientação', icon: BookOpen },
  { id: 'checklists', name: 'Checklists', icon: ClipboardList },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
    case 'doc': return <File className="h-5 w-5 text-blue-500" />;
    case 'xlsx': return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    default: return <File className="h-5 w-5" />;
  }
};

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (categoryId: string) => categoryId === 'all' ? materials.length : materials.filter(m => m.category === categoryId).length;

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Central de Materiais
          </h1>
          <p className="text-sm text-muted-foreground">POPs, protocolos, scripts, contratos e guias</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar materiais..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Categories Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4">
                <cat.icon className="h-4 w-4" />{cat.name}
                <Badge variant="secondary" className="ml-1 text-xs">{getCategoryCount(cat.id)}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">{getFileIcon(material.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{material.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{material.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{material.size} • {material.downloads} downloads</span>
                      <Button size="sm" variant="ghost" className="h-7 px-2"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum material encontrado</p>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
