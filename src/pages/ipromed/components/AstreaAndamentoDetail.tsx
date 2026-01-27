/**
 * IPROMED - Astrea-style Andamento Detail Modal
 * Modal de detalhes de andamento com ações inspirado no Astrea
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MessageCircle,
  Tag,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import AstreaTaskForm from "./AstreaTaskForm";

interface Andamento {
  id: string;
  date: string;
  title: string;
  caseNumber: string;
  caseTitle: string;
  court: string;
  isImportant: boolean;
  hasIA: boolean;
}

interface AstreaAndamentoDetailProps {
  isOpen: boolean;
  onClose: () => void;
  andamento?: Andamento;
}

const mockAndamento: Andamento = {
  id: '1',
  date: '04/06/2025',
  title: 'Juntada de Outros documentos',
  caseNumber: '5194147-26.2023 8.13.0024',
  caseTitle: 'INVESTIMENTOS PARTICIPACOES S/A - CNPJ: 2',
  court: 'Concurso de Credores (5000)',
  isImportant: true,
  hasIA: true,
};

export default function AstreaAndamentoDetail({ isOpen, onClose, andamento = mockAndamento }: AstreaAndamentoDetailProps) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeTab, setActiveTab] = useState('activities');

  if (showTaskForm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-muted-foreground uppercase">
              Adicionar Tarefa
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">
            {andamento.title}
          </div>
          <AstreaTaskForm 
            onClose={() => setShowTaskForm(false)}
            initialData={{
              description: 'Marcar reunião com cliente',
              caseTitle: andamento.title,
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Andamento automático
            </DialogTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowTaskForm(true)}>
                    Adicionar tarefa
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Adicionar evento
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Adicionar histórico manual
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="text-sm font-medium">{andamento.date}</div>

          {/* Case Info */}
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Processo: </span>
              <a href="#" className="text-[#0066CC] hover:underline">
                {andamento.caseTitle}
              </a>
            </div>
          </div>

          {/* Movement Title */}
          <div className="text-sm">{andamento.title}</div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="border-b w-full justify-start rounded-none bg-transparent h-auto p-0">
              <TabsTrigger 
                value="activities" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0066CC] data-[state=active]:bg-transparent px-4 py-2"
              >
                Atividades
              </TabsTrigger>
              <TabsTrigger 
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0066CC] data-[state=active]:bg-transparent px-4 py-2"
              >
                Comentários
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Não há atividades programadas
              </p>
            </TabsContent>

            <TabsContent value="comments" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Nenhum comentário ainda
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
