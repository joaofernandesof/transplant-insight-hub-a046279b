/**
 * ProcedureSelector - Componente de seleção de procedimentos médicos
 * Com autocomplete para lista pré-definida e opção de adicionar manualmente
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista de procedimentos pré-definidos
const PREDEFINED_PROCEDURES = [
  "🧪 Avaliação antropométrica",
  "🧠 Avaliação de risco cirúrgico",
  "🩺 Avaliação médica especializada",
  "🧠 Avaliação neuropsicológica",
  "🧠 Avaliação neurológica",
  "🦴 Avaliação ortopédica",
  "🫀 Avaliação cardiológica",
  "🫁 Avaliação pneumológica",
  "🧠 Avaliação psiquiátrica",
  "🧠 Avaliação psicológica clínica",
  "🧫 Biópsia de colo uterino",
  "🧫 Biópsia de pele",
  "⚖️ Bioimpedância",
  "💉 Bioestimulador de colágeno",
  "🔍 Colposcopia",
  "🧾 Consulta clínica geral",
  "🧴 Consulta de dermatologia",
  "🫀 Consulta de cardiologia",
  "🧠 Consulta de neurologia",
  "🍽️ Consulta de nutrição",
  "👶 Consulta pediátrica",
  "👩‍⚕️ Consulta ginecológica",
  "🧔‍♂️ Consulta urológica",
  "🧠 Consulta psiquiátrica",
  "🧠 Consulta psicológica",
  "🧬 Consulta de tricologia (avaliação capilar)",
  "🧬 Check-up cardiológico",
  "🧬 Check-up completo",
  "🧬 Check-up hormonal",
  "🧬 Check-up metabólico",
  "🧬 Check-up urológico",
  "🧾 Curativo complexo",
  "🩹 Curativo simples",
  "❄️ Crioterapia dermatológica",
  "🧫 Cultura de secreção",
  "🧽 Desbridamento de ferida",
  "🧽 Drenagem de abscesso pequeno",
  "💧 Hidratação venosa (soro)",
  "💉 Imunização, vacinação",
  "💊 Implante contraceptivo (inserção)",
  "💊 Implante contraceptivo (retirada)",
  "🧬 Inserção de DIU",
  "💉 Intradermoterapia",
  "💉 Lavagem de ouvido (remoção de cerúmen)",
  "💆‍♀️ Limpeza de pele",
  "📄 Laudo psicológico",
  "📄 Laudo psiquiátrico",
  "✨ Laser para cicatrizes",
  "✨ Laser para depilação",
  "✨ Laser para manchas",
  "✨ Laser para vasos",
  "💉 Mesoterapia",
  "💉 Mesoterapia capilar",
  "💉 Microagulhamento",
  "💉 Microagulhamento capilar",
  "🧴 Peeling químico",
  "🧴 Peeling superficial",
  "🧍 Pilates clínico",
  "🍃 Plano alimentar personalizado",
  "🧪 PRP (plasma rico em plaquetas)",
  "🧪 PRP capilar",
  "🤰 Pré-natal",
  "👶 Puericultura",
  "🧾 Relatório médico detalhado",
  "🧻 Retirada de pontos",
  "🧾 Segunda opinião médica",
  "🧻 Troca de curativo pós-operatório",
  "🧻 Troca de sonda vesical",
  "💉 Toxina botulínica (botox)",
  "🧬 Transplante capilar",
  "🧬 Transplante de barba",
  "🧬 Transplante de sobrancelhas",
  "🧬 Tratamento de acne",
  "🧬 Tratamento de calvície",
  "🧬 Tratamento de caspa (dermatite seborreica)",
  "🧬 Tratamento de queda de cabelo",
  "🧬 Tratamento de melasma",
  "🧬 Tratamento de rosácea",
  "🧬 Tricoscopia (exame do couro cabeludo)",
  "🧬 Tricograma (avaliação do fio)",
  "🩻 Ultrassom no consultório (avaliação)",
  "🧬 Vasectomia (ambulatorial)",
];

interface ProcedureSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function ProcedureSelector({
  value = [],
  onChange,
  placeholder = "Buscar ou adicionar procedimento...",
  className,
}: ProcedureSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualInput, setManualInput] = useState("");

  // Filtrar procedimentos disponíveis (não selecionados)
  const availableProcedures = useMemo(() => {
    return PREDEFINED_PROCEDURES.filter(
      (proc) => !value.includes(proc)
    );
  }, [value]);

  // Filtrar pela busca
  const filteredProcedures = useMemo(() => {
    if (!searchQuery) return availableProcedures;
    const query = searchQuery.toLowerCase();
    return availableProcedures.filter((proc) =>
      proc.toLowerCase().includes(query)
    );
  }, [availableProcedures, searchQuery]);

  // Verificar se o termo de busca existe na lista
  const isNewProcedure = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    // Verifica se já está selecionado ou se existe na lista
    const existsInList = PREDEFINED_PROCEDURES.some(
      (proc) => proc.toLowerCase().includes(query)
    );
    const alreadySelected = value.some(
      (v) => v.toLowerCase() === query
    );
    return !existsInList && !alreadySelected;
  }, [searchQuery, value]);

  const addProcedure = (procedure: string) => {
    if (!value.includes(procedure)) {
      onChange([...value, procedure]);
    }
    setSearchQuery("");
    setOpen(false);
  };

  const addManualProcedure = () => {
    const trimmed = manualInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, `📋 ${trimmed}`]);
      setManualInput("");
    }
  };

  const removeProcedure = (procedure: string) => {
    onChange(value.filter((v) => v !== procedure));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Lista de procedimentos selecionados */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((proc, index) => (
            <Badge
              key={`${proc}-${index}`}
              variant="secondary"
              className="px-3 py-1.5 text-sm flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <span>{proc}</span>
              <button
                type="button"
                onClick={() => removeProcedure(proc)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Seletor com autocomplete */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-muted-foreground font-normal"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite para buscar..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty className="py-3 px-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nenhum procedimento encontrado.
                  </p>
                  {searchQuery.trim() && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => addProcedure(`📋 ${searchQuery.trim()}`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar "{searchQuery.trim()}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup heading="Procedimentos disponíveis">
                <ScrollArea className="h-[250px]">
                  {filteredProcedures.map((proc) => (
                    <CommandItem
                      key={proc}
                      value={proc}
                      onSelect={() => addProcedure(proc)}
                      className="cursor-pointer"
                    >
                      <span className="flex-1">{proc}</span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                  {/* Opção de adicionar manualmente se não encontrado */}
                  {isNewProcedure && (
                    <CommandItem
                      value={`add-${searchQuery}`}
                      onSelect={() => addProcedure(`📋 ${searchQuery.trim()}`)}
                      className="cursor-pointer border-t mt-2 pt-2"
                    >
                      <Plus className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-primary">
                        Adicionar "{searchQuery.trim()}" manualmente
                      </span>
                    </CommandItem>
                  )}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Input manual alternativo */}
      <div className="flex gap-2">
        <Input
          placeholder="Ou digite um procedimento manualmente..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addManualProcedure();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addManualProcedure}
          disabled={!manualInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Contador */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} procedimento{value.length !== 1 ? "s" : ""} selecionado{value.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
