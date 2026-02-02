/**
 * VariablesPalette - Paleta de variáveis arrastáveis para mensagens
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Link2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserCircle,
  Stethoscope,
  MapPin,
  Tag,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Categorias de variáveis
interface Variable {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  example: string;
}

interface VariableCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  variables: Variable[];
}

const VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    id: 'lead',
    name: 'Dados do Lead',
    icon: <User className="h-4 w-4" />,
    variables: [
      { key: '{{nome}}', label: 'Nome Completo', description: 'Nome completo do lead', icon: <User className="h-3 w-3" />, example: 'Maria Silva Santos' },
      { key: '{{primeiro_nome}}', label: 'Primeiro Nome', description: 'Apenas o primeiro nome', icon: <UserCircle className="h-3 w-3" />, example: 'Maria' },
      { key: '{{telefone}}', label: 'Telefone', description: 'Telefone do lead', icon: <Phone className="h-3 w-3" />, example: '(11) 99999-9999' },
      { key: '{{email}}', label: 'Email', description: 'Email do lead', icon: <Mail className="h-3 w-3" />, example: 'maria@email.com' },
    ]
  },
  {
    id: 'procedimento',
    name: 'Procedimento',
    icon: <Stethoscope className="h-4 w-4" />,
    variables: [
      { key: '{{procedimento}}', label: 'Nome do Procedimento', description: 'Tipo de procedimento de interesse', icon: <Stethoscope className="h-3 w-3" />, example: 'Transplante Capilar FUE' },
      { key: '{{valor}}', label: 'Valor', description: 'Valor do orçamento', icon: <DollarSign className="h-3 w-3" />, example: 'R$ 15.000,00' },
      { key: '{{desconto}}', label: 'Desconto', description: 'Percentual de desconto oferecido', icon: <Tag className="h-3 w-3" />, example: '10%' },
    ]
  },
  {
    id: 'clinica',
    name: 'Dados da Clínica',
    icon: <Building2 className="h-4 w-4" />,
    variables: [
      { key: '{{clinica}}', label: 'Nome da Clínica', description: 'Nome da sua clínica', icon: <Building2 className="h-3 w-3" />, example: 'Clínica Excellence' },
      { key: '{{atendente}}', label: 'Nome do Atendente', description: 'Seu nome ou do atendente', icon: <UserCircle className="h-3 w-3" />, example: 'Ana' },
      { key: '{{profissional}}', label: 'Nome do Profissional', description: 'Médico/Especialista', icon: <Stethoscope className="h-3 w-3" />, example: 'Dr. João Silva' },
      { key: '{{telefone_clinica}}', label: 'Telefone da Clínica', description: 'Telefone de contato', icon: <Phone className="h-3 w-3" />, example: '(11) 3333-4444' },
      { key: '{{endereco_clinica}}', label: 'Endereço', description: 'Endereço completo da clínica', icon: <MapPin className="h-3 w-3" />, example: 'Av. Paulista, 1000 - SP' },
    ]
  },
  {
    id: 'agendamento',
    name: 'Agendamento',
    icon: <Calendar className="h-4 w-4" />,
    variables: [
      { key: '{{data_consulta}}', label: 'Data da Consulta', description: 'Data agendada', icon: <Calendar className="h-3 w-3" />, example: '15/02/2026' },
      { key: '{{horario_consulta}}', label: 'Horário', description: 'Horário agendado', icon: <Clock className="h-3 w-3" />, example: '14:30' },
      { key: '{{dia_semana}}', label: 'Dia da Semana', description: 'Nome do dia', icon: <Calendar className="h-3 w-3" />, example: 'Segunda-feira' },
      { key: '{{link_agendamento}}', label: 'Link de Agendamento', description: 'Link para agendar online', icon: <Link2 className="h-3 w-3" />, example: 'https://agenda.clinica.com/agendar' },
      { key: '{{link_reuniao}}', label: 'Link da Reunião', description: 'Link para videochamada', icon: <Link2 className="h-3 w-3" />, example: 'https://meet.google.com/xxx' },
    ]
  },
];

interface VariablesPaletteProps {
  onInsertVariable: (variable: string) => void;
  compact?: boolean;
}

export function VariablesPalette({ onInsertVariable, compact = false }: VariablesPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['lead']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success('Variável copiada!');
  };

  const handleInsert = (variable: string) => {
    onInsertVariable(variable);
    toast.success('Variável inserida!');
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Clique para inserir variáveis
        </p>
        <div className="flex flex-wrap gap-1">
          {VARIABLE_CATEGORIES.flatMap(cat => cat.variables).slice(0, 8).map(variable => (
            <Badge
              key={variable.key}
              variant="outline"
              className="cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.2)] hover:border-[hsl(var(--avivar-primary))] transition-colors text-xs"
              onClick={() => handleInsert(variable.key)}
            >
              {variable.key}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
          Variáveis Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 pt-0 space-y-2">
            {VARIABLE_CATEGORIES.map(category => (
              <Collapsible
                key={category.id}
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                  >
                    <span className="flex items-center gap-2">
                      {category.icon}
                      {category.name}
                    </span>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {category.variables.map(variable => (
                    <div
                      key={variable.key}
                      className={cn(
                        "group flex items-center gap-2 p-2 rounded-lg border border-transparent",
                        "hover:border-[hsl(var(--avivar-primary)/0.3)] hover:bg-[hsl(var(--avivar-primary)/0.05)]",
                        "cursor-pointer transition-all"
                      )}
                      onClick={() => handleInsert(variable.key)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', variable.key);
                      }}
                    >
                      <div className="w-6 h-6 rounded bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center text-[hsl(var(--avivar-primary))]">
                        {variable.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)] px-1.5 py-0.5 rounded">
                            {variable.key}
                          </code>
                        </div>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate">
                          {variable.description}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-[hsl(var(--avivar-muted-foreground))]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(variable.key);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <GripVertical className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] cursor-grab" />
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export { VARIABLE_CATEGORIES, type Variable, type VariableCategory };
