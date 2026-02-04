/**
 * CPG Advocacia Médica - Documentos Jurídicos Preventivos
 * Lista de documentos oferecidos pela CPG Advocacia Médica
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSignature,
  Shield,
  Lock,
  Image,
  Calendar,
  ClipboardList,
  UserCheck,
  Video,
  AlertOctagon,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";

// Documentos preventivos da CPG Advocacia Médica
export interface PreventiveDocument {
  id: string;
  name: string;
  description: string;
  category: 'contrato' | 'tcle' | 'politica' | 'termo';
  icon: React.ElementType;
  marketValue?: number;
  includedInPlan: boolean;
}

export const preventiveDocuments: PreventiveDocument[] = [
  {
    id: "contrato-prestacao",
    name: "Contrato de Prestação de Serviços",
    description: "Contrato padrão para formalização do relacionamento médico-paciente",
    category: "contrato",
    icon: FileSignature,
    marketValue: 2500,
    includedInPlan: true,
  },
  {
    id: "anamnese-guiado",
    name: "Formulário de Anamnese Guiado",
    description: "Modelo completo de anamnese com campos estratégicos para proteção jurídica",
    category: "termo",
    icon: ClipboardList,
    marketValue: 1200,
    includedInPlan: true,
  },
  {
    id: "politica-agendamento",
    name: "Política de Agendamento",
    description: "Regras claras para agendamentos, faltas e remarcações",
    category: "politica",
    icon: Calendar,
    marketValue: 800,
    includedInPlan: true,
  },
  {
    id: "termo-imagem",
    name: "Termo de Uso de Imagem",
    description: "Autorização para uso de fotos e vídeos de procedimentos",
    category: "termo",
    icon: Image,
    marketValue: 1000,
    includedInPlan: true,
  },
  {
    id: "politica-prontuario",
    name: "Política de Prontuário",
    description: "Normas para guarda, acesso e compartilhamento de prontuários",
    category: "politica",
    icon: Lock,
    marketValue: 1500,
    includedInPlan: true,
  },
  {
    id: "termo-sigilo",
    name: "Termo de Sigilo",
    description: "Compromisso de confidencialidade para equipe e colaboradores",
    category: "termo",
    icon: Shield,
    marketValue: 800,
    includedInPlan: true,
  },
  {
    id: "tcle-teleconsulta",
    name: "TCLE para Teleconsulta",
    description: "Termo específico para atendimentos remotos conforme regulamentação",
    category: "tcle",
    icon: Video,
    marketValue: 1500,
    includedInPlan: true,
  },
  {
    id: "termo-recusa",
    name: "Termo de Recusa de Tratamento",
    description: "Documentação formal da recusa do paciente a tratamento recomendado",
    category: "termo",
    icon: AlertOctagon,
    marketValue: 1200,
    includedInPlan: true,
  },
  {
    id: "tcles-especificos",
    name: "TCLEs Específicos por Procedimento",
    description: "Termos de consentimento personalizados para cada tipo de procedimento",
    category: "tcle",
    icon: UserCheck,
    marketValue: 4700,
    includedInPlan: true,
  },
];

// Valor total de mercado dos documentos
export const totalMarketValue = preventiveDocuments.reduce(
  (acc, doc) => acc + (doc.marketValue || 0), 
  0
);

const categoryConfig = {
  contrato: { label: 'Contrato', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  tcle: { label: 'TCLE', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  politica: { label: 'Política', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  termo: { label: 'Termo', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

interface DocumentCardProps {
  document: PreventiveDocument;
  onGenerate?: () => void;
  onView?: () => void;
}

export function DocumentCard({ document, onGenerate, onView }: DocumentCardProps) {
  const Icon = document.icon;
  const category = categoryConfig[document.category];

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg ${category.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{document.name}</h4>
              {document.includedInPlan && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Incluso
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {document.description}
            </p>
            {document.marketValue && (
              <p className="text-xs text-muted-foreground mt-1">
                Valor de mercado: <span className="font-medium">R$ {document.marketValue.toLocaleString('pt-BR')}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1" onClick={onView}>
            <Eye className="h-3 w-3" />
            Visualizar
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1" onClick={onGenerate}>
            <Sparkles className="h-3 w-3" />
            Gerar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PreventiveDocumentsGridProps {
  onGenerateDocument?: (docId: string) => void;
  onViewDocument?: (docId: string) => void;
}

export function PreventiveDocumentsGrid({ onGenerateDocument, onViewDocument }: PreventiveDocumentsGridProps) {
  return (
    <div className="space-y-6">
      {/* Header com valor total */}
      <Card className="border-none bg-gradient-to-r from-[#00629B]/10 to-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Documentação Jurídica Preventiva</h3>
              <p className="text-sm text-muted-foreground">
                Todos os documentos que você precisa para exercer a medicina com segurança
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor de mercado</p>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {totalMarketValue.toLocaleString('pt-BR')}
              </p>
              <Badge className="bg-emerald-100 text-emerald-700 mt-1">
                Incluso nos planos
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {preventiveDocuments.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onGenerate={() => onGenerateDocument?.(doc.id)}
            onView={() => onViewDocument?.(doc.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default PreventiveDocumentsGrid;
