/**
 * IPROMED - Templates de Documentos
 * Gestão de modelos para geração de documentos
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Loader2,
  Search,
  FileCheck,
  FileSignature,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  contrato: { label: 'Contrato', icon: FileCheck, color: 'bg-emerald-100 text-emerald-700' },
  peticao: { label: 'Petição', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  parecer: { label: 'Parecer', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  procuracao: { label: 'Procuração', icon: FileSignature, color: 'bg-amber-100 text-amber-700' },
  tcle: { label: 'TCLE', icon: FileSignature, color: 'bg-cyan-100 text-cyan-700' },
  notificacao: { label: 'Notificação', icon: AlertCircle, color: 'bg-rose-100 text-rose-700' },
};

export default function DocumentTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'contrato',
    content: '',
  });

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['ipromed-templates', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_document_templates')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    },
  });

  // Create/Update template
  const saveTemplate = useMutation({
    mutationFn: async () => {
      // Extract variables from content ({{variable}})
      const variableMatches = formData.content.match(/\{\{([^}]+)\}\}/g) || [];
      const variables = variableMatches.map(v => v.replace(/\{\{|\}\}/g, '').trim());

      if (editingTemplate) {
        const { error } = await supabase
          .from('ipromed_document_templates')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            content: formData.content,
            variables,
          })
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ipromed_document_templates')
          .insert([{
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            content: formData.content,
            variables,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-templates'] });
      toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!');
      closeForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_document_templates')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-templates'] });
      toast.success('Template removido');
    },
  });

  const openEditForm = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || '',
      category: template.category,
      content: template.content,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      category: 'contrato',
      content: '',
    });
  };

  const duplicateTemplate = (template: Template) => {
    setFormData({
      title: `${template.title} (cópia)`,
      description: template.description || '',
      category: template.category,
      content: template.content,
    });
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates de Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Modelos para geração de documentos jurídicos
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome do template"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do template"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo *</Label>
                  <span className="text-xs text-muted-foreground">
                    Use {"{{variavel}}"} para campos dinâmicos
                  </span>
                </div>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={`Exemplo:

CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{nome_contratante}}, inscrito no CPF sob o nº {{cpf_contratante}}, residente em {{endereco_contratante}}.

CONTRATADA: {{nome_contratada}}, inscrita no CNPJ sob o nº {{cnpj_contratada}}.

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto {{objeto_contrato}}.

...`}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveTemplate.mutate()}
                  disabled={!formData.title || !formData.content || saveTemplate.isPending}
                  className="bg-[#0066CC]"
                >
                  {saveTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTemplate ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-20 mb-4" />
            <p className="font-medium">Nenhum template encontrado</p>
            <p className="text-sm">Crie seu primeiro modelo de documento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const category = categoryConfig[template.category] || categoryConfig.contrato;
            const Icon = category.icon;

            return (
              <Card key={template.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg ${category.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className={category.color}>{category.label}</Badge>
                  </div>
                  
                  <h3 className="font-semibold mb-1">{template.title}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {template.variables && template.variables.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Variáveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditForm(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      onClick={() => deleteTemplate.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
