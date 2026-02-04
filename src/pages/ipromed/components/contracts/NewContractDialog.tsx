/**
 * Modal para criar novo contrato CPG Advocacia Médica com upload de arquivo
 */

import { useState, useRef } from "react";
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
import { Loader2, Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewContractDialog({ open, onOpenChange }: NewContractDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    contract_type: "plano_integral",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!formData.title) {
        setFormData(prev => ({ 
          ...prev, 
          title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!formData.client_id) {
      toast.error("Selecione um cliente");
      return;
    }

    setIsSubmitting(true);

    try {
      let documentUrl = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${selectedFile.name}`;
        const filePath = `contracts/${formData.client_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ipromed-documents')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Erro ao enviar arquivo');
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('ipromed-documents')
          .getPublicUrl(filePath);

        documentUrl = urlData.publicUrl;
      }

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

      // Create contract
      const { data: newContract, error } = await supabase
        .from('ipromed_contracts')
        .insert({
          title: formData.title,
          client_id: formData.client_id,
          contract_type: formData.contract_type,
          description: formData.description || null,
          contract_number: contractNumber,
          status: documentUrl ? 'active' : 'draft',
          document_url: documentUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // If file was uploaded, also create a document record
      if (documentUrl && newContract) {
        await supabase
          .from('ipromed_contract_documents')
          .insert({
            contract_id: newContract.id,
            file_name: selectedFile!.name,
            file_path: documentUrl,
            file_type: selectedFile!.type || 'application/pdf',
            file_size: selectedFile!.size,
            document_type: 'contract',
          });
      }

      toast.success("Contrato criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['ipromed-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-contracts'] });
      onOpenChange(false);
      setFormData({ title: "", client_id: "", contract_type: "plano_integral", description: "" });
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      toast.error(error.message || "Erro ao criar contrato");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({ title: "", client_id: "", contract_type: "plano_integral", description: "" });
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha os dados e anexe o documento PDF do contrato.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Documento do Contrato</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste o arquivo PDF
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Título do Contrato <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Plano Preventivo Integral de Defesa Médica"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === "__none__" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
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
                <SelectItem value="plano_integral">Plano Preventivo Integral</SelectItem>
                <SelectItem value="plano_dupla">Plano Dupla (Casal)</SelectItem>
                <SelectItem value="consultoria">Consultoria Jurídica</SelectItem>
                <SelectItem value="parecer">Parecer Jurídico</SelectItem>
                <SelectItem value="defesa_processo">Defesa em Processo</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              placeholder="Detalhes adicionais sobre o contrato..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedFile ? 'Criar e Enviar' : 'Criar Rascunho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
