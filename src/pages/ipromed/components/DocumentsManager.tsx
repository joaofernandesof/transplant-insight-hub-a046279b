/**
 * IPROMED - Gestão de Documentos (GED)
 * Upload, organização e versionamento de documentos jurídicos
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Upload,
  Search,
  Plus,
  Download,
  Trash2,
  Eye,
  Folder,
  FileSignature,
  FileCheck,
  Loader2,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Document {
  id: string;
  client_id: string | null;
  case_id: string | null;
  title: string;
  description: string | null;
  category: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  status: string;
  version: number;
  created_at: string;
  ipromed_legal_clients?: { name: string } | null;
  ipromed_legal_cases?: { title: string } | null;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tcle: { label: 'TCLE', icon: FileSignature, color: 'bg-blue-100 text-blue-700' },
  contrato: { label: 'Contrato', icon: FileCheck, color: 'bg-emerald-100 text-emerald-700' },
  procuracao: { label: 'Procuração', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  peticao: { label: 'Petição', icon: FileText, color: 'bg-amber-100 text-amber-700' },
  parecer: { label: 'Parecer', icon: FileText, color: 'bg-cyan-100 text-cyan-700' },
  laudo: { label: 'Laudo', icon: FileText, color: 'bg-rose-100 text-rose-700' },
  outros: { label: 'Outros', icon: Folder, color: 'bg-gray-100 text-gray-700' },
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    category: 'outros',
    client_id: '',
    case_id: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['ipromed-documents', searchTerm, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_documents')
        .select(`
          *,
          ipromed_legal_clients(name),
          ipromed_legal_cases(title)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by search term
      if (searchTerm) {
        return (data as Document[]).filter(doc => 
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return data as Document[];
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Upload mutation
  const uploadDocument = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Nenhum arquivo selecionado');
      
      setUploading(true);
      
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `documents/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ipromed-documents')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ipromed-documents')
        .getPublicUrl(filePath);
      
      // Insert document record
      const { error: insertError } = await supabase
        .from('ipromed_documents')
        .insert([{
          title: newDoc.title || selectedFile.name,
          description: newDoc.description || null,
          category: newDoc.category,
          client_id: newDoc.client_id || null,
          case_id: newDoc.case_id || null,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
          file_size: selectedFile.size,
          file_type: fileExt,
        }]);
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-documents'] });
      toast.success('Documento enviado com sucesso!');
      setIsUploadOpen(false);
      setSelectedFile(null);
      setNewDoc({ title: '', description: '', category: 'outros', client_id: '', case_id: '' });
    },
    onError: (error) => {
      toast.error('Erro ao enviar documento: ' + error.message);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  // Delete mutation
  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from('ipromed_documents')
        .update({ status: 'deleted' })
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-documents'] });
      toast.success('Documento removido');
    },
  });

  const stats = {
    total: documents.length,
    tcle: documents.filter(d => d.category === 'tcle').length,
    contratos: documents.filter(d => d.category === 'contrato').length,
    outros: documents.filter(d => !['tcle', 'contrato'].includes(d.category)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Gestão eletrônica de documentos jurídicos
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Upload className="h-4 w-4" />
              Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label>Arquivo *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!newDoc.title) {
                          setNewDoc(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
                        }
                      }
                    }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-[#0066CC]" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para selecionar ou arraste um arquivo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, JPG, PNG (máx. 20MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newDoc.title}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do documento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newDoc.category}
                    onValueChange={(v) => setNewDoc(prev => ({ ...prev, category: v }))}
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
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={newDoc.client_id}
                    onValueChange={(v) => setNewDoc(prev => ({ ...prev, client_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Observações sobre o documento..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => uploadDocument.mutate()}
                  disabled={!selectedFile || uploading}
                  className="bg-[#0066CC]"
                >
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#0066CC]/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">TCLEs</div>
                <div className="text-2xl font-bold text-blue-600">{stats.tcle}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileSignature className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Contratos</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.contratos}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Outros</div>
                <div className="text-2xl font-bold text-gray-600">{stats.outros}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Folder className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Nenhum documento encontrado</p>
              <p className="text-sm">Envie seu primeiro documento jurídico</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">DOCUMENTO</TableHead>
                  <TableHead className="text-xs font-semibold">CATEGORIA</TableHead>
                  <TableHead className="text-xs font-semibold">CLIENTE</TableHead>
                  <TableHead className="text-xs font-semibold">TAMANHO</TableHead>
                  <TableHead className="text-xs font-semibold">DATA</TableHead>
                  <TableHead className="text-xs font-semibold w-[120px]">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const category = categoryConfig[doc.category] || categoryConfig.outros;
                  const CategoryIcon = category.icon;
                  
                  return (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${category.color} flex items-center justify-center`}>
                            <CategoryIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={category.color}>{category.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.ipromed_legal_clients?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(doc.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.file_url;
                              link.download = doc.file_name;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700"
                            onClick={() => deleteDocument.mutate(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
