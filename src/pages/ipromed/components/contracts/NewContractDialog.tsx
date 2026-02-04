/**
 * Modal para criar novo contrato IPROMED
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewContractDialog({ open, onOpenChange }: NewContractDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    contract_type: "service",
    description: "",
  });

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get next contract number
      const { data: lastContract } = await supabase
        .from('ipromed_contracts')
        .select('contract_number')
        .like('contract_number', 'CONTRATO_%')
        .order('contract_number', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastContract && lastContract.length > 0) {
        const lastNum = parseInt(lastContract[0].contract_number.replace('CONTRATO_', ''), 10);
        if (!isNaN(lastNum)) nextNumber = lastNum + 1;
      }
      const contractNumber = `CONTRATO_${nextNumber.toString().padStart(4, '0')}`;

      const { error } = await supabase
        .from('ipromed_contracts')
        .insert({
          title: formData.title,
          client_id: formData.client_id || null,
          contract_type: formData.contract_type,
          description: formData.description || null,
          contract_number: contractNumber,
          status: 'draft',
        });

      if (error) throw error;

      toast.success("Contrato criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['ipromed-contracts'] });
      onOpenChange(false);
      setFormData({ title: "", client_id: "", contract_type: "service", description: "" });
    } catch (error: any) {
      console.error("Error creating contract:", error);
      toast.error(error.message || "Erro ao criar contrato");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo contrato jurídico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Contrato *</Label>
            <Input
              id="title"
              placeholder="Ex: Contrato de Assessoria Jurídica"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === "__none__" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem cliente vinculado</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Contrato</Label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Prestação de Serviço</SelectItem>
                <SelectItem value="partnership">Parceria</SelectItem>
                <SelectItem value="advisory">Assessoria Jurídica</SelectItem>
                <SelectItem value="consulting">Consultoria</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre o contrato..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Contrato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
