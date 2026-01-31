import { useState } from "react";
import { Plus, MapPin, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { NewAgenda, useAvivarAgendas } from "@/hooks/useAvivarAgendas";

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

interface CreateAvivarAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAvivarAgendaDialog({
  open,
  onOpenChange,
}: CreateAvivarAgendaDialogProps) {
  const { createAgenda } = useAvivarAgendas();
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
    onOpenChange(false);
    setNewAgenda({
      name: "",
      professional_name: "",
      city: "",
      address: "",
      phone: "",
      color: AGENDA_COLORS[0],
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setNewAgenda({
      name: "",
      professional_name: "",
      city: "",
      address: "",
      phone: "",
      color: AGENDA_COLORS[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!newAgenda.name.trim() || createAgenda.isPending}
          >
            {createAgenda.isPending ? "Criando..." : "Criar Agenda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
