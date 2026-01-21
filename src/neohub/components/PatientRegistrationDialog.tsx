import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Mail, MessageSquare, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PatientRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PatientRegistrationDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: PatientRegistrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    cpf: '',
    birth_date: '',
    send_email: true,
    send_whatsapp: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.full_name || !formData.phone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      let sendVia: 'email' | 'whatsapp' | 'both' | undefined;
      if (formData.send_email && formData.send_whatsapp) sendVia = 'both';
      else if (formData.send_email) sendVia = 'email';
      else if (formData.send_whatsapp) sendVia = 'whatsapp';

      const { data, error } = await supabase.functions.invoke('create-patient-account', {
        body: {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          cpf: formData.cpf || undefined,
          birth_date: formData.birth_date || undefined,
          send_credentials_via: sendVia,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Gerar senha temporária (simulada, a real vem da edge function)
      setCredentials({
        email: formData.email,
        password: '(enviada por email/WhatsApp)'
      });
      setStep('success');
      toast.success('Paciente cadastrado com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (credentials) {
      navigator.clipboard.writeText(`Email: ${credentials.email}\nSenha: ${credentials.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('form');
    setCredentials(null);
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      cpf: '',
      birth_date: '',
      send_email: true,
      send_whatsapp: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Cadastrar Novo Paciente
              </DialogTitle>
              <DialogDescription>
                O paciente receberá as credenciais de acesso ao portal NeoCare.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome do paciente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Enviar credenciais via:</p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.send_email}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, send_email: checked as boolean })
                      }
                    />
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.send_whatsapp}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, send_whatsapp: checked as boolean })
                      }
                    />
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">WhatsApp</span>
                  </label>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Paciente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Paciente Cadastrado!
              </DialogTitle>
              <DialogDescription>
                As credenciais foram enviadas para o paciente.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm"><strong>Nome:</strong> {formData.full_name}</p>
              <p className="text-sm"><strong>Email:</strong> {formData.email}</p>
              <p className="text-sm"><strong>WhatsApp:</strong> {formData.phone}</p>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  A senha temporária foi enviada via {formData.send_email && formData.send_whatsapp ? 'email e WhatsApp' : formData.send_email ? 'email' : 'WhatsApp'}.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
