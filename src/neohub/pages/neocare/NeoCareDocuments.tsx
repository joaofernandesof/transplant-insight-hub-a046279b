import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { useNeoHubAuth } from '@/neohub/contexts/NeoHubAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  description: string | null;
  created_at: string | null;
}

const categoryConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  exame: { label: 'Exame', color: 'bg-blue-500', icon: <FileSpreadsheet className="h-4 w-4" /> },
  laudo: { label: 'Laudo', color: 'bg-green-500', icon: <FileText className="h-4 w-4" /> },
  receita: { label: 'Receita', color: 'bg-purple-500', icon: <FileText className="h-4 w-4" /> },
  atestado: { label: 'Atestado', color: 'bg-orange-500', icon: <FileText className="h-4 w-4" /> },
  foto: { label: 'Foto', color: 'bg-pink-500', icon: <ImageIcon className="h-4 w-4" /> },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: <File className="h-4 w-4" /> },
};

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
  
  if (fileType.includes('image')) {
    return <ImageIcon className="h-8 w-8 text-pink-500" />;
  }
  if (fileType.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function NeoCareDocuments() {
  const { user, session } = useNeoHubAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  async function fetchDocuments() {
    if (!user?.userId) return;
    const authUserId = user.userId;
    
    setIsLoading(true);
    try {
      // Buscar o patient_id do usuário logado
      const { data: patientData } = await supabase
        .from('portal_patients')
        .select('id')
        .eq('portal_user_id', (
          await supabase
            .from('portal_users')
            .select('id')
            .eq('user_id', authUserId)
            .single()
        ).data?.id)
        .single();

      if (!patientData) {
        // Tentar buscar via neohub_users
        const { data: neohubUser } = await supabase
          .from('neohub_users')
          .select('id')
          .eq('user_id', authUserId)
          .single();

        if (neohubUser) {
          // Buscar documentos associados a este usuário
          const { data: attachments, error } = await supabase
            .from('portal_attachments')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && attachments) {
            setDocuments(attachments);
          }
        }
        setIsLoading(false);
        return;
      }

      // Buscar anexos do paciente
      const { data: attachments, error } = await supabase
        .from('portal_attachments')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(attachments || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(doc: Document) {
    try {
      // Se for URL do storage, fazer download via supabase
      if (doc.file_url.includes('patient-documents')) {
        const { data, error } = await supabase.storage
          .from('patient-documents')
          .download(doc.file_url.split('patient-documents/')[1] || doc.file_url);
        
        if (error) throw error;
        
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // URL externa
        window.open(doc.file_url, '_blank');
      }
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar arquivo');
    }
  }

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => d.category === selectedCategory);

  const categories = ['all', ...Object.keys(categoryConfig)];

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--neocare-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Meus Documentos</h1>
        <p className="text-muted-foreground">Exames, laudos e documentos médicos</p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="gap-1">
              {config.icon}
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground">
                  {selectedCategory === 'all' 
                    ? 'Seus documentos médicos aparecerão aqui quando disponíveis.'
                    : `Não há documentos na categoria "${categoryConfig[selectedCategory]?.label}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => {
                const category = categoryConfig[doc.category || 'outro'] || categoryConfig.outro;
                
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="shrink-0 p-3 bg-muted rounded-lg">
                          {getFileIcon(doc.file_type)}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate" title={doc.file_name}>
                            {doc.file_name}
                          </h4>
                          
                          {doc.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {doc.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className={`${category.color} text-white`}>
                              {category.label}
                            </Badge>
                            
                            {doc.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            )}
                          </div>
                          
                          {doc.created_at && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(doc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        {doc.file_type?.includes('image') || doc.file_type?.includes('pdf') ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        ) : null}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.file_name}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {previewDoc?.file_type?.includes('image') ? (
              <img 
                src={previewDoc.file_url} 
                alt={previewDoc.file_name}
                className="w-full rounded-lg"
              />
            ) : previewDoc?.file_type?.includes('pdf') ? (
              <iframe 
                src={previewDoc.file_url}
                className="w-full h-[70vh] rounded-lg"
                title={previewDoc.file_name}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Visualização não disponível para este tipo de arquivo.
              </p>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={() => previewDoc && handleDownload(previewDoc)}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
