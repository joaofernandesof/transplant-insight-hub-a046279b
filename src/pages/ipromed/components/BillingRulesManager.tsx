/**
 * CPG Advocacia Médica - Régua de Cobrança
 * Configuração de lembretes e cobranças automáticas
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  Clock,
  AlertTriangle,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface BillingRule {
  id: string;
  name: string;
  description: string | null;
  days_before_due: number;
  days_after_due: number[];
  send_email: boolean;
  send_whatsapp: boolean;
  reminder_template: string | null;
  overdue_template: string | null;
  is_active: boolean;
  created_at: string;
}

export default function BillingRulesManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BillingRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days_before_due: 3,
    days_after_due: '1, 3, 7, 15, 30',
    send_email: true,
    send_whatsapp: false,
    reminder_template: 'Olá {{nome}}, sua fatura no valor de {{valor}} vence em {{dias}} dias.',
    overdue_template: 'Olá {{nome}}, sua fatura no valor de {{valor}} está vencida há {{dias}} dias. Regularize para evitar juros.',
  });

  const queryClient = useQueryClient();

  // Fetch rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['ipromed-billing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_billing_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BillingRule[];
    },
  });

  // Save rule
  const saveRule = useMutation({
    mutationFn: async () => {
      const daysAfter = formData.days_after_due
        .split(',')
        .map(d => parseInt(d.trim()))
        .filter(d => !isNaN(d));

      const payload = {
        name: formData.name,
        description: formData.description || null,
        days_before_due: formData.days_before_due,
        days_after_due: daysAfter,
        send_email: formData.send_email,
        send_whatsapp: formData.send_whatsapp,
        reminder_template: formData.reminder_template || null,
        overdue_template: formData.overdue_template || null,
      };

      if (editingRule) {
        const { error } = await supabase
          .from('ipromed_billing_rules')
          .update(payload)
          .eq('id', editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ipromed_billing_rules')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-billing-rules'] });
      toast.success(editingRule ? 'Régua atualizada!' : 'Régua criada!');
      closeForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Toggle active
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('ipromed_billing_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-billing-rules'] });
    },
  });

  // Delete rule
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_billing_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-billing-rules'] });
      toast.success('Régua removida');
    },
  });

  const openEditForm = (rule: BillingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      days_before_due: rule.days_before_due,
      days_after_due: rule.days_after_due?.join(', ') || '',
      send_email: rule.send_email,
      send_whatsapp: rule.send_whatsapp,
      reminder_template: rule.reminder_template || '',
      overdue_template: rule.overdue_template || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      days_before_due: 3,
      days_after_due: '1, 3, 7, 15, 30',
      send_email: true,
      send_whatsapp: false,
      reminder_template: 'Olá {{nome}}, sua fatura no valor de {{valor}} vence em {{dias}} dias.',
      overdue_template: 'Olá {{nome}}, sua fatura no valor de {{valor}} está vencida há {{dias}} dias. Regularize para evitar juros.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-600" />
            Régua de Cobrança
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure lembretes e cobranças automáticas
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Plus className="h-4 w-4" />
              Nova Régua
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Editar Régua' : 'Nova Régua de Cobrança'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Régua Padrão"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias antes do vencimento</Label>
                  <Input
                    type="number"
                    value={formData.days_before_due}
                    onChange={(e) => setFormData(prev => ({ ...prev, days_before_due: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lembrete X dias antes de vencer
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Dias após vencimento</Label>
                  <Input
                    value={formData.days_after_due}
                    onChange={(e) => setFormData(prev => ({ ...prev, days_after_due: e.target.value }))}
                    placeholder="1, 3, 7, 15, 30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cobranças nos dias após vencer (separados por vírgula)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.send_email}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, send_email: v }))}
                  />
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.send_whatsapp}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, send_whatsapp: v }))}
                  />
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template de Lembrete (antes de vencer)</Label>
                <Textarea
                  value={formData.reminder_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_template: e.target.value }))}
                  placeholder="Use {{nome}}, {{valor}}, {{dias}}, {{vencimento}}"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Template de Cobrança (após vencer)</Label>
                <Textarea
                  value={formData.overdue_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, overdue_template: e.target.value }))}
                  placeholder="Use {{nome}}, {{valor}}, {{dias}}, {{vencimento}}"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveRule.mutate()}
                  disabled={!formData.name || saveRule.isPending}
                  className="bg-[#0066CC]"
                >
                  {saveRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRule ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-20 mb-4" />
            <p className="font-medium">Nenhuma régua configurada</p>
            <p className="text-sm">Crie sua primeira régua de cobrança</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={`border-0 shadow-lg ${!rule.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-amber-600" />
                    {rule.name}
                  </CardTitle>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(v) => toggleActive.mutate({ id: rule.id, is_active: v })}
                  />
                </div>
                {rule.description && (
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Antes do vencimento</p>
                      <p className="font-medium">{rule.days_before_due} dias</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Após vencimento</p>
                      <p className="font-medium">{rule.days_after_due?.join(', ')} dias</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rule.send_email && (
                    <Badge variant="outline" className="gap-1">
                      <Mail className="h-3 w-3" />
                      E-mail
                    </Badge>
                  )}
                  {rule.send_whatsapp && (
                    <Badge variant="outline" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      WhatsApp
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditForm(rule)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600"
                    onClick={() => deleteRule.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
