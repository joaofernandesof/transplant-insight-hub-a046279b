/**
 * CPG Advocacia Médica - Global Search Component
 * Busca unificada de processos, clientes, tarefas e documentos
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  FolderOpen,
  Users,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Command,
  X,
  Building2,
  Scale,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'process' | 'client' | 'task' | 'document' | 'contract';
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  route: string;
  icon: React.ElementType;
  highlight?: string;
}

// Mock data for search - in production, this would come from Supabase
const mockSearchData: Omit<SearchResult, 'highlight'>[] = [
  // Processos
  { id: '1', type: 'process', title: '0001234-12.2024.8.26.0100', subtitle: 'Maria Silva vs INSS - Aposentadoria', status: 'Ativo', statusColor: 'bg-emerald-500', route: '/ipromed/legal?tab=cases', icon: FolderOpen },
  { id: '2', type: 'process', title: '0005678-34.2024.8.26.0100', subtitle: 'João Santos - Auxílio Doença', status: 'Aguardando', statusColor: 'bg-amber-500', route: '/ipromed/legal?tab=cases', icon: FolderOpen },
  { id: '3', type: 'process', title: '0009876-56.2024.8.26.0100', subtitle: 'Ana Oliveira - BPC LOAS', status: 'Em Recurso', statusColor: 'bg-blue-500', route: '/ipromed/legal?tab=cases', icon: FolderOpen },
  
  // Clientes
  { id: '4', type: 'client', title: 'Maria Silva', subtitle: 'CPF: 123.456.789-00 • 3 processos ativos', route: '/ipromed/clients', icon: Users },
  { id: '5', type: 'client', title: 'João Santos', subtitle: 'CPF: 987.654.321-00 • 1 processo ativo', route: '/ipromed/clients', icon: Users },
  { id: '6', type: 'client', title: 'Ana Paula Oliveira', subtitle: 'CPF: 456.789.123-00 • 2 processos ativos', route: '/ipromed/clients', icon: Users },
  { id: '7', type: 'client', title: 'Carlos Eduardo Ferreira', subtitle: 'CPF: 321.654.987-00 • Contrato pendente', route: '/ipromed/clients', icon: Users },
  
  // Tarefas
  { id: '8', type: 'task', title: 'Elaborar petição inicial', subtitle: 'Maria Silva • Prazo: 15/02/2026', status: 'Urgente', statusColor: 'bg-red-500', route: '/ipromed/legal?tab=tasks', icon: CheckCircle },
  { id: '9', type: 'task', title: 'Preparar recurso', subtitle: 'João Santos • Prazo: 20/02/2026', status: 'Pendente', statusColor: 'bg-amber-500', route: '/ipromed/legal?tab=tasks', icon: CheckCircle },
  { id: '10', type: 'task', title: 'Audiência de instrução', subtitle: 'Ana Oliveira • 10/02/2026 às 14h', status: 'Agendada', statusColor: 'bg-blue-500', route: '/ipromed/legal?tab=agenda', icon: Calendar },
  
  // Documentos (agora centralizados em contratos)
  { id: '11', type: 'document', title: 'Procuração Maria Silva', subtitle: 'Documento • Atualizado em 01/02/2026', route: '/ipromed/legal?tab=contracts', icon: FileText },
  { id: '12', type: 'document', title: 'Laudo Médico João Santos', subtitle: 'Anexo processual • 28/01/2026', route: '/ipromed/legal?tab=contracts', icon: FileText },
  
  // Contratos
  { id: '13', type: 'contract', title: 'Contrato de Honorários #001', subtitle: 'Maria Silva • Assinado em 05/01/2026', status: 'Ativo', statusColor: 'bg-emerald-500', route: '/ipromed/contracts', icon: Scale },
  { id: '14', type: 'contract', title: 'Contrato de Honorários #002', subtitle: 'Carlos Ferreira • Aguardando assinatura', status: 'Pendente', statusColor: 'bg-amber-500', route: '/ipromed/contracts', icon: Scale },
];

const typeLabels: Record<SearchResult['type'], string> = {
  process: 'Processo',
  client: 'Cliente',
  task: 'Tarefa',
  document: 'Documento',
  contract: 'Contrato',
};

const typeColors: Record<SearchResult['type'], string> = {
  process: 'bg-blue-100 text-blue-700',
  client: 'bg-purple-100 text-purple-700',
  task: 'bg-amber-100 text-amber-700',
  document: 'bg-emerald-100 text-emerald-700',
  contract: 'bg-rose-100 text-rose-700',
};

interface IpromedGlobalSearchProps {
  isCollapsed?: boolean;
}

export default function IpromedGlobalSearch({ isCollapsed = false }: IpromedGlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ipromed_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search logic with highlighting
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = mockSearchData
      .filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
      )
      .map(item => ({
        ...item,
        highlight: searchQuery,
      }));

    setResults(filtered);
    setSelectedIndex(0);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('ipromed_recent_searches', JSON.stringify(updated));

    navigate(result.route);
    setIsOpen(false);
  };

  const highlightMatch = (text: string, highlight?: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-primary font-semibold rounded px-0.5">{part}</mark>
        : part
    );
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn(
          "gap-2 text-muted-foreground border-border hover:bg-muted/50",
          isCollapsed ? "w-10 px-0" : "w-full max-w-xs"
        )}
      >
        <Search className="h-4 w-4" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-sm">Buscar...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </>
        )}
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-0 border-b">
            <div className="flex items-center px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              <Input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar processos, clientes, tarefas, documentos..."
                className="border-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            {/* No query - show recent searches or tips */}
            {!query && (
              <div className="p-4 space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Buscas recentes
                    </p>
                    <div className="space-y-1">
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(search)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Dicas de busca
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <span className="font-medium">Número do processo</span>
                      <p className="text-xs text-muted-foreground">Ex: 0001234-12.2024</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <span className="font-medium">Nome do cliente</span>
                      <p className="text-xs text-muted-foreground">Ex: Maria Silva</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <span className="font-medium">CPF</span>
                      <p className="text-xs text-muted-foreground">Ex: 123.456.789-00</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <span className="font-medium">Tarefa</span>
                      <p className="text-xs text-muted-foreground">Ex: petição, audiência</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {query && results.length === 0 && (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm text-muted-foreground">Tente buscar por outro termo</p>
              </div>
            )}

            {query && results.length > 0 && (
              <div className="p-2">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type} className="mb-4 last:mb-0">
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {typeLabels[type as SearchResult['type']]}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((result, i) => {
                        const globalIndex = results.indexOf(result);
                        const Icon = result.icon;
                        
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                              globalIndex === selectedIndex 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg",
                              globalIndex === selectedIndex ? "bg-primary/20" : "bg-muted"
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {highlightMatch(result.title, result.highlight)}
                                </span>
                                {result.status && (
                                  <Badge className={cn("text-[10px] text-white", result.statusColor)}>
                                    {result.status}
                                  </Badge>
                                )}
                              </div>
                              {result.subtitle && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {highlightMatch(result.subtitle, result.highlight)}
                                </p>
                              )}
                            </div>
                            
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer with keyboard hints */}
          <div className="border-t p-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">↵</kbd>
                selecionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">esc</kbd>
                fechar
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Busca inteligente
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
