import { useState } from "react";
import { ChevronDown, Plus, MapPin, User, Phone, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvivarAgenda, useAvivarAgendas, NewAgenda } from "@/hooks/useAvivarAgendas";

interface AgendaSelectorProps {
  selectedAgenda: AvivarAgenda | null;
  onSelect: (agenda: AvivarAgenda | null) => void;
  /** "default" shows full button, "compact" shows only a small dropdown trigger */
  variant?: "default" | "compact";
}

const AGENDA_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function AgendaSelector({ selectedAgenda, onSelect, variant = "default" }: AgendaSelectorProps) {
  const { agendas, createAgenda, isLoading } = useAvivarAgendas();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAgenda, setNewAgenda] = useState<NewAgenda>({
    name: "",
    professional_name: "",
    city: "",
    address: "",
    phone: "",
    color: AGENDA_COLORS[0],
  });

  const handleCreate = async () => {
    if (!newAgenda.name.trim()) return;

    await createAgenda.mutateAsync(newAgenda);
    setIsDialogOpen(false);
    setNewAgenda({
      name: "",
      professional_name: "",
      city: "",
      address: "",
      phone: "",
      color: AGENDA_COLORS[0],
    });
  };

  if (isLoading) {
    return (
      <div className="h-10 w-48 animate-pulse bg-muted rounded-md" />
    );
  }

  // Se não há agendas, mostrar botão de criar
  if (agendas.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          className="border-dashed"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Agenda
        </Button>
        <CreateAgendaDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          newAgenda={newAgenda}
          setNewAgenda={setNewAgenda}
          onSubmit={handleCreate}
          isLoading={createAgenda.isPending}
        />
      </>
    );
  }

  // Compact variant - just a small dropdown trigger
  if (variant === "compact") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Trocar agenda</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[250px]">
            <DropdownMenuItem onClick={() => onSelect(null)}>
              <span className="text-muted-foreground">Todas as agendas</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {agendas.map((agenda) => (
              <DropdownMenuItem
                key={agenda.id}
                onClick={() => onSelect(agenda)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: agenda.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{agenda.professional_name || agenda.name}</p>
                  {agenda.city && (
                    <p className="text-xs text-muted-foreground truncate">
                      {agenda.city}
                    </p>
                  )}
                </div>
                {selectedAgenda?.id === agenda.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Agenda
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateAgendaDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          newAgenda={newAgenda}
          setNewAgenda={setNewAgenda}
          onSubmit={handleCreate}
          isLoading={createAgenda.isPending}
        />
      </>
    );
  }

  // Default variant - full button with agenda name
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-between">
            <div className="flex items-center gap-2">
              {selectedAgenda ? (
                <>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedAgenda.color }}
                  />
                  <span className="truncate max-w-[150px]">{selectedAgenda.professional_name || selectedAgenda.name}</span>
                  {selectedAgenda.city && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedAgenda.city}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Todas as agendas</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuItem onClick={() => onSelect(null)}>
            <span className="text-muted-foreground">Todas as agendas</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {agendas.map((agenda) => (
            <DropdownMenuItem
              key={agenda.id}
              onClick={() => onSelect(agenda)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: agenda.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{agenda.professional_name || agenda.name}</p>
                {agenda.city && (
                  <p className="text-xs text-muted-foreground truncate">
                    {agenda.city}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Agenda
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateAgendaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newAgenda={newAgenda}
        setNewAgenda={setNewAgenda}
        onSubmit={handleCreate}
        isLoading={createAgenda.isPending}
      />
    </>
  );
}

interface CreateAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newAgenda: NewAgenda;
  setNewAgenda: (agenda: NewAgenda) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

function CreateAgendaDialog({
  open,
  onOpenChange,
  newAgenda,
  setNewAgenda,
  onSubmit,
  isLoading,
}: CreateAgendaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Agenda</DialogTitle>
          <DialogDescription>
            Crie uma nova agenda para gerenciar horários de um profissional ou unidade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Agenda *</Label>
            <Input
              id="name"
              placeholder="Ex: Agenda São Paulo, Dr. João"
              value={newAgenda.name}
              onChange={(e) => setNewAgenda({ ...newAgenda, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="professional">Profissional</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="professional"
                placeholder="Nome do profissional"
                className="pl-9"
                value={newAgenda.professional_name || ""}
                onChange={(e) => setNewAgenda({ ...newAgenda, professional_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="city"
                placeholder="Ex: São Paulo"
                className="pl-9"
                value={newAgenda.city || ""}
                onChange={(e) => setNewAgenda({ ...newAgenda, city: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              placeholder="Endereço completo"
              value={newAgenda.address || ""}
              onChange={(e) => setNewAgenda({ ...newAgenda, address: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                className="pl-9"
                value={newAgenda.phone || ""}
                onChange={(e) => setNewAgenda({ ...newAgenda, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {AGENDA_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    newAgenda.color === color
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewAgenda({ ...newAgenda, color })}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={!newAgenda.name.trim() || isLoading}
          >
            {isLoading ? "Criando..." : "Criar Agenda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
