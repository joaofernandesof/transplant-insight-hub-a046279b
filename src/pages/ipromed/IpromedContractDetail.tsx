/**
 * Detalhes do Contrato - IPROMED
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Send,
  FileText,
  User,
  Calendar,
  Building,
  Loader2,
  Upload,
  Trash2,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  MoreVertical,
  ExternalLink,
  Edit,
  History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendForSignatureDialog } from "./components/contracts/SendForSignatureDialog";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500', icon: FileSignature },
  pending_signature: { label: 'Aguard. Assinatura', color: 'bg-amber-500', icon: Clock },
  signed: { label: 'Assinado', color: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-rose-500', icon: XCircle },
};

const documentTypes = [
  { value: 'contract', label: 'Contrato' },
  { value: 'amendment', label: 'Aditivo' },
  { value: 'attachment', label: 'Anexo' },
  { value: 'proof', label: 'Comprovante' },
  { value: 'other', label: 'Outro' },
];

interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string;
  uploaded_by?: string;
  created_at: string;
}

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type?: string;
  status: string;
  created_at: string;
  sent_at?: string;
  signed_at?: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    client_number?: string;
  };
}

export default function IpromedContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('contract');

  // Fetch contract details
  const { data: contract, isLoading } = useQuery({
    queryKey: ['ipromed-contract', id],
    queryFn: async (): Promise<Contract | null> => {
      const { data, error } = await supabase
        .from('ipromed_contracts')
        .select(`
          *,
          client:ipromed_legal_clients!ipromed_contracts_client_id_fkey(id, name, email, phone, client_number)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Contract;
    },
    enabled: !!id,
  });

  // Fetch contract documents
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['ipromed-contract-documents', id],
    queryFn: async (): Promise<ContractDocument[]> => {
      const { data, error } = await supabase
        .from('ipromed_contract_documents' as any)
        .select('*')
        .eq('contract_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContractDocument[];
    },
    enabled: !!id,
  });

  // Send for signature mutation
  const sendForSignature = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('ipromed_contracts')
        .update({ 
          status: 'pending_signature', 
          sent_at: new Date().toISOString(),
          // Store signature request metadata
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-contract', id] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-contracts'] });
      setSignatureDialogOpen(false);
      toast.success('Contrato enviado para assinatura!');
    },
  });

  // Handle signature request from dialog
  const handleSendForSignature = async (data: any) => {
    if (documents.length === 0) {
      toast.error('É necessário anexar pelo menos um documento antes de enviar para assinatura');
      return;
    }
    await sendForSignature.mutateAsync(data);
  };

  // Upload document
  const handleUpload = async () => {
    if (!uploadFile || !id) return;

    setUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${id}/${Date.now()}_${uploadFile.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('ipromed-contracts')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: dbError } = await supabase
        .from('ipromed_contract_documents' as any)
        .insert({
          contract_id: id,
          file_name: uploadFile.name,
          file_path: fileName,
          file_type: uploadFile.type,
          file_size: uploadFile.size,
          document_type: documentType,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['ipromed-contract-documents', id] });
      toast.success('Documento anexado com sucesso!');
      setUploadDialogOpen(false);
      setUploadFile(null);
    } catch (error: any) {
      toast.error('Erro ao enviar documento: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Preview document in modal
  const handlePreviewDoc = async (doc: ContractDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('ipromed-contracts')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setPreviewFileName(doc.file_name);
        setPreviewFileType(doc.file_type);
        setPreviewDialogOpen(true);
      }
    } catch (error: any) {
      toast.error('Erro ao visualizar documento: ' + error.message);
    }
  };

  // Download document directly
  const handleDownloadDoc = async (doc: ContractDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('ipromed-contracts')
        .download(doc.file_path);

      if (error) throw error;
      if (data) {
        // Create download link
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download iniciado!');
      }
    } catch (error: any) {
      toast.error('Erro ao baixar documento: ' + error.message);
    }
  };

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (doc: ContractDocument) => {
      await supabase.storage.from('ipromed-contracts').remove([doc.file_path]);
      const { error } = await supabase
        .from('ipromed_contract_documents' as any)
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-contract-documents', id] });
      toast.success('Documento removido!');
    },
  });

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return FileImage;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Contrato não encontrado</h3>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/ipromed/contracts')}>
              Voltar para Contratos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed/contracts')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Contratos
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{contract.contract_number || 'Detalhes'}</span>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === 'draft' && (
            <Button onClick={() => setSignatureDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Enviar para Assinatura
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Editar Contrato
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="h-4 w-4 mr-2" />
                Ver Histórico
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Cancelar Contrato
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contract Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Main Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-mono">{contract.contract_number}</p>
                  <h1 className="text-2xl font-bold mt-1">{contract.title}</h1>
                </div>
                <Badge className={`${status.color} text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {contract.description && (
                <p className="text-muted-foreground">{contract.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="text-sm font-medium">{contract.contract_type || 'Prestação de Serviço'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm font-medium">
                      {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {contract.sent_at && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg">
                      <Send className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Enviado em</p>
                      <p className="text-sm font-medium">
                        {format(new Date(contract.sent_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
                {contract.signed_at && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assinado em</p>
                      <p className="text-sm font-medium">
                        {format(new Date(contract.signed_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Sidebar */}
            {contract.client && (
              <Card className="lg:w-72 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente Vinculado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{contract.client.name}</p>
                  </div>
                  {contract.client.client_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Código</p>
                      <p className="font-mono text-sm">{contract.client.client_number}</p>
                    </div>
                  )}
                  {contract.client.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm truncate">{contract.client.email}</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => navigate(`/ipromed/clients/${contract.client.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Cliente
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Documents and History */}
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentos ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="signature" className="gap-2">
            <FileSignature className="h-4 w-4" />
            Assinatura Digital
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos do Contrato</CardTitle>
                <CardDescription>
                  Anexe e gerencie todos os documentos relacionados a este contrato
                </CardDescription>
              </div>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Anexar Documento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Tipo de Documento</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Arquivo</Label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                      <p className="text-xs text-muted-foreground">
                        PDF, Word, Excel ou imagens (máx. 10MB)
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                        {uploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Enviar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum documento anexado</h3>
                  <p className="text-muted-foreground mb-4">
                    Clique em "Anexar Documento" para adicionar arquivos
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const FileIcon = getFileIcon(doc.file_type);
                      const docTypeLabel = documentTypes.find(t => t.value === doc.document_type)?.label || 'Outro';
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg">
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium truncate max-w-[200px]">
                                {doc.file_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{docTypeLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Visualizar"
                                onClick={() => handlePreviewDoc(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Download"
                                onClick={() => handleDownloadDoc(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                                onClick={() => deleteDocument.mutate(doc)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="signature" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileSignature className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Assinatura Digital
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Integração com ClickSign e GOV.BR (ICP-Brasil)
                    </p>
                  </div>
                  <Badge variant="outline">
                    Em preparação
                  </Badge>
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  Em breve você poderá enviar contratos para assinatura digital com validade jurídica,
                  utilizando certificados ICP-Brasil ou assinatura eletrônica via ClickSign.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de envio para assinatura */}
      <SendForSignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        contractTitle={contract.title}
        clientName={contract.client?.name}
        clientEmail={contract.client?.email}
        documents={documents}
        onSend={handleSendForSignature}
        isPending={sendForSignature.isPending}
      />

      {/* Dialog de preview do documento */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewFileName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-[70vh] bg-muted/30">
            {previewUrl && (
              previewFileType.includes('pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-0"
                  title={previewFileName}
                />
              ) : previewFileType.includes('image') ? (
                <div className="flex items-center justify-center h-[70vh] p-4">
                  <img 
                    src={previewUrl} 
                    alt={previewFileName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                  <File className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Visualização não disponível para este tipo de arquivo
                  </p>
                  <Button onClick={() => {
                    window.open(previewUrl, '_blank');
                    setPreviewDialogOpen(false);
                  }}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em nova aba
                  </Button>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
