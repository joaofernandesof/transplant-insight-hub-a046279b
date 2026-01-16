import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  Building,
  Shield,
  Scale,
  Download
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  required: boolean;
}

const initialChecklist: ChecklistItem[] = [
  // Documentação Básica
  { id: '1', title: 'CNPJ Ativo', description: 'Cadastro Nacional de Pessoa Jurídica', category: 'documentacao', completed: true, required: true },
  { id: '2', title: 'Contrato Social', description: 'Registrado na Junta Comercial', category: 'documentacao', completed: true, required: true },
  { id: '3', title: 'Inscrição Estadual', description: 'Se aplicável ao seu estado', category: 'documentacao', completed: false, required: false },
  { id: '4', title: 'Inscrição Municipal', description: 'Cadastro no município', category: 'documentacao', completed: true, required: true },
  
  // Alvarás e Licenças
  { id: '5', title: 'Alvará de Funcionamento', description: 'Emitido pela prefeitura local', category: 'alvaras', completed: true, required: true },
  { id: '6', title: 'Licença Sanitária (Vigilância)', description: 'Vigilância Sanitária municipal/estadual', category: 'alvaras', completed: false, required: true },
  { id: '7', title: 'AVCB (Bombeiros)', description: 'Auto de Vistoria do Corpo de Bombeiros', category: 'alvaras', completed: false, required: true },
  { id: '8', title: 'Licença Ambiental', description: 'Se aplicável à sua região', category: 'alvaras', completed: true, required: false },
  
  // Compliance Médico
  { id: '9', title: 'CRM do Responsável Técnico', description: 'Registro ativo no Conselho Regional', category: 'medico', completed: true, required: true },
  { id: '10', title: 'Registro no CRM como PJ', description: 'Clínica registrada no conselho', category: 'medico', completed: true, required: true },
  { id: '11', title: 'Protocolos de Esterilização', description: 'Documentados e validados', category: 'medico', completed: false, required: true },
  { id: '12', title: 'PGRSS', description: 'Plano de Gerenciamento de Resíduos', category: 'medico', completed: false, required: true },
  
  // LGPD e Jurídico
  { id: '13', title: 'Política de Privacidade', description: 'Conforme LGPD', category: 'juridico', completed: true, required: true },
  { id: '14', title: 'Termos de Consentimento', description: 'TCLE atualizados', category: 'juridico', completed: true, required: true },
  { id: '15', title: 'Contrato de Prestação de Serviços', description: 'Modelo validado juridicamente', category: 'juridico', completed: true, required: true },
  { id: '16', title: 'Autorização de Uso de Imagem', description: 'Para marketing e documentação', category: 'juridico', completed: false, required: false },
];

const categories = [
  { id: 'documentacao', name: 'Documentação Básica', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { id: 'alvaras', name: 'Alvarás e Licenças', icon: Building, color: 'bg-amber-100 text-amber-600' },
  { id: 'medico', name: 'Compliance Médico', icon: Shield, color: 'bg-red-100 text-red-600' },
  { id: 'juridico', name: 'LGPD e Jurídico', icon: Scale, color: 'bg-purple-100 text-purple-600' },
];

export default function Regularization() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(initialChecklist);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const totalItems = checklist.length;
  const completedItems = checklist.filter(i => i.completed).length;
  const requiredItems = checklist.filter(i => i.required);
  const completedRequired = requiredItems.filter(i => i.completed).length;
  const overallProgress = Math.round((completedItems / totalItems) * 100);

  const getStatusColor = () => {
    const requiredProgress = (completedRequired / requiredItems.length) * 100;
    if (requiredProgress === 100) return 'text-green-600';
    if (requiredProgress >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBadge = () => {
    const requiredProgress = (completedRequired / requiredItems.length) * 100;
    if (requiredProgress === 100) return { label: 'Regularizada', color: 'bg-green-100 text-green-700' };
    if (requiredProgress >= 50) return { label: 'Em Andamento', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Pendente', color: 'bg-red-100 text-red-700' };
  };

  const status = getStatusBadge();

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
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  Regularização da Clínica
                </h1>
                <p className="text-sm text-muted-foreground">Checklist de documentação e compliance</p>
              </div>
            </div>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Progress Overview */}
        <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-emerald-700 mb-1">Progresso Geral</p>
                <p className="text-3xl font-bold text-emerald-900">{overallProgress}%</p>
                <Progress value={overallProgress} className="h-2 mt-2" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 mb-1">Itens Concluídos</p>
                <p className="text-3xl font-bold text-emerald-900">{completedItems}/{totalItems}</p>
                <p className="text-xs text-emerald-600 mt-1">de todos os itens</p>
              </div>
              <div>
                <p className="text-sm text-emerald-700 mb-1">Obrigatórios</p>
                <p className={`text-3xl font-bold ${getStatusColor()}`}>{completedRequired}/{requiredItems.length}</p>
                <p className="text-xs text-emerald-600 mt-1">itens obrigatórios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        {categories.map((category) => {
          const categoryItems = checklist.filter(i => i.category === category.id);
          const categoryCompleted = categoryItems.filter(i => i.completed).length;
          
          return (
            <Card key={category.id} className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {categoryCompleted}/{categoryItems.length} concluídos
                      </CardDescription>
                    </div>
                  </div>
                  <Progress 
                    value={(categoryCompleted / categoryItems.length) * 100} 
                    className="w-24 h-2" 
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      item.completed ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox 
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </p>
                        {item.required && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : item.required ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            Ver Modelos de Documentos
          </Button>
        </div>
      </main>
    </div>
  );
}
