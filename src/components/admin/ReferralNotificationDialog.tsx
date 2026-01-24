import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, Mail, MessageCircle, Bell, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedReferral } from './ReferralsTable';

interface NotificationTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  subject: string;
  message: string;
  category: 'reminder' | 'info' | 'urgent' | 'gratitude';
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
    category: 'info',
    subject: '🎓 Bem-vindo(a) ao Programa de Indicação IBRAMEC!',
    message: `Olá {nome}!

Estamos muito felizes em ter você no nosso programa de indicação da Formação 360° em Transplante Capilar.

Nossa equipe entrará em contato em breve para apresentar todas as condições especiais disponíveis para você.

Fique de olho no seu WhatsApp e e-mail! 📲

Atenciosamente,
Equipe IBRAMEC`
  },
  {
    id: 'payment_reminder',
    name: 'Lembrete de Pagamento',
    icon: <Clock className="h-4 w-4 text-blue-500" />,
    category: 'reminder',
    subject: '⏰ Lembrete: Garanta sua vaga na Formação 360°',
    message: `Olá {nome}!

Passando para lembrar que sua vaga na Formação 360° em Transplante Capilar ainda está reservada!

Para garantir o seu desconto exclusivo de indicado e assegurar sua participação, realize o pagamento do sinal contratual.

Restou alguma dúvida? Estamos à disposição para ajudar!

Atenciosamente,
Equipe IBRAMEC`
  },
  {
    id: 'last_spots',
    name: 'Últimas Vagas',
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    category: 'urgent',
    subject: '🚨 URGENTE: Últimas vagas para a Formação 360°!',
    message: `Olá {nome}!

Estamos entrando em contato para informar que restam apenas poucas vagas para a próxima turma da Formação 360° em Transplante Capilar.

Não perca essa oportunidade única de transformar sua carreira na área de medicina capilar!

Entre em contato conosco agora mesmo para garantir sua vaga com condições especiais.

Atenciosamente,
Equipe IBRAMEC`
  },
  {
    id: 'payment_confirmed',
    name: 'Pagamento Confirmado',
    icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    category: 'gratitude',
    subject: '✅ Pagamento Confirmado - Formação 360° IBRAMEC',
    message: `Olá {nome}!

Parabéns! 🎉 Seu pagamento foi confirmado com sucesso!

Você agora faz parte oficial da próxima turma da Formação 360° em Transplante Capilar.

Em breve, você receberá todas as informações sobre:
• Data e local do curso
• Material didático
• Orientações pré-curso

Estamos muito felizes em tê-lo(a) conosco nessa jornada!

Atenciosamente,
Equipe IBRAMEC`
  },
  {
    id: 'thank_referrer',
    name: 'Agradecimento ao Indicador',
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
    category: 'gratitude',
    subject: '💜 Obrigado pela indicação!',
    message: `Olá {nome}!

Queremos agradecer pela indicação realizada! Sua confiança em nosso trabalho é muito importante para nós.

A pessoa indicada já está em nosso radar e nossa equipe entrará em contato em breve.

Lembre-se: quando sua indicação concluir a matrícula, você receberá a comissão de 5% sobre o valor do curso!

Continue indicando e construindo uma comunidade de excelência em transplante capilar.

Atenciosamente,
Equipe IBRAMEC`
  },
  {
    id: 'course_info',
    name: 'Informações do Curso',
    icon: <Bell className="h-4 w-4 text-cyan-500" />,
    category: 'info',
    subject: '📚 Informações sobre a Formação 360° em Transplante Capilar',
    message: `Olá {nome}!

Seguem as principais informações sobre a Formação 360° em Transplante Capilar:

📍 Localização: São Paulo (SP)
📅 Duração: 3 dias intensivos (presencial)
🎓 Certificação: MEC

O que você vai aprender:
• Técnicas avançadas de FUE e FUT
• Tricologia e diagnóstico capilar
• Prática em casos reais
• Gestão de clínica e marketing médico

Valor especial para indicados com desconto exclusivo!

Quer saber mais? Responda este e-mail ou entre em contato pelo WhatsApp.

Atenciosamente,
Equipe IBRAMEC`
  },
  {
    id: 'custom',
    name: 'Mensagem Personalizada',
    icon: <MessageCircle className="h-4 w-4 text-slate-500" />,
    category: 'info',
    subject: '',
    message: ''
  }
];

const CATEGORY_COLORS: Record<string, string> = {
  reminder: 'bg-blue-100 text-blue-700 border-blue-200',
  info: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
  gratitude: 'bg-purple-100 text-purple-700 border-purple-200'
};

interface ReferralNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referral: UnifiedReferral | null;
}

export function ReferralNotificationDialog({ 
  open, 
  onOpenChange, 
  referral 
}: ReferralNotificationDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('welcome');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendVia, setSendVia] = useState<'email' | 'whatsapp'>('email');

  const selectedTemplate = NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplateId);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (template && referral) {
      // Replace placeholders with actual data
      const personalizedMessage = template.message
        .replace(/{nome}/g, referral.name.split(' ')[0])
        .replace(/{nome_completo}/g, referral.name)
        .replace(/{email}/g, referral.email)
        .replace(/{indicador}/g, referral.referrer_name || 'N/A');
      
      setSubject(template.subject);
      setMessage(personalizedMessage);
    }
  };

  const handleSend = async () => {
    if (!referral || !message.trim()) {
      toast.error('Por favor, preencha a mensagem');
      return;
    }

    if (sendVia === 'email' && !subject.trim()) {
      toast.error('Por favor, preencha o assunto do e-mail');
      return;
    }

    setIsSending(true);

    try {
      if (sendVia === 'email') {
        const { data, error } = await supabase.functions.invoke('send-referral-notification', {
          body: {
            to: referral.email,
            name: referral.name,
            subject: subject,
            message: message,
            templateId: selectedTemplateId
          }
        });

        if (error) throw error;
        toast.success('E-mail enviado com sucesso!');
      } else {
        // WhatsApp - open in new tab
        const whatsappMessage = encodeURIComponent(message);
        const phone = referral.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${phone}?text=${whatsappMessage}`;
        window.open(whatsappUrl, '_blank');
        toast.success('WhatsApp aberto em nova aba');
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(`Erro ao enviar: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && referral) {
      handleTemplateChange('welcome');
    }
    onOpenChange(open);
  };

  if (!referral) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Enviar Notificação
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem predefinida ou personalizada para {referral.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm">{referral.name}</p>
              <p className="text-xs text-muted-foreground">{referral.email}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {referral.phone}
            </Badge>
          </div>

          <Separator />

          {/* Send Via */}
          <div className="space-y-2">
            <Label>Enviar via</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sendVia === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSendVia('email')}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                E-mail
              </Button>
              <Button
                type="button"
                variant={sendVia === 'whatsapp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSendVia('whatsapp')}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template de Mensagem</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      {template.icon}
                      <span>{template.name}</span>
                      {template.category && template.id !== 'custom' && (
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[template.category]}`}
                        >
                          {template.category === 'reminder' && 'Lembrete'}
                          {template.category === 'info' && 'Info'}
                          {template.category === 'urgent' && 'Urgente'}
                          {template.category === 'gratitude' && 'Agradecimento'}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject (email only) */}
          {sendVia === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto do e-mail"
              />
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[200px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{nome}'}, {'{nome_completo}'}, {'{email}'}, {'{indicador}'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1"
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {sendVia === 'email' ? 'Enviar E-mail' : 'Abrir WhatsApp'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
