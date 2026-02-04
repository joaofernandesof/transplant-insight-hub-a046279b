/**
 * Dialog de envio para assinatura digital - Inspirado no ClickSign
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  UserPlus,
  Users,
  ArrowUpDown,
  AlertCircle,
  Trash2,
  Mail,
  Calendar,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

interface Signatory {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'witness' | 'approver';
  order: number;
}

interface ContractDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  document_type: string;
}

interface SendForSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractTitle: string;
  clientName?: string;
  clientEmail?: string;
  documents: ContractDocument[];
  onSend: (data: SignatureRequestData) => Promise<void>;
  isPending?: boolean;
}

interface SignatureRequestData {
  signatories: Signatory[];
  emailSubject: string;
  emailMessage: string;
  deadline?: string;
  reminderInterval?: string;
  observers?: string[];
}

export function SendForSignatureDialog({
  open,
  onOpenChange,
  contractTitle,
  clientName,
  clientEmail,
  documents,
  onSend,
  isPending,
}: SendForSignatureDialogProps) {
  // Signatários
  const [signatories, setSignatories] = useState<Signatory[]>(
    clientName && clientEmail
      ? [{
          id: '1',
          name: clientName,
          email: clientEmail,
          role: 'signer',
          order: 1,
        }]
      : []
  );
  const [showAddSignatory, setShowAddSignatory] = useState(false);
  const [newSignatory, setNewSignatory] = useState({ name: '', email: '', role: 'signer' as const });

  // Mensagem
  const [emailSubject, setEmailSubject] = useState(`Assinar documento: ${contractTitle}`);
  const [emailMessage, setEmailMessage] = useState('');

  // Configurações avançadas
  const [configOpen, setConfigOpen] = useState(false);
  const [observersOpen, setObserversOpen] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [reminderInterval, setReminderInterval] = useState('3');
  const [observers, setObservers] = useState<string[]>([]);
  const [newObserver, setNewObserver] = useState('');

  // Validar se pode enviar
  const hasDocuments = documents.length > 0;
  const hasSignatories = signatories.length > 0;
  const canSend = hasDocuments && hasSignatories;

  const addSignatory = () => {
    if (!newSignatory.name.trim() || !newSignatory.email.trim()) {
      toast.error('Preencha nome e email do signatário');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSignatory.email)) {
      toast.error('Email inválido');
      return;
    }

    setSignatories(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newSignatory.name,
        email: newSignatory.email,
        role: newSignatory.role,
        order: prev.length + 1,
      }
    ]);
    setNewSignatory({ name: '', email: '', role: 'signer' });
    setShowAddSignatory(false);
  };

  const removeSignatory = (id: string) => {
    setSignatories(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const addMyselfAsSignatory = () => {
    // TODO: Get current user from auth
    toast.info('Funcionalidade em desenvolvimento');
  };

  const addObserver = () => {
    if (!newObserver.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newObserver)) {
      toast.error('Email inválido');
      return;
    }
    setObservers(prev => [...prev, newObserver]);
    setNewObserver('');
  };

  const handleSend = async () => {
    if (!hasDocuments) {
      toast.error('É necessário anexar pelo menos um documento antes de enviar para assinatura');
      return;
    }

    if (!hasSignatories) {
      toast.error('Adicione pelo menos um signatário');
      return;
    }

    await onSend({
      signatories,
      emailSubject,
      emailMessage,
      deadline: deadline || undefined,
      reminderInterval,
      observers: observers.length > 0 ? observers : undefined,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'signer': return 'Assinar';
      case 'witness': return 'Testemunha';
      case 'approver': return 'Aprovar';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar para Assinatura</DialogTitle>
          <DialogDescription>
            Configure os detalhes do envio para assinatura digital
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Documentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                Documentos <span className="text-destructive">*</span>
              </Label>
            </div>

            {!hasDocuments ? (
              <div className="border-2 border-dashed border-destructive/50 rounded-lg p-6 text-center bg-destructive/5">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
                <p className="font-medium text-destructive">Nenhum documento anexado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você precisa anexar pelo menos um documento antes de enviar para assinatura.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-3 space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {doc.document_type === 'contract' ? 'Contrato' : doc.document_type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signatários */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              Signatários <span className="text-destructive">*</span>
            </Label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMyselfAsSignatory}
              >
                <User className="h-4 w-4 mr-1" />
                Eu vou assinar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddSignatory(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Signatário novo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
              >
                <Users className="h-4 w-4 mr-1" />
                Signatário da agenda
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Ordenar assinaturas
              </Button>
            </div>

            {/* Lista de signatários */}
            {signatories.length > 0 && (
              <div className="border rounded-lg divide-y">
                {signatories.map(signatory => (
                  <div key={signatory.id} className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {signatory.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{signatory.name}</p>
                      <p className="text-xs text-muted-foreground">{signatory.email}</p>
                    </div>
                    <Badge variant="secondary">{getRoleLabel(signatory.role)}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeSignatory(signatory.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Form adicionar signatário */}
            {showAddSignatory && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      placeholder="Nome completo"
                      value={newSignatory.name}
                      onChange={(e) => setNewSignatory(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newSignatory.email}
                      onChange={(e) => setNewSignatory(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Função</Label>
                  <Select
                    value={newSignatory.role}
                    onValueChange={(v) => setNewSignatory(prev => ({ ...prev, role: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signer">Assinar</SelectItem>
                      <SelectItem value="witness">Testemunha</SelectItem>
                      <SelectItem value="approver">Aprovar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddSignatory(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={addSignatory}>
                    Adicionar
                  </Button>
                </div>
              </div>
            )}

            {!hasSignatories && !showAddSignatory && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Adicione pelo menos um signatário
              </p>
            )}
          </div>

          {/* Mensagem */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Mensagem (opcional)</Label>
            
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                Assunto personalizado do e-mail
              </Label>
              <Input
                placeholder="Digite o assunto do e-mail aqui"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Mensagem do e-mail</Label>
              <Textarea
                placeholder="Digite sua mensagem aqui."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Observadores */}
          <Collapsible open={observersOpen} onOpenChange={setObserversOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg">
                <span className="font-medium">Observadores (opcional)</span>
                {observersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <p className="text-sm text-muted-foreground">
                Observadores receberão notificações sobre o andamento da assinatura.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email do observador"
                  value={newObserver}
                  onChange={(e) => setNewObserver(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={addObserver}>
                  Adicionar
                </Button>
              </div>
              {observers.length > 0 && (
                <div className="space-y-1">
                  {observers.map((obs, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{obs}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setObservers(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Configurações */}
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg">
                <span className="font-medium">Configurações</span>
                {configOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data limite para assinatura
                  </Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Enviar lembretes automaticamente
                  </Label>
                  <Select value={reminderInterval} onValueChange={setReminderInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">A cada 1 dia</SelectItem>
                      <SelectItem value="2">A cada 2 dias</SelectItem>
                      <SelectItem value="3">A cada 3 dias</SelectItem>
                      <SelectItem value="5">A cada 5 dias</SelectItem>
                      <SelectItem value="7">A cada 7 dias</SelectItem>
                      <SelectItem value="0">Não enviar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!canSend || isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
